import { HTTP_METHODS, ACCESS_LEVEL, type RouteConfig } from 'server/lib/api.ts';
import { type ApiResponse, success, failure } from '../../lib/api-response.ts';

import path from 'node:path';
import fs from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { addDays } from 'date-fns';

import { getLogger } from 'server/lib/logger.ts';
const logger = getLogger();

import { getDbClient } from 'server/lib/db.ts';
import { type User } from 'generated/prisma/client';
import { USERNAME_REGEX, USER_STATE, ALLOWED_AVATAR_FORMATS } from '../../lib/models/user/consts.ts';
import type { FullUser, UserSettings } from 'server/lib/models/user/user-model.ts';
import { TALLY_MEASURE } from '../../lib/models/tally/consts.ts';
import CONFIG from '../../config.ts';

import { z } from 'zod';
import { logAuditEvent, buildChangeRecord } from '../../lib/audit-events.ts';
import { pick } from '../../lib/obj.ts';
import { type RequestWithUser } from '../../lib/middleware/access.ts';

import deepEql from 'deep-eql';

import { pushTask } from '../../lib/queue.ts';
import sendEmailverificationEmail from '../../lib/tasks/send-emailverification-email.ts';
import sendUsernameChangedEmail from '../../lib/tasks/send-username-changed-email.ts';
import sendAccountDeletedEmail from '../../lib/tasks/send-account-deleted-email.ts';
import { getAvatarUploadFn, getAvatarUploadPath } from 'server/lib/upload.ts';

export type { FullUser };

// GET /me - get your own user information
export async function handleGetMe(req: RequestWithUser, res: ApiResponse<FullUser>) {
  const db = getDbClient();
  const me = await db.user.findUnique({
    where: {
      id: req.user.id,
      state: USER_STATE.ACTIVE,
    },
    include: {
      userSettings: true,
    },
  }) as FullUser;

  // this should only happen if a user is logged in, gets suspended, and tries to find their data
  if(!me) {
    return res.status(404).send(failure('NOT_FOUND', `No active user found`));
  }

  return res.status(200).send(success(me));
}

export type MeEditPayload = Partial<{
  username: string;
  displayName: string;
  email: string;
}>;
const zMeEditPayload = z.strictObject({
  username: z.string().trim().toLowerCase()
    .min(3, { error: 'Username must be at least 3 characters long.' })
    .max(24, { error: 'Username may not be longer than 24 characters.' })
    .regex(USERNAME_REGEX, { error: 'Username must begin with a letter and consist only of letters, numbers, dashes, and underscores.' }),
  displayName: z.string()
    .min(3, { error: 'Display name must be at least 3 characters long.' })
    .max(24, { error: 'Display name may not be longer than 24 characters.' }),
  email: z.email({ error: 'Please enter a valid email address.' }),
}).partial();

// PATCH /me - modify your own user information
export async function handlePatchMe(req: RequestWithUser, res: ApiResponse<FullUser>) {
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

  const db = getDbClient();

  // ensure this username doesn't already exist for some other user
  if(didUsernameChange) {
    const existingUserWithThisUsername = await db.user.findMany({
      where: {
        username: payload.username,
        NOT: {
          id: req.user.id,
        },
      },
    });
    if(existingUserWithThisUsername.length > 0) {
      return res.status(409).send(failure('USERNAME_EXISTS', 'A user with that username already exists.'));
    }
  }

  const pendingEmailVerificationData = {
    newEmail: payload.email!, // we can bang here because we only use this if `didEmailChange` is true
    expiresAt: addDays(new Date(), CONFIG.EMAIL_VERIFICATION_TIMEOUT_IN_DAYS),
  };

  const updated = await db.user.update({
    data: {
      ...payload,
      isEmailVerified: didEmailChange ? false : req.user.isEmailVerified,
      pendingEmailVerifications: didEmailChange ? { create: pendingEmailVerificationData } : undefined,
    },
    where: {
      id: req.user.id,
      state: USER_STATE.ACTIVE,
    },
    include: {
      userSettings: true,
    },
  }) as FullUser;

  // this should only happen if a user is logged in, gets suspended, and tries to update their info
  if(!updated) {
    return res.status(404).send(failure('NOT_FOUND', `No active user found to update`));
  }

  const changeRecord = buildChangeRecord<MeEditPayload>(current, pick(updated, ['username', 'email', 'displayName']));
  await logAuditEvent('user:update', req.user.id, req.user.id, null, changeRecord, req.sessionID);

  if(didEmailChange) {
    const pendingEmailVerification = await db.pendingEmailVerification.findFirst({
      orderBy: { createdAt: 'desc' },
    });

    if(pendingEmailVerification) {
      // we just created this, so it *should* always exist
      pushTask(sendEmailverificationEmail.makeTask(pendingEmailVerification.uuid));
    }
  }

  if(didUsernameChange) {
    pushTask(sendUsernameChangedEmail.makeTask(req.user.id));
  }

  req.user = updated;
  return res.status(200).send(success(updated));
}

