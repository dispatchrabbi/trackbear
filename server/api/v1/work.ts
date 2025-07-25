import { ACCESS_LEVEL, HTTP_METHODS, type RouteConfig } from 'server/lib/api.ts';
import { ApiResponse, success, failure } from '../../lib/api-response.ts';

import winston from 'winston';

import { RequestWithUser } from '../../lib/middleware/access.ts';

import path from 'node:path';
import fs from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { getCoverUploadFn, getCoverUploadPath } from 'server/lib/upload.ts';

import { z } from 'zod';
import { zIdParam, NonEmptyArray } from '../../lib/validators.ts';

import dbClient from '../../lib/db.ts';
import type { Work as PrismaWork, Tally, Tag } from 'generated/prisma/client';
import { WORK_PHASE, WORK_STATE, ALLOWED_COVER_FORMATS } from '../../lib/models/work/consts.ts';
import { TALLY_MEASURE, TALLY_STATE } from '../../lib/models/tally/consts.ts';
import { TAG_STATE } from '../../lib/models/tag/consts.ts';

import { logAuditEvent, buildChangeRecord } from '../../lib/audit-events.ts';

import { omit } from '../../lib/obj.ts';

export type Work = Omit<PrismaWork, 'startingBalance'> & {
  startingBalance: Record<string, number | null>;
};

export type SummarizedWork = Work & {
  totals: Record<string, number>;
  lastUpdated: string | null;
};

export type TallyWithTags = Tally & { tags: Tag[] };
export type WorkWithTallies = Work & { tallies: TallyWithTags[] };

export async function handleGetWorks(req: RequestWithUser, res: ApiResponse<SummarizedWork[]>) {
  const worksWithTallies = await dbClient.work.findMany({
    where: {
      ownerId: req.user.id,
      state: WORK_STATE.ACTIVE,
    },
    include: {
      tallies: { where: { state: TALLY_STATE.ACTIVE } },
    },
  });

  const works = worksWithTallies.map(workWithTallies => {
    const totals: Record<string, number> = workWithTallies.tallies.reduce((totals, tally) => {
      totals[tally.measure] = (totals[tally.measure] || 0) + tally.count;
      return totals;
    }, { ...(workWithTallies.startingBalance as Record<string, number>) });

    const lastUpdated = workWithTallies.tallies.length > 0 ?
        workWithTallies.tallies.reduce((last, tally) => {
          return tally.date > last ? tally.date : last;
        }, '0000-00-00') :
      null;

    return {
      ...omit(workWithTallies, ['tallies']),
      totals,
      lastUpdated,
    } as SummarizedWork;
  });

  return res.status(200).send(success(works));
}

export async function handleGetWork(req: RequestWithUser, res: ApiResponse<WorkWithTallies>) {
  const work = await dbClient.work.findUnique({
    where: {
      id: +req.params.id,
      ownerId: req.user.id,
      state: WORK_STATE.ACTIVE,
    },
    include: {
      tallies: {
        where: { state: TALLY_STATE.ACTIVE },
        include: { tags: { where: { state: TAG_STATE.ACTIVE } } },
      },
    },
  }) as WorkWithTallies;

  if(work) {
    return res.status(200).send(success(work));
  } else {
    return res.status(404).send(failure('NOT_FOUND', `Did not find any work with id ${req.params.id}.`));
  }
}

export type WorkCreatePayload = {
  title: string;
  description: string;
  phase: string;
  startingBalance: Record<string, number>;
  starred?: boolean;
  displayOnProfile?: boolean;
};
const zWorkCreatePayload = z.object({
  title: z.string().min(1),
  description: z.string(),
  phase: z.enum(Object.values(WORK_PHASE) as NonEmptyArray<string>),
  startingBalance: z.record(z.enum(Object.values(TALLY_MEASURE) as NonEmptyArray<string>), z.number().int()),
  starred: z.boolean().nullable().default(false),
  displayOnProfile: z.boolean().nullable().default(false),
}).strict();

export async function handleCreateWork(req: RequestWithUser, res: ApiResponse<Work>) {
  const user = req.user;

  const work = await dbClient.work.create({
    data: {
      ...req.body as WorkCreatePayload,
      state: WORK_STATE.ACTIVE,
      ownerId: user.id,
    },
  }) as Work;

  await logAuditEvent('work:create', user.id, work.id, null, null, req.sessionID);

  return res.status(201).send(success(work));
}

export type WorkUpdatePayload = Partial<WorkCreatePayload>;
const zWorkUpdatePayload = zWorkCreatePayload.partial();

export async function handleUpdateWork(req: RequestWithUser, res: ApiResponse<Work>) {
  const user = req.user;
  const payload = req.body as WorkUpdatePayload;

  const work = await dbClient.work.update({
    where: {
      id: +req.params.id,
      ownerId: req.user.id,
      state: WORK_STATE.ACTIVE,
    },
    data: {
      ...payload,
    },
  }) as Work;

  await logAuditEvent('work:update', user.id, work.id, null, null, req.sessionID);

  return res.status(200).send(success(work));
}

