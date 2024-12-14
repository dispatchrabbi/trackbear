import { ACCESS_LEVEL, HTTP_METHODS, type RouteConfig } from "server/lib/api.ts";
import { ApiResponse, success, failure } from '../../lib/api-response.ts';
import { RequestWithUser } from '../../lib/middleware/access.ts';

import { z } from 'zod';
import { zIdParam } from '../../lib/validators.ts';

import dbClient from "../../lib/db.ts";
import type { AuditEvent } from "@prisma/client";
import {
  USER_STATE,
  USERNAME_REGEX, type UserState
} from "../../lib/models/user/consts.ts";
import {
  UserModel, type User,
} from "../../lib/models/user/user.ts";

import { reqCtx } from "server/lib/request-context.ts";
import { CollisionError, ValidationError } from "server/lib/models/errors.ts";

type EmptyObject = Record<string, never>;

export async function handleGetUsers(req: RequestWithUser, res: ApiResponse<User[]>) {
  const users = await UserModel.getUsers();

  return res.status(200).send(success(users));
}

export async function handleGetUser(req: RequestWithUser, res: ApiResponse<{ user: User; auditEvents: AuditEvent[]; }>) {
  const user = await UserModel.getUser(+req.params.id);

  // TODO: replace when the audit event model exists
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
}).strict().partial();

export async function handleUpdateUser(req: RequestWithUser, res: ApiResponse<User>) {
  const payload = req.body as UserUpdatePayload;

  let updated;
  try {
    updated = await UserModel.updateUser(+req.params.id, payload, reqCtx(req))
  } catch(err) {
    if(err instanceof ValidationError) {
      return res.status(400).send(failure('VALIDATION_FAILED', err.meta.reason));
    } else if(err instanceof CollisionError) {
      return res.status(409).send(failure('USERNAME_EXISTS', 'A user with that username already exists.'));
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
  const payload = req.body as UserStatePayload;

  const updated = await UserModel.updateUserState(+req.params.id, payload.state as UserState, reqCtx(req));

  return res.status(200).send(success(updated));
}

export async function handleSendUserVerifyEmail(req: RequestWithUser, res: ApiResponse<EmptyObject>) {
  await UserModel.sendEmailVerificationLink(+req.params.id, { force: true }, reqCtx(req));

  return res.status(201).send(success({}));
}

export async function handleSendPasswordResetEmail(req: RequestWithUser, res: ApiResponse<EmptyObject>) {
  await UserModel.sendPasswordResetLink(+req.params.id, {}, reqCtx(req));

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
    method: HTTP_METHODS.PUT,
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