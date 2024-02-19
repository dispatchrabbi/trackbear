import { Router, Request } from "express";
import { z } from 'zod';
import winston from "winston";
import { addMinutes, addDays } from 'date-fns';

import { validateBody, validateParams } from "../lib/middleware/validate.ts";
import { ApiResponse, success, failure } from '../lib/api-response.ts';

import dbClient from '../lib/db.ts';
import { PasswordResetLink, PendingEmailVerification, User, UserAuth } from "@prisma/client";
import { hash, verifyHash } from "../lib/hash.ts";
import { logIn, logOut, requireUser, WithUser } from "../lib/auth.ts";
import { PASSWORD_RESET_LINK_STATE } from "../lib/states.ts";
import { USER_STATE } from "../lib/entities/user.ts";
import CONFIG from '../config.ts';

import { pushTask } from "../lib/queue.ts";
import sendSignupEmailTask from '../lib/tasks/send-signup-email.ts';
import sendEmailverificationEmail from "../lib/tasks/send-emailverification-email.ts";
import sendPwchangeEmail from "../lib/tasks/send-pwchange-email.ts";

import { logAuditEvent } from '../lib/audit-events.ts';
import sendPwresetEmail from "../lib/tasks/send-pwreset-email.ts";

export type CreateUserPayload = {
  username: string;
  email: string;
  password: string;
};
export const USERNAME_REGEX = /^[a-z][a-z0-9_-]+$/;
const createUserPayloadSchema = z.object({
  username: z.string().trim().toLowerCase()
    .min(3, { message: 'Username must be at least 3 characters long.'})
    .max(24, { message: 'Username may not be longer than 24 characters.'})
    .regex(USERNAME_REGEX, { message: 'Username must begin with a letter and consist only of letters, numbers, dashes, and underscores.' }),
  password: z.string().min(8, { message: 'Password must be at least 8 characters long.' }),
  email: z.string().email({ message: 'Please enter a valid email address.' }),
});

export type ChangePasswordPayload = {
  currentPassword: string;
  newPassword: string;
};
const changePasswordPayloadSchema = z.object({
  currentPassword: z.string().min(1, { message: 'Current password is required.' }),
  newPassword: z.string().min(8, { message: 'New password must be at least 8 characters long.' }),
});

export type RequestPasswordResetPayload = {
  username: string;
};
const requestPasswordResetPayloadSchema = z.object({
  username: z.string().trim().toLowerCase()
    .min(3, { message: 'Username must be at least 3 characters long.'})
    .max(24, { message: 'Username may not be longer than 24 characters.'})
    .regex(USERNAME_REGEX, { message: 'Username must begin with a letter and consist only of letters, numbers, dashes, and underscores.' }),
});

export type PasswordResetPayload = {
  newPassword: string;
};
const passwordResetPayloadSchema = z.object({
  newPassword: z.string().min(8, { message: 'New password must be at least 8 characters long.' }),
});

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
  let userAuth: UserAuth | null;
  try {
    user = await dbClient.user.findUnique({ where: { username } });
    if(user) {
      userAuth = await dbClient.userAuth.findUnique({ where: { userId: user.id } });
    }
  } catch(err) { return next(err); }

  if(!user) {
    winston.info(`LOGIN: ${username} attempted to log in but does not exist`);
    return res.status(400).send(failure('INCORRECT_CREDS', 'Incorrect username or password.'));
  } else if(!userAuth) {
    winston.error(`LOGIN: ${username} attempted to log in but does not have userauth!`);
    return res.status(400).send(failure('INCORRECT_CREDS', 'Incorrect username or password.'));
  }

  if(user.state !== USER_STATE.ACTIVE) {
    winston.info(`LOGIN: ${username} attempted to log in but account state is ${user.state}`);
    return res.status(400).send(failure('INCORRECT_CREDS', 'Incorrect username or password.'));
  }

  let verified: boolean;
  try {
    verified = await verifyHash(userAuth.password, password, userAuth.salt);
  } catch(err) { return next(err); }

  if(!verified) {
    winston.debug(`LOGIN: ${username} had the incorrect password`);
    return res.status(400).send(failure('INCORRECT_CREDS', 'Incorrect username or password.'));
  }

  logIn(req, user);
  winston.debug(`LOGIN: ${username} successfully logged in`);
  await logAuditEvent('user:login', user.id);

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
});