export async function handleDeleteMe(req: RequestWithUser, res: ApiResponse<User>) {
  const db = getDbClient();
  const deleted = await db.user.update({
    data: {
      state: USER_STATE.DELETED,
    },
    where: {
      id: req.user.id,
    },
  });

  await logAuditEvent('user:delete', req.user.id, req.user.id, null, null, req.sessionID);
  logger.debug(`USER DELETION: ${req.user.id} just deleted their account`);

  pushTask(sendAccountDeletedEmail.makeTask(req.user.id));

  return res.status(200).send(success(deleted));
}

// POST /me/avatar - upload a new avatar
export async function handleUploadAvatar(req: RequestWithUser, res: ApiResponse<User>) {
// make sure the file uploads correctly and is under limits and such
  const uploadAvatar = getAvatarUploadFn();
  try {
    await uploadAvatar(req, res);
  } catch (err) {
    return res.status(400).send(failure(err.code, err.message));
  }

  // is this a file format we accept for avatars?
  const isAllowedFormat = Object.keys(ALLOWED_AVATAR_FORMATS).includes(req.file!.mimetype);
  if(!isAllowedFormat) {
    return res.status(400).send(failure('INVALID_FILE_TYPE', `Avatars of type ${req.file!.mimetype} are not allowed. Allowed types are: ${Object.keys(ALLOWED_AVATAR_FORMATS).join(', ')}`));
  }

  const avatarUploadPath = await getAvatarUploadPath();

  // move the uploaded file over to the avatar directory
  const oldPath = req.file!.path;
  const filename = randomUUID() + '.' + ALLOWED_AVATAR_FORMATS[req.file!.mimetype];
  const newPath = path.join(avatarUploadPath, filename);
  try {
    await fs.copyFile(oldPath, newPath);
  } catch (err) {
    logger.error(`Could not move uploaded avatar file (from: ${oldPath}, to: ${newPath}): ${err.message}`, err);
    return res.status(500).send(failure('SERVER_ERROR', 'Could not save avatar file'));
  }

  try {
    await fs.rm(oldPath);
  } catch (err) {
    logger.error(`Could not delete temporary avatar file (from: ${oldPath}): ${err.message}`, err);
  // but we don't actually want to stop the upload on this error, so keep going...
  }

  // save this as the user's avatar
  const db = getDbClient();
  const updated = await db.user.update({
    where: { id: req.user.id },
    data: {
      avatar: filename,
    },
  });

  // this should only happen if a user is logged in, gets suspended, and tries to update their info
  if(!updated) {
    return res.status(404).send(failure('NOT_FOUND', `No active user found to update`));
  }

  logger.debug(`AVATAR: User ${req.user.id} (${req.user.username}) successfully uploaded a new avatar (${filename})`);
  const changeRecord = buildChangeRecord({ avatar: req.user.avatar }, { avatar: updated.avatar });
  await logAuditEvent('user:avatar', req.user.id, req.user.id, null, changeRecord, req.sessionID);

  req.user = updated;
  return res.status(200).send(success(req.user));
}

