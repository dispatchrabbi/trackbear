import { Router } from "express";
import winston from "winston";
import { addMinutes, addDays } from 'date-fns';

import { ApiResponse, success, h, failure } from '../../lib/api-response.ts';
import { requireAdminUser, RequestWithUser } from '../../lib/auth.ts';

import { z } from 'zod';
import { zIdParam } from '../../lib/validators.ts';
import { validateBody, validateParams } from "../../lib/middleware/validate.ts";

import dbClient from "../../lib/db.ts";
import type { User, AuditEvent } from "@prisma/client";
import { USER_STATE, USERNAME_REGEX } from "../../lib/models/user.ts";
import { PASSWORD_RESET_LINK_STATE } from "../../lib/models/password-reset-link.ts";
import CONFIG from '../../config.ts';

import { pushTask } from "../../lib/queue.ts";
import sendEmailverificationEmail from "../../lib/tasks/send-emailverification-email.ts";
import sendPwresetEmail from "../../lib/tasks/send-pwreset-email.ts";

import { logAuditEvent, buildChangeRecord } from '../../lib/audit-events.ts';

type EmptyObject = Record<string, never>;

const userRouter = Router();

userRouter.get('/',
  requireAdminUser,
  h(handleGetUsers)
);
export async function handleGetUsers(req: RequestWithUser, res: ApiResponse<User[]>) {
  const users = await dbClient.user.findMany({
    orderBy: { username: 'asc' },
  });

  return res.status(200).send(success(users));
}

