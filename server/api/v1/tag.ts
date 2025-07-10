import { HTTP_METHODS, ACCESS_LEVEL, type RouteConfig } from '../../lib/api.ts';
import { ApiResponse, success, failure } from '../../lib/api-response.ts';

import { RequestWithUser } from '../../lib/middleware/access.ts';

import { z } from 'zod';
import { zIdParam } from '../../lib/validators.ts';

import { TagModel, type Tag, type TagData } from '../../lib/models/tag/tag-model.ts';
import { TAG_COLORS } from '../../lib/models/tag/consts.ts';

import { reqCtx } from '../../lib/request-context.ts';
import { ValidationError } from 'server/lib/models/errors.ts';

export async function handleGetTags(req: RequestWithUser, res: ApiResponse<Tag[]>) {
  const tags = await TagModel.getTags(req.user);

  return res.status(200).send(success(tags));
}

export async function handleGetTag(req: RequestWithUser, res: ApiResponse<Tag>) {
  const tag = await TagModel.getTag(req.user, +req.params.id);

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
  color: z.enum(TAG_COLORS),
});

export async function handleCreateTag(req: RequestWithUser, res: ApiResponse<Tag>) {
  const user = req.user;
  const payload = req.body as TagCreatePayload;

  let created;
  try {
    created = await TagModel.createTag(user, payload as TagData, reqCtx(req));
  } catch (err) {
    if(err instanceof ValidationError) {
      return res.status(400).send(failure('TAG_EXISTS', `There is already a tag called ${payload.name}`));
    } else {
      throw err;
    }
  }

  return res.status(201).send(success(created));
}

export type TagUpdatePayload = Partial<TagCreatePayload>;
const zTagUpdatePayload = zTagCreatePayload.partial();

export async function handleUpdateTag(req: RequestWithUser, res: ApiResponse<Tag>) {
  const user = req.user;
  const payload = req.body as TagUpdatePayload;

  const original = await TagModel.getTag(user, +req.params.id);
  if(!original) {
    return res.status(404).send(failure('NOT_FOUND', `Did not find any tag with id ${req.params.id}.`));
  }

  let updated;
  try {
    updated = await TagModel.updateTag(user, original, payload as Partial<TagData>, reqCtx(req));
  } catch (err) {
    if(err instanceof ValidationError) {
      return res.status(400).send(failure('TAG_EXISTS', `There is already a tag called ${payload.name}`));
    } else {
      throw err;
    }
  }

  return res.status(200).send(success(updated));
}

export async function handleDeleteTag(req: RequestWithUser, res: ApiResponse<Tag>) {
  const user = req.user;

  const original = await TagModel.getTag(user, +req.params.id);
  if(!original) {
    return res.status(404).send(failure('NOT_FOUND', `Did not find any tag with id ${req.params.id}.`));
  }

  const deleted = await TagModel.deleteTag(user, original, reqCtx(req));

  return res.status(200).send(success(deleted));
}

const routes: RouteConfig[] = [
  {
    path: '/',
    method: HTTP_METHODS.GET,
    handler: handleGetTags,
    accessLevel: ACCESS_LEVEL.SESSION,
  },
  {
    path: '/:id',
    method: HTTP_METHODS.GET,
    handler: handleGetTag,
    accessLevel: ACCESS_LEVEL.SESSION,
    paramsSchema: zIdParam(),
  },
  {
    path: '/',
    method: HTTP_METHODS.POST,
    handler: handleCreateTag,
    accessLevel: ACCESS_LEVEL.SESSION,
    bodySchema: zTagCreatePayload,
  },
  {
    path: '/:id',
    method: HTTP_METHODS.PATCH,
    handler: handleUpdateTag,
    accessLevel: ACCESS_LEVEL.SESSION,
    paramsSchema: zIdParam(),
    bodySchema: zTagUpdatePayload,
  },
  {
    path: '/:id',
    method: HTTP_METHODS.DELETE,
    handler: handleDeleteTag,
    accessLevel: ACCESS_LEVEL.SESSION,
    paramsSchema: zIdParam(),
  },
];

export default routes;
