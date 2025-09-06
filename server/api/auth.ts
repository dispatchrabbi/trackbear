import { Request } from 'express';
import { z } from 'zod';

import { getLogger } from 'server/lib/logger.ts';
const logger = getLogger();

import { HTTP_METHODS, ACCESS_LEVEL, type RouteConfig } from 'server/lib/api.ts';
import { zUuidParam } from 'server/lib/validators.ts';
import { ApiResponse, success, failure } from '../lib/api-response.ts';

import type { User } from 'generated/prisma/client';
import { logIn, logOut } from '../lib/auth.ts';
import { RequestWithUser } from 'server/lib/middleware/access.ts';
import { USER_STATE, USERNAME_REGEX } from '../lib/models/user/consts.ts';
import { RecordNotFoundError, ValidationError } from '../lib/models/errors.ts';

import { logAuditEvent } from '../lib/audit-events.ts';
import { UserModel } from 'server/lib/models/user/user-model.ts';
import { AUDIT_EVENT_TYPE } from 'server/lib/models/audit-event/consts.ts';
import { reqCtx } from 'server/lib/request-context.ts';

export type LoginPayload = {
  username: string;
  password: string;
};
const zLoginPayload = z.object({
  username: z.string().toLowerCase(),
  password: z.string(),
});

export async function handleLogin(req: Request, res: ApiResponse<User>) {
  const { username, password } = req.body as LoginPayload;

  const user: User | null = await UserModel.getUserByUsername(username);
  if(!user) {
    logger.info(`LOGIN: ${username} attempted to log in but does not exist`);
    return res.status(400).send(failure('INCORRECT_CREDS', 'Incorrect username or password.'));
  }

  // you can only log in if your user is active
  if(user.state !== USER_STATE.ACTIVE) {
    logger.info(`LOGIN: ${username} attempted to log in but account state is ${user.state}`);
    return res.status(400).send(failure('INCORRECT_CREDS', 'Incorrect username or password.'));
  }

  const passwordMatches = await UserModel.checkPassword(user, password);
  if(!passwordMatches) {
    logger.debug(`LOGIN: ${username} attempted to log in with an incorrect password`);
    await logAuditEvent(AUDIT_EVENT_TYPE.USER_FAILED_LOGIN, user.id, null, null, null, req.sessionID);
    return res.status(400).send(failure('INCORRECT_CREDS', 'Incorrect username or password.'));
  }

  logIn(req, user);
  logger.debug(`LOGIN: ${username} successfully logged in`);
  await logAuditEvent(AUDIT_EVENT_TYPE.USER_LOGIN, user.id, null, null, null, req.sessionID);

  return res.status(200).send(success(user));
}

// logout ought to requireUser but since all it does is remove that user,
// it's okay to just... let anyone log out at any time, even if they're not logged in.
type EmptyObject = Record<string, never>;
export async function handleLogout(req: Request, res: ApiResponse<EmptyObject>) {
  try {
    await logOut(req);
  } catch (err) {
    logger.error('An error occurred during logout', err);
    // but let them log out anyway
  }

  return res.status(200).send(success({}));
}

export type CreateUserPayload = {
  username: string;
  email: string;
  password: string;
};
const zCreateUserPayload = z.object({
  username: z.string().trim().toLowerCase()
    .min(3, { message: 'Username must be at least 3 characters long.' })
    .max(24, { message: 'Username may not be longer than 24 characters.' })
    .regex(USERNAME_REGEX, { message: 'Username must begin with a letter and consist only of letters, numbers, dashes, and underscores.' }),
  password: z.string().min(8, { message: 'Password must be at least 8 characters long.' }),
  email: z.string().email({ message: 'Please enter a valid email address.' }),
});

export async function handleSignup(req: Request, res: ApiResponse<User>) {
  const { username: submittedUsername, password, email } = req.body as CreateUserPayload;

  let created: User;
  try {
    created = await UserModel.signUpUser({
      username: submittedUsername,
      password: password,
      email: email,
    }, reqCtx(req));
  } catch (err) {
    if(err instanceof ValidationError) {
      return res.status(400).send(failure('USERNAME_EXISTS', 'A user with that username already exists.'));
    } else {
      throw err;
    }
  }

  return res.status(201).send(success(created));
}

export async function handleSendEmailVerification(req: RequestWithUser, res: ApiResponse<EmptyObject>) {
  const user: User = req.user;

  const pending = await UserModel.sendEmailVerificationLink(user, {}, reqCtx(req));
  if(!pending) {
    // the user is already verified, so no-op and send a 200 (instead of 201)
    return res.status(200).send(success({}));
  }

  return res.status(201).send(success({}));
}

export async function handleVerifyEmail(req: Request, res: ApiResponse<EmptyObject>) {
  const uuid = req.params.uuid;

  const verified = await UserModel.verifyEmail(uuid, reqCtx(req));
  if(!verified) {
    return res.status(404).send(failure('NOT_FOUND', 'Could not verify your email. This verification link is either expired, already used, or invalid. Check your link and try again.'));
  }

  return res.status(200).send(success({}));
}