// logout ought to requireUser but since all it does is remove that user,
// it's okay to just... let anyone log out at any time, even if they're not logged in.
type EmptyObject = Record<string, never>;
authRouter.post('/logout', (req, res: ApiResponse<EmptyObject>) => {
  logOut(req);
  res.status(200).send(success({}));
});

authRouter.post('/signup',
  validateBody(createUserPayloadSchema),
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
    state: USER_STATE.ACTIVE,
    username: username,
    displayName: username,
    email: email,
    isEmailVerified: false,
  };

  const userAuthData = {
    password: hashedPassword,
    salt: salt,
  };

  const pendingEmailVerificationData = {
    newEmail: userData.email,
    expiresAt: addDays(new Date(), CONFIG.EMAIL_VERIFICATION_TIMEOUT_IN_DAYS),
  };

  try {
    const user = await dbClient.user.create({
      data: {
        ...userData,
        userAuth: { create: userAuthData },
        pendingEmailVerifications: { create: pendingEmailVerificationData },
      },
      include: {
        pendingEmailVerifications: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });
    await logAuditEvent('user:signup', user.id, user.id);
    winston.debug(`SIGNUP: ${user.id} just signed up`);

    pushTask(sendSignupEmailTask.makeTask(user.id));
    pushTask(sendEmailverificationEmail.makeTask(user.pendingEmailVerifications[0].uuid));

    res.status(201).send(success({
      uuid: user.uuid,
      username: user.username,
      displayName: user.displayName,
    }));
  } catch(err) { return next(err); }
});

authRouter.post('/verify-email',
  requireUser,
  async (req: WithUser<Request>, res: ApiResponse<EmptyObject>, next) =>
{
  const user: User = req.user;

  if(user.isEmailVerified) {
    // if the user is already verified, no-op and send a 200 (instead of 201)
    return res.status(200).send(success({}));
  }

  const pendingEmailVerificationData = {
    userId: user.id,
    newEmail: user.email,
    expiresAt: addDays(new Date(), CONFIG.EMAIL_VERIFICATION_TIMEOUT_IN_DAYS),
  };

  try {
    const pendingEmailVerification = await dbClient.pendingEmailVerification.create({
      data: pendingEmailVerificationData,
    });
    pushTask(sendEmailverificationEmail.makeTask(pendingEmailVerification.uuid));
  } catch(err) { return next(err); }

  return res.status(201).send(success({}));
});

authRouter.post('/verify-email/:uuid',
  validateParams(z.object({
    uuid: z.string().uuid(),
  })),
  async (req: Request, res: ApiResponse<EmptyObject>, next) =>
{
  const uuid = req.params.uuid;
  let verification: PendingEmailVerification & { user: User } | null;
  try {
    verification = await dbClient.pendingEmailVerification.findUnique({
      where: {
        uuid,
        expiresAt: { gt: new Date() },
      },
      include: {
        user: true,
      },
    });
  } catch(err) { return next(err); }

  const user = verification?.user;

  if(!(
    verification && // we found a non-expired verification for this uuid
    verification.newEmail === user.email && // it's for the current email
    user.isEmailVerified === false // the email hasn't already been verified
  )) {
    return res.status(404).send(failure('NOT_FOUND', 'Could not verify your email. This verification link is either expired, already used, or invalid. Check your link and try again.'));
  }

  // now we mark the email verified and delete all pending verifications for this email
  try {
    await dbClient.user.update({
      data: {
        isEmailVerified: true,
        pendingEmailVerifications: { deleteMany: {} },
      },
      where: { id: user.id },
    });
  } catch(err) { return next(err); }

  await logAuditEvent('user:verifyemail', user.id, user.id, null, { verificationUuid: verification.uuid, email: verification.newEmail });
  winston.debug(`VERIFY: ${user.id} just verified their email`);

  return res.status(200).send(success({}));
});

