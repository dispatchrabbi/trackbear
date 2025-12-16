import { ACCESS_LEVEL, HTTP_METHODS, type RouteConfig } from 'server/lib/api.ts';
import { type ApiResponse, success, failure } from '../../lib/api-response.ts';

import { getLogger } from 'server/lib/logger.ts';
const logger = getLogger();

import { type RequestWithUser } from '../../lib/middleware/access.ts';

import path from 'node:path';
import fs from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { getCoverUploadFn, getCoverUploadPath } from 'server/lib/upload.ts';

import * as z from 'zod';
import { zIdParam, type NonEmptyArray } from '../../lib/validators.ts';

import { ProjectModel, type Project, type SummarizedProject, type ProjectWithTallies } from 'server/lib/models/project/project-model.ts';
import { PROJECT_PHASE, ALLOWED_COVER_FORMATS } from '../../lib/models/project/consts.ts';
import { TALLY_MEASURE } from '../../lib/models/tally/consts.ts';

import { reqCtx } from 'server/lib/request-context.ts';

export type { SummarizedProject, ProjectWithTallies, Project };

export async function handleGetProjects(req: RequestWithUser, res: ApiResponse<SummarizedProject[]>) {
  const summarizedProjects = await ProjectModel.getSummarizedProjects(req.user);

  return res.status(200).send(success(summarizedProjects));
}

export async function handleGetProject(req: RequestWithUser, res: ApiResponse<Project>) {
  const project = await ProjectModel.getProject(req.user, +req.params.id);
  if(!project) {
    return res.status(404).send(failure('NOT_FOUND', `Did not find any project with id ${req.params.id}.`));
  }

  return res.status(200).send(success(project));
}

export type ProjectCreatePayload = {
  title: string;
  description: string;
  phase: string;
  startingBalance: Record<string, number>;
  starred?: boolean;
  displayOnProfile?: boolean;
};
const zProjectCreatePayload = z.strictObject({
  title: z.string().min(1),
  description: z.string(),
  phase: z.enum(Object.values(PROJECT_PHASE) as NonEmptyArray<string>),
  startingBalance: z.partialRecord(z.enum(Object.values(TALLY_MEASURE)), z.number().int()),
  starred: z.boolean().nullable().optional(),
  displayOnProfile: z.boolean().nullable().optional(),
});

export async function handleCreateProject(req: RequestWithUser, res: ApiResponse<Project>) {
  const user = req.user;
  const payload = req.body as ProjectCreatePayload;

  const created = await ProjectModel.createProject(user, payload, reqCtx(req));

  return res.status(201).send(success(created));
}

export type ProjectUpdatePayload = Partial<ProjectCreatePayload>;
const zProjectUpdatePayload = zProjectCreatePayload.partial();

export async function handleUpdateProject(req: RequestWithUser, res: ApiResponse<Project>) {
  const user = req.user;
  const payload = req.body as ProjectUpdatePayload;

  const original = await ProjectModel.getProject(user, +req.params.id);
  if(!original) {
    return res.status(404).send(failure('NOT_FOUND', `Did not find any project with id ${req.params.id}.`));
  }

  const updated = await ProjectModel.updateProject(user, original, payload, reqCtx(req));

  return res.status(200).send(success(updated));
}

export async function handleDeleteProject(req: RequestWithUser, res: ApiResponse<Project>) {
  const user = req.user;

  const original = await ProjectModel.getProject(user, +req.params.id);
  if(!original) {
    return res.status(404).send(failure('NOT_FOUND', `Did not find any project with id ${req.params.id}.`));
  }

  const deleted = await ProjectModel.deleteProject(user, original, reqCtx(req));

  return res.status(200).send(success(deleted));
}

