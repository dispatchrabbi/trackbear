import { Router } from "express";
import { z } from 'zod';

import { validateBody } from "../lib/middleware/validate.ts";

import dbClient from '../lib/db.ts';
import { hash, verifyHash } from "../lib/hash.ts";
import { logIn, logOut, requireUser, RequestWithUser } from "../lib/auth.ts";
import { User } from "@prisma/client";
import { USER_STATE } from "../lib/states.ts";

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
  validateBody(z.object({ username: z.string(), password: z.string() })),
  async (req, res, next) =>
{
  const { username, password } = req.body;

  let user: User | null;
  try {
    user = await dbClient.user.findUnique({ where: { username }});
  } catch(err) { return next(err); }

  if(!user) {
    console.debug(`LOGIN: ${username} does not exist`);
    return res.status(400).send({ message: 'Incorrect username or password'});
  }

  if(user.state !== USER_STATE.ACTIVE) {
    console.debug(`LOGIN: ${username} attempted to log in but account state is ${user.state}`);
    return res.status(400).send({ message: 'Incorrect username or password'});
  }

  let verified: boolean;
  try {
    verified = await verifyHash(user.password, password, user.salt);
  } catch(err) { return next(err); }

  if(!verified) {
    console.debug(`LOGIN: ${username} had the incorrect password`);
    return res.status(400).send({ message: 'Incorrect username or password'});
  }

  logIn(req, user);
  console.debug(`LOGIN: ${username} successfully logged in`);

  const userResponse: UserResponse = {
    uuid: user.uuid,
    username: user.username,
    displayName: user.displayName,
  };
  return res.status(200).send(userResponse);
});

authRouter.get('/user', requireUser, (req, res) => {
  const user = (req as RequestWithUser<typeof req>).user;
  const userResponse: UserResponse = {
    uuid: user.uuid,
    username: user.username,
    displayName: user.displayName,
  };

  res.status(200).send(userResponse);
})

// logout ought to requireUser but since all it does is remove that user,
// it's okay to just... let anyone log out at any time, even if they're not logged in.
authRouter.post('/logout', (req, res) => {
  logOut(req);
  res.status(200).send({});
})

authRouter.post('/signup',
  validateBody(z.object({ username: z.string(), password: z.string(), email: z.string().email() })),
  async (req, res, next) =>
{
  const { username, password, email } = req.body as CreateUserPayload;

  // check username for uniqueness
  const existingUserWithThisUsername = await dbClient.user.findUnique({
    where: { username }
  });
  if(existingUserWithThisUsername) {
    return res.status(409).send({ message: 'A user with that username already exists' });
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
    console.debug(`SIGNUP: ${user.username} just signed up`);

    // TODO: kick off email verification/confirmation afterward
    res.status(201).send({ message: 'Sign-up successful' });
  } catch(err) {
    console.error(err);
    res.status(500).send({ message: 'Sign-up was unsuccessful' });
  }
});

export default authRouter;