// DELETE /me/avatar - delete your avatar
export async function handleDeleteAvatar(req: RequestWithUser, res: ApiResponse<User>) {
  const db = getDbClient();
  const updated = await db.user.update({
    where: { id: req.user.id },
    data: {
      avatar: null,
    },
  });

  // this should only happen if a user is logged in, gets suspended, and tries to update their info
  if(!updated) {
    return res.status(404).send(failure('NOT_FOUND', `No active user found to update`));
  }

  logger.debug(`AVATAR: User ${req.user.id} (${req.user.username}) deleted their avatar`);
  const changeRecord = buildChangeRecord({ avatar: req.user.avatar }, { avatar: updated.avatar });
  await logAuditEvent('user:avatar', req.user.id, req.user.id, null, changeRecord, req.sessionID);

  req.user = updated;
  return res.status(200).send(success(req.user));
}

export type SettingsEditPayload = Partial<{
  lifetimeStartingBalance: Record<string, number>;
  enablePublicProfile: boolean;
  displayCovers: boolean;
  displayStreaks: boolean;
  weekStartDay: number;
}>;
const zSettingsEditPayload = z.strictObject({
  lifetimeStartingBalance: z.record(z.enum(Object.values(TALLY_MEASURE)), z.number().int()),
  enablePublicProfile: z.boolean(),
  displayCovers: z.boolean(),
  displayStreaks: z.boolean(),
  weekStartDay: z.number().int().min(0).max(6),
}).partial();

// PATCH /me/settings - patch your settings
export async function handleUpdateSettings(req: RequestWithUser, res: ApiResponse<UserSettings>) {
  const db = getDbClient();
  const current = await db.userSettings.findUnique({ where: {
    userId: req.user.id,
    user: { state: USER_STATE.ACTIVE },
  } }) as UserSettings;

  // This should basically never happen. If it does, something screwed up on user creation
  if(!current) {
    return res.status(404).send(failure('NOT_FOUND', `No settings found on active user`));
  }

  const payload = req.body as SettingsEditPayload;
  for(const field of Object.keys(current)) {
    if(deepEql(current[field], payload[field])) {
      delete payload[field];
    }
  }

  const updated = await db.userSettings.update({
    data: {
      ...payload,
    },
    where: {
      userId: req.user.id,
      user: { state: USER_STATE.ACTIVE },
    },
  }) as UserSettings;

  // this should only happen if a user is logged in, gets suspended, and tries to update their settings
  if(!updated) {
    return res.status(404).send(failure('NOT_FOUND', `No active user found to update`));
  }

  const changeRecord = buildChangeRecord<UserSettings>(current, updated);
  await logAuditEvent('settings:update', req.user.id, updated.id, null, changeRecord, req.sessionID);

  return res.status(200).send(success(updated));
}

const routes: RouteConfig[] = [
  {
    path: '/',
    method: HTTP_METHODS.GET,
    handler: handleGetMe,
    accessLevel: ACCESS_LEVEL.SESSION,
  },
  {
    path: '/',
    method: HTTP_METHODS.PATCH,
    handler: handlePatchMe,
    accessLevel: ACCESS_LEVEL.SESSION,
    bodySchema: zMeEditPayload,
  },
  {
    path: '/',
    method: HTTP_METHODS.DELETE,
    handler: handleDeleteMe,
    accessLevel: ACCESS_LEVEL.SESSION,
  },
  {
    path: '/avatar',
    method: HTTP_METHODS.POST,
    handler: handleUploadAvatar,
    accessLevel: ACCESS_LEVEL.SESSION,
    bodySchema: zMeEditPayload,
  },
  {
    path: '/avatar',
    method: HTTP_METHODS.DELETE,
    handler: handleDeleteAvatar,
    accessLevel: ACCESS_LEVEL.SESSION,
  },
  {
    path: '/settings',
    method: HTTP_METHODS.PATCH,
    handler: handleUpdateSettings,
    accessLevel: ACCESS_LEVEL.SESSION,
    bodySchema: zSettingsEditPayload,
  },
];

export default routes;
