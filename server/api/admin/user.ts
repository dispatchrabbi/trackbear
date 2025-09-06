import { ACCESS_LEVEL, HTTP_METHODS, type RouteConfig } from 'server/lib/api.ts';
import { ApiResponse, success, failure } from '../../lib/api-response.ts';
import { RequestWithUser } from '../../lib/middleware/access.ts';

import { z } from 'zod';
import { zIdParam } from '../../lib/validators.ts';

import {
  USER_STATE,
  USERNAME_REGEX, type UserState,
} from '../../lib/models/user/consts.ts';
import {
  UserModel, type User,
} from '../../lib/models/user/user-model.ts';
import { AuditEventModel, type AuditEvent } from 'server/lib/models/audit-event/audit-event-model.ts';
import { AUDIT_EVENT_ENTITIES, AUDIT_EVENT_SOURCE } from 'server/lib/models/audit-event/consts.ts';

import { reqCtx } from 'server/lib/request-context.ts';
import { ValidationError } from 'server/lib/models/errors.ts';

type EmptyObject = Record<string, never>;

const zUserQuery = z.object({
  skip: z.coerce.number().int().nonnegative(),
  take: z.coerce.number().int().positive(),
  search: z.string(),
}).partial();
export type UserQuery = z.infer<typeof zUserQuery>;
export type GetUsersResponsePayload = {
  users: User[];
  total: number;
};

export async function handleGetUsers(req: RequestWithUser, res: ApiResponse<GetUsersResponsePayload>) {
  const query = req.query as UserQuery;

  const hasSearch = query.search && query.search.length > 0;
  const users = await UserModel.getUsers(
    query.skip ?? 0,
    query.take ?? Infinity,
    hasSearch ? query.search : null,
  );
  const total = await UserModel.getTotalUserCount(hasSearch ? query.search : null);

  return res.status(200).send(success({
    users,
    total,
  }));
}

export async function handleGetUser(req: RequestWithUser, res: ApiResponse<{ user: User; auditEvents: AuditEvent[] }>) {
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
    .min(3, { message: 'Username must be at least 3 characters long.' })
    .max(24, { message: 'Username may not be longer than 24 characters.' })
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
    updated = await UserModel.updateUser(user, payload, reqCtx(req));
  } catch (err) {
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

export async function handleVerifyEmailByFiat(req: RequestWithUser, res: ApiResponse<EmptyObject>) {
  const user = await UserModel.getUser(+req.params.id);
  if(!user) {
    return res.status(404).send(failure('NOT_FOUND', `Could not find a user with id ${req.params.id}`));
  }

  await UserModel.verifyEmailByFiat(user, AUDIT_EVENT_SOURCE.ADMIN_CONSOLE, reqCtx(req));

  return res.status(200).send(success({}));
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
    querySchema: zUserQuery,
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
    path: '/:id/verify-email-by-fiat',
    method: HTTP_METHODS.POST,
    handler: handleVerifyEmailByFiat,
    accessLevel: ACCESS_LEVEL.ADMIN,
    paramsSchema: zIdParam(),
  },
  {
    path: '/:id/send-verify-email',
    method: HTTP_METHODS.POST,
    handler: handleSendUserVerifyEmail,
    accessLevel: ACCESS_LEVEL.ADMIN,
    paramsSchema: zIdParam(),
  },
  {
    path: '/:id/send-password-reset-email',
    method: HTTP_METHODS.POST,
    handler: handleSendPasswordResetEmail,
    accessLevel: ACCESS_LEVEL.ADMIN,
    paramsSchema: zIdParam(),
  },
];

export default routes;
