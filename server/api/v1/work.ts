import { Router } from "express";
import { ApiResponse, success, failure, h } from '../../lib/api-response.ts';

import { requireUser, RequestWithUser } from '../../lib/auth.ts';

import { z } from 'zod';
import { zIdParam, NonEmptyArray } from '../../lib/validators.ts';
import { validateBody, validateParams } from "../../lib/middleware/validate.ts";

import dbClient from "../../lib/db.ts";
import type { Work as PrismaWork, Tally, Tag } from "@prisma/client";
import { WORK_PHASE, WORK_STATE } from '../../lib/models/work.ts';
import { TALLY_MEASURE, TALLY_STATE } from "../../lib/models/tally.ts";
import { TAG_STATE } from "../../lib/models/tag.ts";

import { logAuditEvent } from '../../lib/audit-events.ts';

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

const workRouter = Router();
export default workRouter;

workRouter.get('/',
  requireUser,
  h(async (req: RequestWithUser, res: ApiResponse<SummarizedWork[]>) =>
{
  const worksWithTallies = await dbClient.work.findMany({
    where: {
      ownerId: req.user.id,
      state: WORK_STATE.ACTIVE,
    },
    include: {
      tallies: { where: { state: TALLY_STATE.ACTIVE } },
    }
  });

  const works = worksWithTallies.map(workWithTallies => {
    const totals: Record<string, number> = workWithTallies.tallies.reduce((totals, tally) => {
      totals[tally.measure] = (totals[tally.measure] || 0) + tally.count;
      return totals;
    }, { ...(workWithTallies.startingBalance as Record<string, number>) });

    const lastUpdated = workWithTallies.tallies.length > 0 ? workWithTallies.tallies.reduce((last, tally) => {
      return tally.date > last ? tally.date : last
    }, '0000-00-00') : null;

    return {
      ...omit(workWithTallies, [ 'tallies' ]),
      totals,
      lastUpdated
    } as SummarizedWork;
  });

  return res.status(200).send(success(works));
}));

workRouter.get('/:id',
  requireUser,
  validateParams(zIdParam()),
  h(async (req: RequestWithUser, res: ApiResponse<WorkWithTallies>) =>
{
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
    }
  }) as WorkWithTallies;

  if(work) {
    return res.status(200).send(success(work));
  } else {
    return res.status(404).send(failure('NOT_FOUND', `Did not find any work with id ${req.params.id}.`));
  }
}));

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

workRouter.post('/',
  requireUser,
  validateBody(zWorkCreatePayload),
  h(async (req: RequestWithUser, res: ApiResponse<Work>) =>
{
  const user = req.user;

  const work = await dbClient.work.create({
    data: {
      ...req.body as WorkCreatePayload,
      state: WORK_STATE.ACTIVE,
      ownerId: user.id,
    }
  }) as Work;

  await logAuditEvent('work:create', user.id, work.id, null, null, req.sessionID);

  return res.status(201).send(success(work));
}));

export type WorkUpdatePayload = Partial<WorkCreatePayload>;
const zWorkUpdatePayload = zWorkCreatePayload.partial();

workRouter.put('/:id',
  requireUser,
  validateParams(zIdParam()),
  validateBody(zWorkUpdatePayload),
  h(async (req: RequestWithUser, res: ApiResponse<Work>) =>
{
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
}));

workRouter.delete('/:id',
  requireUser,
  validateParams(zIdParam()),
  h(async (req: RequestWithUser, res: ApiResponse<Work>) =>
{
  const user = req.user;

  // Don't actually delete the work; set the status instead
  const work = await dbClient.work.update({
    data: {
      state: WORK_STATE.DELETED,
      tallies: {
        updateMany: {
          where: {
            state: TALLY_STATE.ACTIVE
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
}));
