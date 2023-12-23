import { Router, Request } from "express";
import { z } from 'zod';
import winston from "winston";

import { validateBody } from "../lib/middleware/validate.ts";
import { ApiResponse, success, failure } from '../lib/api-response.ts';

import dbClient from '../lib/db.ts';
import { User } from "@prisma/client";
import { hash, verifyHash } from "../lib/hash.ts";
import { logIn, logOut, requireUser, WithUser } from "../lib/auth.ts";
import { USER_STATE } from "../lib/states.ts";

import { logAuditEvent } from '../lib/audit-events.ts';

export type CreateUserPayload = {
  username: string;
  email: string;
  password: string;
};

export type UserResponse = {
  uuid: string;
  username: string;
  displayName: string;
};

const authRouter = Router();

authRouter.post('/login',
  validateBody(z.object({ username: z.string().toLowerCase(), password: z.string() })),
  async (req: Request, res: ApiResponse<UserResponse>, next) =>
{
  const { username, password } = req.body;

  let user: User | null;
  try {
    user = await dbClient.user.findUnique({ where: { username }});
  } catch(err) { return next(err); }

  if(!user) {
    winston.info(`LOGIN: ${username} attempted to log in but does not exist`);
    return res.status(400).send(failure('INCORRECT_CREDS', 'Incorrect username or password.'));
  }

  if(user.state !== USER_STATE.ACTIVE) {
    winston.info(`LOGIN: ${username} attempted to log in but account state is ${user.state}`);
    return res.status(400).send(failure('INCORRECT_CREDS', 'Incorrect username or password.'));
  }

  let verified: boolean;
  try {
    verified = await verifyHash(user.password, password, user.salt);
  } catch(err) { return next(err); }

  if(!verified) {
    winston.debug(`LOGIN: ${username} had the incorrect password`);
    return res.status(400).send(failure('INCORRECT_CREDS', 'Incorrect username or password.'));
  }

  logIn(req, user);
  winston.debug(`LOGIN: ${username} successfully logged in`);
  logAuditEvent('login', user.id);

  const userResponse: UserResponse = {
    uuid: user.uuid,
    username: user.username,
    displayName: user.displayName,
  };
  return res.status(200).send(success(userResponse));
});

authRouter.get('/user',
  requireUser,
  (req: WithUser<Request>, res: ApiResponse<UserResponse>) =>
{
  const user = req.user;
  const userResponse: UserResponse = {
    uuid: user.uuid,
    username: user.username,
    displayName: user.displayName,
  };

  res.status(200).send(success(userResponse));
})

// logout ought to requireUser but since all it does is remove that user,
// it's okay to just... let anyone log out at any time, even if they're not logged in.
type EmptyObject = Record<string, never>;
authRouter.post('/logout', (req, res: ApiResponse<EmptyObject>) => {
  logOut(req);
  res.status(200).send(success({}));
})

export const USERNAME_REGEX = /^[a-z][a-z0-9_-]+$/;
authRouter.post('/signup',
  validateBody(z.object({ username: z.string(), password: z.string(), email: z.string().email() })),
  async (req, res: ApiResponse<UserResponse>, next) =>
{
  const { username: submittedUsername, password, email } = req.body as CreateUserPayload;

  // validate the username: must start with a letter and only contain letters, numbers, and underscore/dash
  const username = submittedUsername.trim().toLowerCase();
  if(!USERNAME_REGEX.test(username)) {
    return res.status(409).send(failure('INVALID_USERNAME', 'Your username must begin with a letter and consist only of letters, numbers, dashes, and underscores.'));
  }

  // check username for uniqueness
  const existingUserWithThisUsername = await dbClient.user.findUnique({
    where: { username }
  });
  if(existingUserWithThisUsername) {
    return res.status(409).send(failure('USERNAME_EXISTS', 'A user with that username already exists.'));
  }

  let hashedPassword: string, salt: string;
  try {
    ({ hashedPassword, salt } = await hash(password));
  } catch(err) { return next(err); }

  const userData = {
    email: email,
    username: username,
    displayName: username,
    password: hashedPassword,
    salt: salt,
    state: USER_STATE.ACTIVE,
  };

  try {
    const user = await dbClient.user.create({ data: userData });
    await logAuditEvent('signup', user.id);
    winston.debug(`SIGNUP: ${user.username} just signed up`);

    // TODO: kick off email verification/confirmation afterward
    res.status(201).send(success({
      uuid: user.uuid,
      username: user.username,
      displayName: user.displayName,
    }));
  } catch(err) {
    return next(err);
  }
});

export default authRouter;
