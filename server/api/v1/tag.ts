import { Router } from "express";
import { HTTP_METHODS, ACCESS_LEVEL, type RouteConfig } from "server/lib/api.ts";
import { ApiResponse, success, failure, h } from '../../lib/api-response.ts';

import { requireUser, RequestWithUser } from '../../lib/middleware/access.ts';

import { z } from 'zod';
import { zIdParam } from '../../lib/validators.ts';
import { validateBody, validateParams } from "../../lib/middleware/validate.ts";

import dbClient from "../../lib/db.ts";
import type { Tag } from "@prisma/client";
import { TAG_STATE } from '../../lib/models/tag.ts';

import { logAuditEvent } from '../../lib/audit-events.ts';

export const tagRouter = Router();

tagRouter.get('/',
  requireUser,
  h(handleGetTags)
);
export async function handleGetTags(req: RequestWithUser, res: ApiResponse<Tag[]>) {
  const tags = await dbClient.tag.findMany({
    where: {
      ownerId: req.user.id,
      state: TAG_STATE.ACTIVE,
    }
  });

  return res.status(200).send(success(tags));
}

tagRouter.get('/:id',
  requireUser,
  validateParams(zIdParam()),
  h(handleGetTag)
);
export async function handleGetTag(req: RequestWithUser, res: ApiResponse<Tag>) {
  const tag = await dbClient.tag.findUnique({
    where: {
      id: +req.params.id,
      ownerId: req.user.id,
      state: TAG_STATE.ACTIVE,
    }
  });

  if(tag) {
    return res.status(200).send(success(tag));
  } else {
    return res.status(404).send(failure('NOT_FOUND', `Did not find any tag with id ${req.params.id}.`));
  }
}

export type TagCreatePayload = {
  name: string;
  color: string;
};
const zTagCreatePayload = z.object({
  name: z.string().min(1),
  color: z.string().min(1),
});

tagRouter.post('/',
  requireUser,
  validateBody(zTagCreatePayload),
  h(handleCreateTag)
);
export async function handleCreateTag(req: RequestWithUser, res: ApiResponse<Tag>) {
  const user = req.user;
  const payload = req.body as TagCreatePayload;

  const existingTags = await dbClient.tag.findMany({
    where: {
      name: payload.name,
      ownerId: user.id,
      state: TAG_STATE.ACTIVE,
    }
  });
  if(existingTags.length > 0) {
    return res.status(400).send(failure('TAG_EXISTS', `There is already a tag called ${payload.name}`));
  }

  const tag = await dbClient.tag.create({
    data: {
      ...payload,
      state: TAG_STATE.ACTIVE,
      ownerId: user.id,
    }
  });

  await logAuditEvent('tag:create', user.id, tag.id, null, null, req.sessionID);

  return res.status(201).send(success(tag));
}

export type TagUpdatePayload = Partial<TagCreatePayload>;
const zTagUpdatePayload = zTagCreatePayload.partial();

tagRouter.put('/:id',
  requireUser,
  validateParams(zIdParam()),
  validateBody(zTagUpdatePayload),
  h(handleUpdateTag)
);
export async function handleUpdateTag(req: RequestWithUser, res: ApiResponse<Tag>) {
  const user = req.user;
  const payload = req.body as TagUpdatePayload;

  const existingTags = await dbClient.tag.findMany({
    where: {
      name: payload.name,
      ownerId: user.id,
      state: TAG_STATE.ACTIVE,
      id: { notIn: [ +req.params.id ] },
    }
  });
  if(existingTags.length > 0) {
    return res.status(400).send(failure('TAG_EXISTS', `There is already a tag called ${payload.name}`));
  }

  const tag = await dbClient.tag.update({
    where: {
      id: +req.params.id,
      ownerId: req.user.id,
      state: TAG_STATE.ACTIVE,
    },
    data: { ...payload },
  });

  await logAuditEvent('tag:update', user.id, tag.id, null, null, req.sessionID);

  return res.status(200).send(success(tag));
}

tagRouter.delete('/:id',
  requireUser,
  validateParams(zIdParam()),
  h(handleDeleteTag)
);
export async function handleDeleteTag(req: RequestWithUser, res: ApiResponse<Tag>) {
  const user = req.user;

  // tags actually get deleted instead of a status change
  const tag = await dbClient.tag.delete({
    where: {
      id: +req.params.id,
      ownerId: req.user.id,
      state: TAG_STATE.ACTIVE,
    },
  });

  await logAuditEvent('tag:delete', user.id, tag.id, null, null, req.sessionID);

  return res.status(200).send(success(tag));
}

const routes: RouteConfig[] = [
  {
    path: '/',
    method: HTTP_METHODS.GET,
    handler: handleGetTags,
    accessLevel: ACCESS_LEVEL.USER,
  },
  {
    path: '/:id',
    method: HTTP_METHODS.GET,
    handler: handleGetTag,
    accessLevel: ACCESS_LEVEL.USER,
    paramsSchema: zIdParam(),
  },
  {
    path: '/',
    method: HTTP_METHODS.POST,
    handler: handleCreateTag,
    accessLevel: ACCESS_LEVEL.USER,
    bodySchema: zTagCreatePayload,
  },
  {
    path: '/:id',
    method: HTTP_METHODS.PATCH,
    handler: handleUpdateTag,
    accessLevel: ACCESS_LEVEL.USER,
    paramsSchema: zIdParam(),
    bodySchema: zTagUpdatePayload,
  },
  {
    path: '/:id',
    method: HTTP_METHODS.DELETE,
    handler: handleDeleteTag,
    accessLevel: ACCESS_LEVEL.USER,
    paramsSchema: zIdParam(),
  },
];

export default routes;