export async function handlePostCover(req: RequestWithUser, res: ApiResponse<Project>) {
  // quickly check to see if the project exists
  const user = req.user;

  const project = await ProjectModel.getProject(user, +req.params.id);
  if(!project) {
    return res.status(404).send(failure('NOT_FOUND', `Did not find any project with id ${req.params.id}`));
  }

  // make sure the file uploads correctly and is under limits and such
  const uploadCover = getCoverUploadFn();
  try {
    await uploadCover(req, res);
  } catch (err) {
    return res.status(400).send(failure(err.code, err.message));
  }

  // is this a file format we accept for covers?
  const isAllowedFormat = Object.keys(ALLOWED_COVER_FORMATS).includes(req.file!.mimetype);
  if(!isAllowedFormat) {
    return res.status(400).send(failure('INVALID_FILE_TYPE', `Covers of type ${req.file!.mimetype} are not allowed. Allowed types are: ${Object.keys(ALLOWED_COVER_FORMATS).join(', ')}`));
  }

  const coverUploadPath = await getCoverUploadPath();

  // move the uploaded file over to the avatar directory
  const oldPath = req.file!.path;
  const filename = randomUUID() + '.' + ALLOWED_COVER_FORMATS[req.file!.mimetype];
  const newPath = path.join(coverUploadPath, filename);
  try {
    await fs.copyFile(oldPath, newPath);
  } catch (err) {
    logger.error(`Could not move uploaded cover file (from: ${oldPath}, to: ${newPath}): ${err.message}`, err);
    return res.status(500).send(failure('SERVER_ERROR', 'Could not save cover file'));
  }

  try {
    await fs.rm(oldPath);
  } catch (err) {
    logger.error(`Could not delete uploaded cover file (from: ${oldPath}): ${err.message}`, err);
    // but we don't actually want to stop the upload on this error, so keep going...
  }

  const updated = await ProjectModel.updateProject(user, project, {
    cover: filename,
  }, reqCtx(req));
  if(!updated) {
    // this should only happen if the project somehow got deleted over the course of this function
    return res.status(404).send(failure('NOT_FOUND', `Did not find any project with id ${req.params.id} to update`));
  }

  return res.status(200).send(success(updated));
}

export async function handleDeleteCover(req: RequestWithUser, res: ApiResponse<Project>) {
  const user = req.user;

  const project = await ProjectModel.getProject(user, +req.params.id);
  if(!project) {
    return res.status(404).send(failure('NOT_FOUND', `Did not find any project with id ${req.params.id}`));
  }

  const updated = await ProjectModel.updateProject(user, project, {
    cover: null,
  }, reqCtx(req));
  if(!updated) {
    // this should only happen if the project somehow got deleted before the user clicked delete
    return res.status(404).send(failure('NOT_FOUND', `Did not find any project with id ${req.params.id} to update`));
  }

  return res.status(200).send(success(updated));
}

const routes: RouteConfig[] = [
  {
    path: '/',
    method: HTTP_METHODS.GET,
    handler: handleGetProjects,
    accessLevel: ACCESS_LEVEL.USER,
  },
  {
    path: '/:id',
    method: HTTP_METHODS.GET,
    handler: handleGetProject,
    accessLevel: ACCESS_LEVEL.USER,
    paramsSchema: zIdParam(),
  },
  {
    path: '/',
    method: HTTP_METHODS.POST,
    handler: handleCreateProject,
    accessLevel: ACCESS_LEVEL.USER,
    bodySchema: zProjectCreatePayload,
  },
  {
    path: '/:id',
    method: HTTP_METHODS.PATCH,
    handler: handleUpdateProject,
    accessLevel: ACCESS_LEVEL.USER,
    paramsSchema: zIdParam(),
    bodySchema: zProjectUpdatePayload,
  },
  {
    path: '/:id',
    method: HTTP_METHODS.DELETE,
    handler: handleDeleteProject,
    accessLevel: ACCESS_LEVEL.USER,
    paramsSchema: zIdParam(),
  },
  {
    path: '/:id/cover',
    method: HTTP_METHODS.POST,
    handler: handlePostCover,
    accessLevel: ACCESS_LEVEL.USER,
    paramsSchema: zIdParam(),
  },
  {
    path: '/:id/cover',
    method: HTTP_METHODS.DELETE,
    handler: handleDeleteCover,
    accessLevel: ACCESS_LEVEL.USER,
    paramsSchema: zIdParam(),
  },
];

export default routes;