userRouter.get('/:id',
  requireAdminUser,
  validateParams(zIdParam()),
  h(handleGetUser)
);
export async function handleGetUser(req: RequestWithUser, res: ApiResponse<{ user: User; auditEvents: AuditEvent[]; }>) {
  const user = await dbClient.user.findUnique({
    where: {
      id: +req.params.id,
    },
  });

  if(!user) {
    return res.status(404).send(failure('NOT_FOUND', `No user found with id ${req.params.id}.`));
  }

  const auditEvents = await dbClient.auditEvent.findMany({
    where: {
      OR: [
        { agentId: user.id },
        { patientId: user.id },
        { goalId: user.id },
      ],
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return res.status(200).send(success({ user, auditEvents }));
}

export type UserUpdatePayload = Partial<{
  username: string;
  displayName: string;
  email: string;
  isEmailVerified: boolean;
}>;
const zUserUpdatePayload = z.object({
  username: z.string().trim().toLowerCase()
    .min(3, { message: 'Username must be at least 3 characters long.'})
    .max(24, { message: 'Username may not be longer than 24 characters.'})
    .regex(USERNAME_REGEX, { message: 'Username must begin with a letter and consist only of letters, numbers, dashes, and underscores.' }),
  displayName: z.string(),
  email: z.string().email(),
  isEmailVerified: z.boolean(),
}).partial().strict();

userRouter.put('/:id',
  requireAdminUser,
  validateParams(zIdParam()),
  validateBody(zUserUpdatePayload),
  h(handleUpdateUser)
);
export async function handleUpdateUser(req: RequestWithUser, res: ApiResponse<User>) {
  const admin = req.user;
  const payload = req.body as UserUpdatePayload;

  const current = await dbClient.user.findUnique({
    where: {
      id: +req.params.id
    },
  });
  if(!current) {
    return res.status(404).send(failure('NOT_FOUND', `No user found with id ${req.params.id}.`));
  }

  if('username' in payload) {
    const existingUserWithThisUsername = await dbClient.user.findUnique({
      where: { username: payload.username },
    });
    if(existingUserWithThisUsername) {
      return res.status(409).send(failure('USERNAME_EXISTS', 'A user with that username already exists.'));
    }
  }

  const updated = await dbClient.user.update({
    where: {
      id: +req.params.id,
    },
    data: {
      ...payload,
    },
  });
  if(!updated) {
    return res.status(404).send(failure('NOT_FOUND', `No user found with id ${req.params.id}.`));
  }

  const changes = buildChangeRecord<UserUpdatePayload>(current, updated);
  await logAuditEvent('user:update', admin.id, updated.id, null, changes, req.sessionID);

  return res.status(200).send(success(updated));
}

export type UserStatePayload = Partial<{
  state: string;
}>;
const zUserStatePayload = z.object({
  state: z.enum([USER_STATE.ACTIVE, USER_STATE.SUSPENDED, USER_STATE.DELETED]),
}).strict();

userRouter.put('/:id/state',
  requireAdminUser,
  validateParams(zIdParam()),
  validateBody(zUserStatePayload),
  h(handleUpdateUserState)
);
export async function handleUpdateUserState(req: RequestWithUser, res: ApiResponse<User>) {
  const admin = req.user;
  const payload = req.body as UserStatePayload;

  const current = await dbClient.user.findUnique({
    where: {
      id: +req.params.id
    },
  });
  if(!current) {
    return res.status(404).send(failure('NOT_FOUND', `No user found with id ${req.params.id}.`));
  }

  const updated = await dbClient.user.update({
    where: {
      id: +req.params.id,
    },
    data: {
      ...payload,
    },
  });
  if(!updated) {
    return res.status(404).send(failure('NOT_FOUND', `No user found with id ${req.params.id}.`));
  }

  let event = 'state-change';
  if(payload.state === USER_STATE.ACTIVE) {
    event = 'activate';
  } else if(payload.state === USER_STATE.SUSPENDED) {
    event = 'suspend';
  } else if(payload.state === USER_STATE.DELETED) {
    event = 'delete';
  }
  await logAuditEvent(`user:${event}`, admin.id, updated.id, null, { source: 'admin console' }, req.sessionID);

  return res.status(200).send(success(updated));
}

userRouter.post('/:id/verify-email',
  requireAdminUser,
  validateParams(zIdParam()),
  h(handleSendUserVerifyEmail)
);
export async function handleSendUserVerifyEmail(req: RequestWithUser, res: ApiResponse<EmptyObject>) {
  const admin = req.user;

  const user = await dbClient.user.findUnique({
    where: {
      id: +req.params.id,
    },
  });
  if(!user) {
    return res.status(404).send(failure('NOT_FOUND', `No user found with id ${req.params.id}.`));
  }

  // normally we'd make sure the user isn't already verified, but this is admin-town, Jake, so if the admin wants to send an email, we'll send an email
  const pendingEmailVerification = await dbClient.pendingEmailVerification.create({
    data: {
      userId: user.id,
      newEmail: user.email,
      expiresAt: addDays(new Date(), CONFIG.EMAIL_VERIFICATION_TIMEOUT_IN_DAYS),
    }
  });
  pushTask(sendEmailverificationEmail.makeTask(pendingEmailVerification.uuid));
  winston.debug(`EMAIL: ${admin.id} requested a verification link for ${user.id} and got ${pendingEmailVerification.uuid}`);
  await logAuditEvent('user:verifyemailreq', admin.id, user.id, null, { verificationUuid: pendingEmailVerification.uuid }, req.sessionID);

  return res.status(201).send(success({}));
}

userRouter.post('/:id/reset-password',
  requireAdminUser,
  validateParams(zIdParam()),
  h(handleSendPasswordResetEmail)
);
export async function handleSendPasswordResetEmail(req: RequestWithUser, res: ApiResponse<EmptyObject>) {
  const admin = req.user;

  const user = await dbClient.user.findUnique({
    where: {
      id: +req.params.id,
    },
  });
  if(!user) {
    return res.status(404).send(failure('NOT_FOUND', `No user found with id ${req.params.id}.`));
  }

  const resetLink = await dbClient.passwordResetLink.create({
    data: {
      userId: user.id,
      state: PASSWORD_RESET_LINK_STATE.ACTIVE,
      expiresAt: addMinutes(new Date(), CONFIG.PASSWORD_RESET_LINK_TIMEOUT_IN_MINUTES),
    }
  });

  winston.debug(`PASSWORD: ${admin.id} requested a reset link for ${user.id} and got ${resetLink.uuid}`);
  await logAuditEvent('user:pwresetreq', admin.id, user.id, null, { resetLinkUuid: resetLink.uuid }, req.sessionID);
  pushTask(sendPwresetEmail.makeTask(resetLink.uuid));

  return res.status(201).send(success({}));
}

export default userRouter;
