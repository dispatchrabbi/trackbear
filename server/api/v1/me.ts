import { Router } from "express";
import { ApiResponse, success, failure, h } from '../../lib/api-response.ts';

import winston from "winston";
import { addDays } from "date-fns";

import { promisify } from 'node:util';
import { tmpdir } from 'node:os';
import path from 'node:path';
import fs from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import multer from 'multer';
import { getNormalizedEnv } from '../../lib/env.ts';

import dbClient from "../../lib/db.ts";
import type { User } from "@prisma/client";
import { USERNAME_REGEX, USER_STATE, ALLOWED_AVATAR_FORMATS, MAX_AVATAR_SIZE_IN_BYTES } from "../../lib/models/user.ts";
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
    return res.status(404).send(failure('NOT_FOUND', `No active user found to update`));
  }

  const changeRecord = buildChangeRecord<MeEditPayload>(Object.keys(payload) as (keyof MeEditPayload)[], current, updated);
  await logAuditEvent('user:update', req.user.id, req.user.id, null, changeRecord, req.sessionID);

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

  await logAuditEvent('user:delete', req.user.id, req.user.id, null, null, req.sessionID);
  winston.debug(`USER DELETION: ${req.user.id} just deleted their account`);

  pushTask(sendAccountDeletedEmail.makeTask(req.user.id));

  return res.status(200).send(success(deleted));
}));

const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    // store the file in a temporary directory for now
    const tbTmpDir = await fs.mkdtemp(path.join(tmpdir(), 'trackbear-'));
    cb(null, tbTmpDir);
  }
})
// const storage = multer.memoryStorage();
const upload = promisify(multer({
  storage,
  limits: {
    fileSize: MAX_AVATAR_SIZE_IN_BYTES,
  },
}).single('avatar'));

// POST /me/avatar - upload a new avatar
meRouter.post('/avatar',
  requireUser,
  h(async (req: RequestWithUser, res: ApiResponse<User>) =>
{
  // make sure the file uploads correctly and is under limits and such
  try{
    await upload(req, res);
  } catch(err) {
    return res.status(400).send(failure(err.code, err.message));
  }

  // is this a file format we accept for avatars?
  const isAllowedFormat = Object.keys(ALLOWED_AVATAR_FORMATS).includes(req.file.mimetype);
  if(!isAllowedFormat) {
    return res.status(400).send(failure('INVALID_FILE_TYPE', `Avatars of type ${req.file.mimetype} are not allowed. Allowed types are: ${Object.keys(ALLOWED_AVATAR_FORMATS).join(', ')}`));
  }

  const env = await getNormalizedEnv();
  const avatarPath = path.join(env.UPLOADS_PATH, 'avatars');
  // create the avatar directory if it doesn't exist
  try {
    await fs.mkdir(avatarPath);
  } catch(err) {
    if(err.code !== 'EEXIST') {
      throw err;
    } // else EEXIST means it exists and we're good
  }

  // move the uploaded file over to the avatar directory
  const oldPath = req.file.path;
  const filename = randomUUID() + '.' + ALLOWED_AVATAR_FORMATS[req.file.mimetype];
  const newPath = path.join(avatarPath, filename);
  try {
    await fs.copyFile(oldPath, newPath);
  } catch(err) {
    winston.error(`Could not move uploaded avatar file (from: ${oldPath}, to: ${newPath}): ${err.message}`, err);
    return res.status(500).send(failure('SERVER_ERROR', 'Could not save avatar file'));
  }

  try {
    await fs.rm(oldPath);
  } catch(err) {
    winston.error(`Could not delete uploaded avatar file (from: ${oldPath}): ${err.message}`, err);
    // but we don't actually want to stop the upload on this error, so keep going...
  }

  // save this as the user's avatar
  const updated = await dbClient.user.update({
    where: { id: req.user.id },
    data: {
      avatar: filename,
    }
  });

  // this should only happen if a user is logged in, gets suspended, and tries to update their info
  if(!updated) {
    return res.status(404).send(failure('NOT_FOUND', `No active user found to update`));
  }

  winston.debug(`AVATAR: User ${req.user.id} (${req.user.username}) successfully uploaded a new avatar (${filename})`);
  const changeRecord = buildChangeRecord(['avatar'], { avatar: req.user.avatar }, { avatar: updated.avatar });
  await logAuditEvent('user:avatar', req.user.id, req.user.id, null, changeRecord, req.sessionID);

  req.user = updated;
  return res.status(200).send(success(req.user));
}));

meRouter.delete('/avatar',
  requireUser,
  h(async (req: RequestWithUser, res: ApiResponse<User>) =>
{
  const updated = await dbClient.user.update({
    where: { id: req.user.id },
    data: {
      avatar: null,
    }
  });

  // this should only happen if a user is logged in, gets suspended, and tries to update their info
  if(!updated) {
    return res.status(404).send(failure('NOT_FOUND', `No active user found to update`));
  }

  winston.debug(`AVATAR: User ${req.user.id} (${req.user.username}) deleted their avatar`);
  const changeRecord = buildChangeRecord(['avatar'], { avatar: req.user.avatar }, { avatar: updated.avatar });
  await logAuditEvent('user:avatar', req.user.id, req.user.id, null, changeRecord, req.sessionID);

  req.user = updated;
  return res.status(200).send(success(req.user));
}));

export default meRouter;
