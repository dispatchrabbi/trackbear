import { ACCESS_LEVEL, HTTP_METHODS, type RouteConfig } from "server/lib/api.ts";
import { ApiResponse, success, failure } from '../../lib/api-response.ts';
import { RequestWithUser } from '../../lib/middleware/access.ts';

import { z } from 'zod';
import { zIdParam } from '../../lib/validators.ts';

import {
  USER_STATE,
  USERNAME_REGEX, type UserState
} from "../../lib/models/user/consts.ts";
import {
  UserModel, type User,
} from "../../lib/models/user/user-model.ts";
import { AuditEventModel, type AuditEvent } from "server/lib/models/audit-event/audit-event-model.ts";
import { AUDIT_EVENT_ENTITIES } from "server/lib/models/audit-event/consts.ts";

import { reqCtx } from "server/lib/request-context.ts";
import { ValidationError } from "server/lib/models/errors.ts";

type EmptyObject = Record<string, never>;

export async function handleGetUsers(req: RequestWithUser, res: ApiResponse<User[]>) {
  const users = await UserModel.getUsers();

  return res.status(200).send(success(users));
}

export async function handleGetUser(req: RequestWithUser, res: ApiResponse<{ user: User; auditEvents: AuditEvent[]; }>) {
  const user = await UserModel.getUser(+req.params.id);
  if(!user) {
    return res.status(404).send(failure('NOT_FOUND', `Could not find a user with id ${req.params.id}`));
  }

  const auditEvents = await AuditEventModel.getAuditEvents(user.id, AUDIT_EVENT_ENTITIES.USER);

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
}).strict().partial();

export async function handleUpdateUser(req: RequestWithUser, res: ApiResponse<User>) {
  const user = await UserModel.getUser(+req.params.id);
  if(!user) {
    return res.status(404).send(failure('NOT_FOUND', `Could not find a user with id ${req.params.id}`));
  }

  const payload = req.body as UserUpdatePayload;

  let updated;
  try {
    updated = await UserModel.updateUser(user, payload, reqCtx(req))
  } catch(err) {
    if(err instanceof ValidationError) {
      return res.status(400).send(failure('VALIDATION_FAILED', err.meta.reason));
    } else {
      throw err;
    }
  }

  return res.status(200).send(success(updated));
}

export type UserStatePayload = {
  state: string;
};
const zUserStatePayload = z.object({
  state: z.enum([USER_STATE.ACTIVE, USER_STATE.SUSPENDED, USER_STATE.DELETED]),
}).strict();

export async function handleUpdateUserState(req: RequestWithUser, res: ApiResponse<User>) {
  const user = await UserModel.getUser(+req.params.id);
  if(!user) {
    return res.status(404).send(failure('NOT_FOUND', `Could not find a user with id ${req.params.id}`));
  }

  const payload = req.body as UserStatePayload;
  const updated = await UserModel.setUserState(user, payload.state as UserState, reqCtx(req));

  return res.status(200).send(success(updated));
}

export async function handleSendUserVerifyEmail(req: RequestWithUser, res: ApiResponse<EmptyObject>) {
  const user = await UserModel.getUser(+req.params.id);
  if(!user) {
    return res.status(404).send(failure('NOT_FOUND', `Could not find a user with id ${req.params.id}`));
  }

  await UserModel.sendEmailVerificationLink(user, { force: true }, reqCtx(req));

  return res.status(201).send(success({}));
}

export async function handleSendPasswordResetEmail(req: RequestWithUser, res: ApiResponse<EmptyObject>) {
  const user = await UserModel.getUser(+req.params.id);
  if(!user) {
    return res.status(404).send(failure('NOT_FOUND', `Could not find a user with id ${req.params.id}`));
  }

  await UserModel.sendPasswordResetLink(user, {}, reqCtx(req));

  return res.status(201).send(success({}));
}

const routes: RouteConfig[] = [
  {
    path: '/',
    method: HTTP_METHODS.GET,
    handler: handleGetUsers,
    accessLevel: ACCESS_LEVEL.ADMIN,
  },
  {
    path: '/:id',
    method: HTTP_METHODS.GET,
    handler: handleGetUser,
    accessLevel: ACCESS_LEVEL.ADMIN,
    paramsSchema: zIdParam(),
  },
  {
    path: '/:id',
    method: HTTP_METHODS.PATCH,
    handler: handleUpdateUser,
    accessLevel: ACCESS_LEVEL.ADMIN,
    paramsSchema: zIdParam(),
    bodySchema: zUserUpdatePayload,
  },
  {
    path: '/:id/state',
    method: HTTP_METHODS.PATCH,
    handler: handleUpdateUserState,
    accessLevel: ACCESS_LEVEL.ADMIN,
    paramsSchema: zIdParam(),
    bodySchema: zUserStatePayload,
  },
  {
    path: '/:id/verify-email',
    method: HTTP_METHODS.POST,
    handler: handleSendUserVerifyEmail,
    accessLevel: ACCESS_LEVEL.ADMIN,
    paramsSchema: zIdParam(),
  },
  {
    path: '/:id/reset-password',
    method: HTTP_METHODS.POST,
    handler: handleSendPasswordResetEmail,
    accessLevel: ACCESS_LEVEL.ADMIN,
    paramsSchema: zIdParam(),
  },
];

export default routes;