export async function handleDeleteWork(req: RequestWithUser, res: ApiResponse<Work>) {
  const user = req.user;

  // Don't actually delete the work; set the status instead
  const work = await dbClient.work.update({
    data: {
      state: WORK_STATE.DELETED,
      tallies: {
        updateMany: {
          where: {
            state: TALLY_STATE.ACTIVE,
          },
          data: {
            state: TALLY_STATE.DELETED,
          },
        },
      },
    },
    where: {
      id: +req.params.id,
      ownerId: req.user.id,
      state: WORK_STATE.ACTIVE,
    },
  }) as Work;

  await logAuditEvent('work:delete', user.id, work.id, null, null, req.sessionID);

  return res.status(200).send(success(work));
}

export async function handlePostCover(req: RequestWithUser, res: ApiResponse<Work>) {
  // quickly check to see if the work exists
  const user = req.user;

  const work = await dbClient.work.findUnique({
    where: {
      id: +req.params.id,
      state: WORK_STATE.ACTIVE,
      ownerId: user.id,
    },
  });

  if(!work) {
    return res.status(404).send(failure('NOT_FOUND', `Did not find any work with id ${req.params.id}`));
  }

  // make sure the file uploads correctly and is under limits and such
  const uploadCover = getCoverUploadFn();
  try {
    await uploadCover(req, res);
  } catch (err) {
    return res.status(400).send(failure(err.code, err.message));
  }

  // is this a file format we accept for covers?
  const isAllowedFormat = Object.keys(ALLOWED_COVER_FORMATS).includes(req.file.mimetype);
  if(!isAllowedFormat) {
    return res.status(400).send(failure('INVALID_FILE_TYPE', `Covers of type ${req.file.mimetype} are not allowed. Allowed types are: ${Object.keys(ALLOWED_COVER_FORMATS).join(', ')}`));
  }

  const coverUploadPath = await getCoverUploadPath();

  // move the uploaded file over to the avatar directory
  const oldPath = req.file.path;
  const filename = randomUUID() + '.' + ALLOWED_COVER_FORMATS[req.file.mimetype];
  const newPath = path.join(coverUploadPath, filename);
  try {
    await fs.copyFile(oldPath, newPath);
  } catch (err) {
    winston.error(`Could not move uploaded cover file (from: ${oldPath}, to: ${newPath}): ${err.message}`, err);
    return res.status(500).send(failure('SERVER_ERROR', 'Could not save cover file'));
  }

  try {
    await fs.rm(oldPath);
  } catch (err) {
    winston.error(`Could not delete uploaded cover file (from: ${oldPath}): ${err.message}`, err);
    // but we don't actually want to stop the upload on this error, so keep going...
  }

  const updated = await dbClient.work.update({
    where: {
      id: +req.params.id,
      state: WORK_STATE.ACTIVE,
      ownerId: user.id,
    },
    data: {
      cover: filename,
    },
  }) as Work;

  // this should only happen if the work somehow got deleted over the course of this function
  if(!updated) {
    return res.status(404).send(failure('NOT_FOUND', `Did not find any work with id ${req.params.id} to update`));
  }

  const changeRecord = buildChangeRecord({ cover: work.cover }, { cover: updated.cover });
  await logAuditEvent('work:cover', req.user.id, work.id, null, changeRecord, req.sessionID);

  return res.status(200).send(success(updated));
}

export async function handleDeleteCover(req: RequestWithUser, res: ApiResponse<Work>) {
  const user = req.user;

  const work = await dbClient.work.findUnique({
    where: {
      id: +req.params.id,
      state: WORK_STATE.ACTIVE,
      ownerId: user.id,
    },
  });

  if(!work) {
    return res.status(404).send(failure('NOT_FOUND', `Did not find any work with id ${req.params.id}`));
  }

  const updated = await dbClient.work.update({
    where: {
      id: +req.params.id,
      state: WORK_STATE.ACTIVE,
      ownerId: user.id,
    },
    data: {
      cover: null,
    },
  }) as Work;

  // this should only happen if the work somehow got deleted before the user clicked delete
  if(!updated) {
    return res.status(404).send(failure('NOT_FOUND', `Did not find any work with id ${req.params.id} to update`));
  }

  const changeRecord = buildChangeRecord({ cover: work.cover }, { cover: updated.cover });
  await logAuditEvent('work:cover', req.user.id, req.user.id, null, changeRecord, req.sessionID);

  return res.status(200).send(success(updated));
}

const routes: RouteConfig[] = [
  {
    path: '/',
    method: HTTP_METHODS.GET,
    handler: handleGetWorks,
    accessLevel: ACCESS_LEVEL.USER,
  },
  {
    path: '/:id',
    method: HTTP_METHODS.GET,
    handler: handleGetWork,
    accessLevel: ACCESS_LEVEL.USER,
    paramsSchema: zIdParam(),
  },
  {
    path: '/',
    method: HTTP_METHODS.POST,
    handler: handleCreateWork,
    accessLevel: ACCESS_LEVEL.USER,
    bodySchema: zWorkCreatePayload,
  },
  {
    path: '/:id',
    method: HTTP_METHODS.PATCH,
    handler: handleUpdateWork,
    accessLevel: ACCESS_LEVEL.USER,
    paramsSchema: zIdParam(),
    bodySchema: zWorkUpdatePayload,
  },
  {
    path: '/:id',
    method: HTTP_METHODS.DELETE,
    handler: handleDeleteWork,
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
