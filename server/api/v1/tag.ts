import { Router } from "express";
import { ApiResponse, success, failure, h } from '../../lib/api-response.ts';

import { requireUser, RequestWithUser } from '../../lib/auth.ts';

import { z } from 'zod';
import { zIdParam } from '../../lib/validators.ts';
import { validateBody, validateParams } from "../../lib/middleware/validate.ts";

import dbClient from "../../lib/db.ts";
import type { Tag } from "@prisma/client";
import { TAG_STATE } from '../../lib/models/tag.ts';

import { logAuditEvent } from '../../lib/audit-events.ts';

const tagRouter = Router();
export default tagRouter;

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

export type TagPayload = {
  name: string;
  color: string;
};
const zTagPayload = z.object({
  name: z.string().min(1),
  color: z.string().min(1),
});

tagRouter.post('/',
  requireUser,
  validateBody(zTagPayload),
  h(handleCreateTag)
);
export async function handleCreateTag(req: RequestWithUser, res: ApiResponse<Tag>) {
  const user = req.user;
  const payload = req.body as TagPayload;

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

tagRouter.put('/:id',
  requireUser,
  validateParams(zIdParam()),
  validateBody(zTagPayload),
  h(handleUpdateTag)
);
export async function handleUpdateTag(req: RequestWithUser, res: ApiResponse<Tag>) {
  const user = req.user;
  const payload = req.body as TagPayload;

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
