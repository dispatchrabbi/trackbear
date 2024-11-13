import { Router, Request } from "express";
import { z } from 'zod';
import winston from "winston";
import { addMinutes, addDays } from 'date-fns';

import { HTTP_METHODS, ACCESS_LEVEL, type RouteConfig } from "server/lib/api.ts";
import { validateBody, validateParams } from "../lib/middleware/validate.ts";
import { zUuidParam } from "server/lib/validators.ts";
import { ApiResponse, success, failure, h } from '../lib/api-response.ts';

import dbClient from '../lib/db.ts';
import type { User } from "@prisma/client";
import { hash, verifyHash } from "../lib/hash.ts";
import { logIn, logOut, requireUser, WithUser } from "../lib/auth.ts";
import { PASSWORD_RESET_LINK_STATE } from "../lib/models/password-reset-link.ts";
import { USER_STATE, USERNAME_REGEX } from "../lib/models/user.ts";
import CONFIG from '../config.ts';

import { pushTask } from "../lib/queue.ts";
import sendSignupEmailTask from '../lib/tasks/send-signup-email.ts';
import sendEmailverificationEmail from "../lib/tasks/send-emailverification-email.ts";
import sendPwresetEmail from "../lib/tasks/send-pwreset-email.ts";
import sendPwchangeEmail from "../lib/tasks/send-pwchange-email.ts";

import { logAuditEvent } from '../lib/audit-events.ts';

export const authRouter = Router();

export type LoginPayload = {
  username: string;
  password: string;
};
const zLoginPayload = z.object({
  username: z.string().toLowerCase(),
  password: z.string()
});

authRouter.post('/login',
  validateBody(zLoginPayload),
  h(handleLogin)
);
export async function handleLogin(req: Request, res: ApiResponse<User>) {
  const { username, password } = req.body;

  let userAuth;
  const user = await dbClient.user.findUnique({ where: { username } });
  if(user) {
    userAuth = await dbClient.userAuth.findUnique({ where: { userId: user.id } });
  }

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

  const verified = await verifyHash(userAuth.password, password, userAuth.salt);

  if(!verified) {
    winston.debug(`LOGIN: ${username} had the incorrect password`);
    return res.status(400).send(failure('INCORRECT_CREDS', 'Incorrect username or password.'));
  }

  logIn(req, user);
  winston.debug(`LOGIN: ${username} successfully logged in`);
  await logAuditEvent('user:login', user.id, null, null, null, req.sessionID);

  return res.status(200).send(success(user));
}

// logout ought to requireUser but since all it does is remove that user,
// it's okay to just... let anyone log out at any time, even if they're not logged in.
type EmptyObject = Record<string, never>;
authRouter.post('/logout',
  h(handleLogout)
);
export async function handleLogout(req, res: ApiResponse<EmptyObject>) {
  try {
    await logOut(req);
  } catch(err) {
    winston.error('An error occurred during logout', err);
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
    .min(3, { message: 'Username must be at least 3 characters long.'})
    .max(24, { message: 'Username may not be longer than 24 characters.'})
    .regex(USERNAME_REGEX, { message: 'Username must begin with a letter and consist only of letters, numbers, dashes, and underscores.' }),
  password: z.string().min(8, { message: 'Password must be at least 8 characters long.' }),
  email: z.string().email({ message: 'Please enter a valid email address.' }),
});

