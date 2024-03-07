import { Router } from "express";
import { ApiResponse, success, failure, h } from '../../lib/api-response.ts';

import { requireUser, RequestWithUser } from '../../lib/auth.ts';

import { z } from 'zod';
import { zIdParam, NonEmptyArray } from '../../lib/validators.ts';
import { validateBody, validateParams } from "../../lib/middleware/validate.ts";

import dbClient from "../../lib/db.ts";
import type { Work, Tally, Tag } from "@prisma/client";
import { WORK_PHASE, WORK_STATE } from '../../lib/entities/work.ts';
import { TALLY_STATE } from "../../lib/entities/tally.ts";
import { TAG_STATE } from "../../lib/entities/tag.ts";

import { logAuditEvent } from '../../lib/audit-events.ts';

import { omit } from '../../lib/obj.ts';

export type WorkWithTotals = Work & { totals: Record<string, number> };

type TallyWithTags = Tally & { tags: Tag[] };
export type WorkWithTallies = Work & { tallies: TallyWithTags[] };

const workRouter = Router();
export default workRouter;

workRouter.get('/',
  requireUser,
  h(async (req: RequestWithUser, res: ApiResponse<WorkWithTotals[]>) =>
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
    }, {});

    return {
      ...omit(workWithTallies, [ 'tallies' ]),
      totals,
    };
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
  });

  if(work) {
    return res.status(200).send(success(work));
  } else {
    return res.status(404).send(failure('NOT_FOUND', `Did not find any work with id ${req.params.id}.`));
  }
}));

export type WorkPayload = {
  title: string;
  description: string;
  phase: string;
};
const zWorkPayload = z.object({
  title: z.string().min(1),
  description: z.string(),
  phase: z.enum(Object.values(WORK_PHASE) as NonEmptyArray<string>),
});

workRouter.post('/',
  requireUser,
  validateBody(zWorkPayload),
  h(async (req: RequestWithUser, res: ApiResponse<Work>) =>
{
  const user = req.user;

  const work = await dbClient.work.create({
    data: {
      ...req.body as WorkPayload,
      state: WORK_STATE.ACTIVE,
      ownerId: user.id,
    }
  });

  await logAuditEvent('work:create', user.id, work.id);

  return res.status(201).send(success(work));
}));

workRouter.put('/:id',
  requireUser,
  validateParams(zIdParam()),
  validateBody(zWorkPayload),
  h(async (req: RequestWithUser, res: ApiResponse<Work>) =>
{
  const user = req.user;

  const work = await dbClient.work.update({
    where: {
      id: +req.params.id,
      ownerId: req.user.id,
      state: WORK_STATE.ACTIVE,
    },
    data: {
      ...req.body as WorkPayload,
    },
  });

  await logAuditEvent('work:update', user.id, work.id);

  return res.status(200).send(success(work));
}));

workRouter.delete('/:id',
  requireUser,
  validateParams(zIdParam()),
  h(async (req: RequestWithUser, res: ApiResponse<Work>) =>
{
  const user = req.user;

  const work = await dbClient.work.delete({
    where: {
      id: +req.params.id,
      ownerId: req.user.id,
      state: WORK_STATE.ACTIVE,
    },
  });

  await logAuditEvent('work:delete', user.id, work.id);

  return res.status(200).send(success(work));
}));