export type ChangePasswordPayload = {
  currentPassword: string;
  newPassword: string;
};
const zChangePasswordPayload = z.object({
  currentPassword: z.string().min(1, { message: 'Current password is required.' }),
  newPassword: z.string().min(8, { message: 'New password must be at least 8 characters long.' }),
});

export async function handleChangePassword(req: RequestWithUser, res: ApiResponse<EmptyObject>) {
  const { currentPassword, newPassword } = req.body as ChangePasswordPayload;

  const currentPasswordMatches = await UserModel.checkPassword(req.user, currentPassword);
  if(!currentPasswordMatches) {
    logger.debug(`LOGIN: ${req.user.id} had the incorrect password`);
    return res.status(400).send(failure('INCORRECT_CREDS', 'Incorrect password.'));
  }

  await UserModel.setPassword(req.user, newPassword, reqCtx(req));

  return res.status(200).send(success({}));
}

export type RequestPasswordResetPayload = {
  username: string;
};
const zRequestPasswordResetPayload = z.object({
  username: z.string().trim().toLowerCase()
    .min(3, { message: 'Username must be at least 3 characters long.' })
    .max(24, { message: 'Username may not be longer than 24 characters.' })
    .regex(USERNAME_REGEX, { message: 'Username must begin with a letter and consist only of letters, numbers, dashes, and underscores.' }),
});

export async function handleSendPasswordResetEmail(req: Request, res: ApiResponse<EmptyObject>) {
  const { username } = req.body as RequestPasswordResetPayload;

  const user = await UserModel.getUserByUsername(username);
  if(!user) {
    // TODO: rethink this stance
    // Even though there was no user found, we send back success so that we don't leak which usernames do and don't exist
    return res.status(200).send(success({}));
  }

  const resetLink = await UserModel.sendPasswordResetLink(user, {}, reqCtx(req));
  if(!resetLink) {
    // TODO: rethink this stance
    // Even though there was no user found, we send back success so that we don't leak which usernames do and don't exist
    return res.status(200).send(success({}));
  }

  return res.status(201).send(success({}));
}

export type ResetPasswordPayload = {
  newPassword: string;
};
const zResetPasswordPayload = z.object({
  newPassword: z.string().min(8, { message: 'New password must be at least 8 characters long.' }),
});

export async function handleResetPassword(req: Request, res: ApiResponse<EmptyObject>) {
  const resetUuid = req.params.uuid;
  const { newPassword } = req.body as ResetPasswordPayload;

  try {
    await UserModel.resetPassword(resetUuid, newPassword, reqCtx(req));
  } catch (err) {
    if(err instanceof RecordNotFoundError) {
      return res.status(404).send(failure('NOT_FOUND', 'This reset link is either expired or bogus. You should request a new one.'));
    } else {
      throw err;
    }
  }

  return res.status(200).send(success({}));
}

const routes: RouteConfig[] = [
  {
    path: '/login',
    method: HTTP_METHODS.POST,
    handler: handleLogin,
    accessLevel: ACCESS_LEVEL.PUBLIC,
    bodySchema: zLoginPayload,
  },
  {
    path: '/logout',
    method: HTTP_METHODS.POST,
    handler: handleLogout,
    // logout ought to require a user but since all it does is remove that user,
    // it's probably okay to let anyone call it even if they're not logged in
    accessLevel: ACCESS_LEVEL.PUBLIC,
  },
  {
    path: '/signup',
    method: HTTP_METHODS.POST,
    handler: handleSignup,
    accessLevel: ACCESS_LEVEL.PUBLIC,
    bodySchema: zCreateUserPayload,
  },
  {
    path: '/verify-email',
    method: HTTP_METHODS.POST,
    handler: handleSendEmailVerification,
    accessLevel: ACCESS_LEVEL.SESSION,
  },
  {
    path: '/verify-email/:uuid',
    method: HTTP_METHODS.POST,
    handler: handleVerifyEmail,
    accessLevel: ACCESS_LEVEL.PUBLIC,
    paramsSchema: zUuidParam(),
  },
  {
    path: '/password',
    method: HTTP_METHODS.POST,
    handler: handleChangePassword,
    accessLevel: ACCESS_LEVEL.SESSION,
    bodySchema: zChangePasswordPayload,
  },
  {
    path: '/reset-password',
    method: HTTP_METHODS.POST,
    handler: handleSendPasswordResetEmail,
    accessLevel: ACCESS_LEVEL.PUBLIC,
    bodySchema: zRequestPasswordResetPayload,
  },
  {
    path: '/reset-password/:uuid',
    method: HTTP_METHODS.POST,
    handler: handleResetPassword,
    accessLevel: ACCESS_LEVEL.PUBLIC,
    paramsSchema: zUuidParam(),
    bodySchema: zResetPasswordPayload,
  },
];
export default routes;