authRouter.post('/signup',
  validateBody(zCreateUserPayload),
  h(handleSignup)
);
export async function handleSignup(req, res: ApiResponse<User>) {
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

  const { hashedPassword, salt } = await hash(password);

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

  const userSettingsData = {
    lifetimeStartingBalance: {},
  };

  const pendingEmailVerificationData = {
    newEmail: userData.email,
    expiresAt: addDays(new Date(), CONFIG.EMAIL_VERIFICATION_TIMEOUT_IN_DAYS),
  };

  const user = await dbClient.user.create({
    data: {
      ...userData,
      userAuth: { create: userAuthData },
      userSettings: { create: userSettingsData },
      pendingEmailVerifications: { create: pendingEmailVerificationData },
    },
    include: {
      pendingEmailVerifications: {
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
  });
  await logAuditEvent('user:signup', user.id, user.id, null, null, req.sessionID);
  winston.debug(`SIGNUP: ${user.id} just signed up`);

  pushTask(sendSignupEmailTask.makeTask(user.id));
  pushTask(sendEmailverificationEmail.makeTask(user.pendingEmailVerifications[0].uuid));

  return res.status(201).send(success(user));
}

authRouter.post('/verify-email',
  requireUser,
  h(handleSendEmailVerification)
);
export async function handleSendEmailVerification(req: WithUser<Request>, res: ApiResponse<EmptyObject>) {
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

  const pendingEmailVerification = await dbClient.pendingEmailVerification.create({
    data: pendingEmailVerificationData,
  });
  pushTask(sendEmailverificationEmail.makeTask(pendingEmailVerification.uuid));
  await logAuditEvent('user:verifyemailreq', user.id, user.id, null, { verificationUuid: pendingEmailVerification.uuid }, req.sessionID);

  return res.status(201).send(success({}));
}

authRouter.post('/verify-email/:uuid',
  validateParams(zUuidParam()),
  h(handleVerifyEmail)
);
export async function handleVerifyEmail(req: Request, res: ApiResponse<EmptyObject>) {
  const uuid = req.params.uuid;
  const verification = await dbClient.pendingEmailVerification.findUnique({
    where: {
      uuid,
      expiresAt: { gt: new Date() },
    },
    include: {
      user: true,
    },
  });

  const user = verification?.user;

  if(!(
    verification && // we found a non-expired verification for this uuid
    verification.newEmail === user.email && // it's for the current email
    user.isEmailVerified === false // the email hasn't already been verified
  )) {
    return res.status(404).send(failure('NOT_FOUND', 'Could not verify your email. This verification link is either expired, already used, or invalid. Check your link and try again.'));
  }

  // now we mark the email verified and delete all pending verifications for this email
  await dbClient.user.update({
    data: {
      isEmailVerified: true,
      pendingEmailVerifications: { deleteMany: {} },
    },
    where: { id: user.id },
  });

  await logAuditEvent('user:verifyemail', user.id, user.id, null, { verificationUuid: verification.uuid, email: verification.newEmail }, req.sessionID);
  winston.debug(`VERIFY: ${user.id} just verified their email`);

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

authRouter.post('/password',
  requireUser,
  validateBody(zChangePasswordPayload),
  h(handleChangePassword)
);
export async function handleChangePassword(req: WithUser<Request>, res: ApiResponse<EmptyObject>) {
  const { currentPassword, newPassword } = req.body;

  // first make sure that we know that the userauth exists
  let userAuth = await dbClient.userAuth.findUnique({ where: { userId: req.user.id } });

  if(!userAuth) {
    winston.error(`LOGIN: ${req.user.id} attempted to change their password but they were not found!`);
    return res.status(403).send(failure('INVALID_USER', 'Invalid user.'));
  }

  // then validate the password
  const verified = await verifyHash(userAuth.password, currentPassword, userAuth.salt);

  if(!verified) {
    winston.debug(`LOGIN: ${req.user.id} had the incorrect password`);
    return res.status(400).send(failure('INCORRECT_CREDS', 'Incorrect password.'));
  }

  // now, change out the password
  const { hashedPassword, salt } = await hash(newPassword);
  userAuth = await dbClient.userAuth.update({
    data: {
      password: hashedPassword,
      salt: salt,
    },
    where: {
      userId: req.user.id,
    },
  });

  winston.debug(`PASSWORD: ${req.user.id} has changed their password`);
  await logAuditEvent('user:pwchange', req.user.id, req.user.id, null, null, req.sessionID);
  pushTask(sendPwchangeEmail.makeTask(req.user.id));

  return res.status(200).send(success({}));
}

export type RequestPasswordResetPayload = {
  username: string;
};
const zRequestPasswordResetPayload = z.object({
  username: z.string().trim().toLowerCase()
    .min(3, { message: 'Username must be at least 3 characters long.'})
    .max(24, { message: 'Username may not be longer than 24 characters.'})
    .regex(USERNAME_REGEX, { message: 'Username must begin with a letter and consist only of letters, numbers, dashes, and underscores.' }),
});

authRouter.post('/reset-password',
  validateBody(zRequestPasswordResetPayload),
  h(handleSendPasswordResetEmail)
);
export async function handleSendPasswordResetEmail(req: Request, res: ApiResponse<EmptyObject>) {
  const username = req.body.username;

  const user = await dbClient.user.findUnique({
    where: {
      username,
      state: USER_STATE.ACTIVE,
    },
  });

  if(!user) {
    // Even though there was no user found, we send back success so that we don't leak which usernames do and don't exist
    winston.warn(`PWRESET: Attempted reset for nonexistent username ${username}`);
    return res.status(200).send(success({}));
  }

  const resetLink = await dbClient.passwordResetLink.create({
    data: {
      userId: user.id,
      state: PASSWORD_RESET_LINK_STATE.ACTIVE,
      expiresAt: addMinutes(new Date(), CONFIG.PASSWORD_RESET_LINK_TIMEOUT_IN_MINUTES),
    }
  });

  winston.debug(`PASSWORD: ${user.id} requested a reset link and got ${resetLink.uuid}`);
  await logAuditEvent('user:pwresetreq', user.id, user.id, null, { resetLinkUuid: resetLink.uuid }, req.sessionID);
  pushTask(sendPwresetEmail.makeTask(resetLink.uuid));

  return res.status(201).send(success({}));
}

export type PasswordResetPayload = {
  newPassword: string;
};
const zPasswordResetPayload = z.object({
  newPassword: z.string().min(8, { message: 'New password must be at least 8 characters long.' }),
});

authRouter.post('/reset-password/:uuid',
  validateParams(zUuidParam()),
  validateBody(zPasswordResetPayload),
  h(handlePasswordReset)
);
export async function handlePasswordReset(req: Request, res: ApiResponse<EmptyObject>) {
  const uuid = req.params.uuid;
  const passwordResetLink = await dbClient.passwordResetLink.findUnique({
    where: {
      uuid,
      expiresAt: { gt: new Date() },
      state: PASSWORD_RESET_LINK_STATE.ACTIVE,
    },
  });

  if(!passwordResetLink) {
    return res.status(404).send(failure('NOT_FOUND', 'This reset link is either expired or bogus. You should request a new one.'));
  }

  // now, change out the password
  const newPassword = req.body.newPassword;
  const { hashedPassword, salt } = await hash(newPassword);

  const userAuth = await dbClient.userAuth.update({
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

  // this should basically never happen...
  if(!userAuth) {
    winston.error(`PASSWORD: User ${passwordResetLink.userId} attempted to reset their password but no UserAuth record was found!`);
    return res.status(403).send(failure('INVALID_USER', 'Invalid user.'));
  }

  const user = userAuth.user;
  winston.debug(`PASSWORD: ${user.id} has reset their password`);
  await logAuditEvent('user:pwreset', user.id, user.id, null, null, req.sessionID);
  pushTask(sendPwchangeEmail.makeTask(user.id));

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
    accessLevel: ACCESS_LEVEL.USER,
    bodySchema: zCreateUserPayload,
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
    accessLevel: ACCESS_LEVEL.USER,
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
    handler: handlePasswordReset,
    accessLevel: ACCESS_LEVEL.PUBLIC,
    paramsSchema: zUuidParam(),
    bodySchema: zPasswordResetPayload,
  },
];
export default routes;