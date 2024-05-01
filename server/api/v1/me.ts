import { Router } from "express";
import { ApiResponse, success, failure, h } from '../../lib/api-response.ts';

import winston from "winston";
import { addDays } from "date-fns";

import dbClient from "../../lib/db.ts";
import type { User } from "@prisma/client";
import { USERNAME_REGEX, USER_STATE } from "../../lib/models/user.ts";
import CONFIG from '../../config.ts';

import { z } from 'zod';
import { validateBody } from "../../lib/middleware/validate.ts";
import { logAuditEvent, buildChangeRecord } from '../../lib/audit-events.ts';
import { requireUser, RequestWithUser } from "../../lib/auth.ts";

import { pushTask } from "../../lib/queue.ts";
import sendEmailverificationEmail from "../../lib/tasks/send-emailverification-email.ts";
import sendUsernameChangedEmail from "../../lib/tasks/send-username-changed-email.ts";
import sendAccountDeletedEmail from "../../lib/tasks/send-account-deleted-email.ts";

const meRouter = Router();

// GET /me - get your own user information
meRouter.get('/',
  requireUser,
  h(async (req: RequestWithUser, res: ApiResponse<User>) =>
{
  return res.status(200).send(success(req.user));
}));

export type MeEditPayload = Partial<{
  username: string;
  displayName: string;
  email: string;
}>;
const zMeEditPayload = z.object({
  username: z.string().trim().toLowerCase()
    .min(3, { message: 'Username must be at least 3 characters long.'})
    .max(24, { message: 'Username may not be longer than 24 characters.'})
    .regex(USERNAME_REGEX, { message: 'Username must begin with a letter and consist only of letters, numbers, dashes, and underscores.' }),
  displayName: z.string()
    .min(3, { message: 'Display name must be at least 3 characters long.'})
    .max(24, { message: 'Display name may not be longer than 24 characters.'}),
  email: z.string().email({ message: 'Please enter a valid email address.' }),
}).strict().partial();

// PATCH /me - modify your own user information
meRouter.patch('/',
  requireUser,
  validateBody(zMeEditPayload),
  h(async (req: RequestWithUser, res: ApiResponse<User>) =>
{
  const current = {
    username: req.user.username,
    displayName: req.user.displayName,
    email: req.user.email,
  };

  const payload = req.body as MeEditPayload;
  for(const field of Object.keys(current)) {
    if(current[field] === payload[field]) {
      delete payload[field];
    }
  }

  const didUsernameChange = 'username' in payload;
  const didEmailChange = 'email' in payload;

  // ensure this username doesn't already exist for some other user
  if(didUsernameChange) {
    const existingUserWithThisUsername = await dbClient.user.findMany({
      where: {
        username: payload.username,
        NOT: {
          id: req.user.id,
        }
      }
    });
    if(existingUserWithThisUsername.length > 0) {
      return res.status(409).send(failure('USERNAME_EXISTS', 'A user with that username already exists.'));
    }
  }

  const pendingEmailVerificationData = {
    newEmail: payload.email,
    expiresAt: addDays(new Date(), CONFIG.EMAIL_VERIFICATION_TIMEOUT_IN_DAYS),
  };

  const updated = await dbClient.user.update({
    data: {
      ...payload,
      isEmailVerified: didEmailChange ? false : req.user.isEmailVerified,
      pendingEmailVerifications: didEmailChange ? { create: pendingEmailVerificationData } : undefined,
    },
    where: {
      id: req.user.id,
      state: USER_STATE.ACTIVE,
    }
  });

  // this should only happen if a user is logged in, gets suspended, and tries to update their info
  if(!updated) {
    return res.status(403).send(failure('NOT_FOUND', `No active user found to update`));
  }

  const changeRecord = buildChangeRecord<MeEditPayload>(Object.keys(payload) as (keyof MeEditPayload)[], current, updated);
  await logAuditEvent('user:update', req.user.id, req.user.id, null, changeRecord);

  if(didEmailChange) {
    const pendingEmailVerification = await dbClient.pendingEmailVerification.findFirst({
      orderBy: { createdAt: 'desc' },
    });

    pushTask(sendEmailverificationEmail.makeTask(pendingEmailVerification.uuid));
  }

  if(didUsernameChange) {
    pushTask(sendUsernameChangedEmail.makeTask(req.user.id));
  }

  req.user = updated;
  return res.status(200).send(success(updated));
}));

meRouter.delete('/',
  requireUser,
  h(async (req: RequestWithUser, res: ApiResponse<User>) =>
{
  const deleted = await dbClient.user.update({
    data: {
      state: USER_STATE.DELETED,
    },
    where: {
      id: req.user.id,
    },
  });

  await logAuditEvent('user:delete', req.user.id, req.user.id);
  winston.debug(`USER DELETION: ${req.user.id} just deleted their account`);

  pushTask(sendAccountDeletedEmail.makeTask(req.user.id));

  return res.status(200).send(success(deleted));
}));

export default meRouter;