authRouter.post('/password',
  requireUser,
  validateBody(changePasswordPayloadSchema),
  async (req: WithUser<Request>, res: ApiResponse<EmptyObject>, next) =>
{
  const { currentPassword, newPassword } = req.body;

  // first make sure that we know that the userauth exists
  let userAuth: UserAuth | null;
  try {
    userAuth = await dbClient.userAuth.findUnique({ where: { userId: req.user.id } });
  } catch(err) { return next(err); }

  if(!userAuth) {
    winston.error(`LOGIN: ${req.user.id} attempted to change their password but they were not found!`);
    return res.status(403).send(failure('INVALID_USER', 'Invalid user.'));
  }

  // then validate the password
  let verified: boolean;
  try {
    verified = await verifyHash(userAuth.password, currentPassword, userAuth.salt);
  } catch(err) { return next(err); }

  if(!verified) {
    winston.debug(`LOGIN: ${req.user.id} had the incorrect password`);
    return res.status(400).send(failure('INCORRECT_CREDS', 'Incorrect password.'));
  }

  // now, change out the password
  let hashedPassword: string, salt: string;
  try {
    ({ hashedPassword, salt } = await hash(newPassword));
  } catch(err) { return next(err); }

  try {
    userAuth = await dbClient.userAuth.update({
      data: {
        password: hashedPassword,
        salt: salt,
      },
      where: {
        userId: req.user.id,
      },
    });
  } catch(err) { return next(err); }

  winston.debug(`PASSWORD: ${req.user.id} has changed their password`);
  await logAuditEvent('user:pwchange', req.user.id, req.user.id);
  pushTask(sendPwchangeEmail.makeTask(req.user.id));

  return res.status(200).send(success({}));
});

authRouter.post('/reset-password',
  validateBody(requestPasswordResetPayloadSchema),
  async (req: Request, res: ApiResponse<EmptyObject>, next) =>
{
  const username = req.body.username;

  let user: User | null;
  try {
    user = await dbClient.user.findUnique({
      where: {
        username,
        state: USER_STATE.ACTIVE,
      },
    });
  } catch(err) { return next(err); }

  if(!user) {
    // Even though there was no user found, we send back success so that we don't leak which usernames do and don't exist
    winston.warn(`PWRESET: Attempted reset for nonexistent username ${username}`);
    return res.status(200).send(success({}));
  }

  let resetLink: PasswordResetLink;
  try {
    resetLink = await dbClient.passwordResetLink.create({
      data: {
        userId: user.id,
        state: PASSWORD_RESET_LINK_STATE.ACTIVE,
        expiresAt: addMinutes(new Date(), CONFIG.PASSWORD_RESET_LINK_TIMEOUT_IN_MINUTES),
      }
    });
  } catch(err) { return next(err); }

  winston.debug(`PASSWORD: ${user.id} requested a reset link and got ${resetLink.uuid}`);
  await logAuditEvent('user:pwresetreq', user.id, null, null, { resetLinkUuid: resetLink.uuid });
  pushTask(sendPwresetEmail.makeTask(resetLink.uuid));

  return res.status(201).send(success({}));
});

authRouter.post('/reset-password/:uuid',
  validateParams(z.object({
    uuid: z.string().uuid(),
  })),
  validateBody(passwordResetPayloadSchema),
  async (req: Request, res: ApiResponse<EmptyObject>, next) =>
{
  const uuid = req.params.uuid;
  let passwordResetLink: PasswordResetLink | null;
  try {
    passwordResetLink = await dbClient.passwordResetLink.findUnique({
      where: {
        uuid,
        expiresAt: { gt: new Date() },
        state: PASSWORD_RESET_LINK_STATE.ACTIVE,
      },
    });
  } catch(err) { return next(err); }

  if(!passwordResetLink) {
    return res.status(404).send(failure('NOT_FOUND', 'This reset link is either expired or bogus. You should request a new one.'));
  }

  // now, change out the password
  const newPassword = req.body.newPassword;
  let hashedPassword: string, salt: string;
  try {
    ({ hashedPassword, salt } = await hash(newPassword));
  } catch(err) { return next(err); }

  let userAuth: UserAuth & { user: User } | null;
  try {
    userAuth = await dbClient.userAuth.update({
      data: {
        password: hashedPassword,
        salt: salt,
      },
      where: {
        userId: passwordResetLink.userId,
      },
      include: { user: true },
    });

    await dbClient.passwordResetLink.update({
      data: {
        state: PASSWORD_RESET_LINK_STATE.USED,
      },
      where: {
        uuid: passwordResetLink.uuid,
      },
    });
  } catch(err) { return next(err); }

  // this should basically never happen...
  if(!userAuth) {
    winston.error(`PASSWORD: User ${passwordResetLink.userId} attempted to reset their password but no UserAuth record was found!`);
    return res.status(403).send(failure('INVALID_USER', 'Invalid user.'));
  }

  const user = userAuth.user;
  winston.debug(`PASSWORD: ${user.id} has reset their password`);
  await logAuditEvent('user:pwreset', user.id, user.id);
  pushTask(sendPwchangeEmail.makeTask(user.id));

  return res.status(200).send(success({}));
});

export default authRouter;
