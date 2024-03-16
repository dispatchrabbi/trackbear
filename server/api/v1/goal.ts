import { Router } from "express";
import { ApiResponse, success, failure, h } from '../../lib/api-response.ts';

import { requireUser, RequestWithUser } from '../../lib/auth.ts';

import { z } from 'zod';
import { zIdParam, NonEmptyArray } from '../../lib/validators.ts';
import { validateBody, validateParams } from "../../lib/middleware/validate.ts";

import dbClient from "../../lib/db.ts";
import type { Goal, Tally } from "@prisma/client";
import { GOAL_STATE, GOAL_TYPE, GOAL_CADENCE_UNIT, getTalliesForGoal } from "../../lib/models/goal.ts";
import type { GoalParameters, GoalWithWorksAndTags } from "../../lib/models/goal.ts"
import { WORK_STATE } from '../../lib/models/work.ts';
import { TALLY_MEASURE } from "../../lib/models/tally.ts";
import { TAG_STATE } from "../../lib/models/tag.ts";

import { logAuditEvent } from '../../lib/audit-events.ts';

import { omit } from '../../lib/obj.ts';

export type { GoalWithWorksAndTags, GoalParameters };
export type GoalAndTallies = {
  goal: GoalWithWorksAndTags;
  tallies: Tally[]
};

const goalRouter = Router();
export default goalRouter;

goalRouter.get('/',
  requireUser,
  h(async (req: RequestWithUser, res: ApiResponse<Goal[]>) =>
{
  const goals = await dbClient.goal.findMany({
    where: {
      ownerId: req.user.id,
      state: GOAL_STATE.ACTIVE,
    },
  });

  return res.status(200).send(success(goals))
}));

goalRouter.get('/:id',
  requireUser,
  validateParams(zIdParam()),
  h(async (req: RequestWithUser, res: ApiResponse<GoalAndTallies>) =>
{
  const goal = await dbClient.goal.findUnique({
    where: {
      id: +req.params.id,
      ownerId: req.user.id,
      state: GOAL_STATE.ACTIVE,
    },
    include: {
      worksIncluded: { where: { ownerId: req.user.id, state: WORK_STATE.ACTIVE } },
      tagsIncluded: { where: { ownerId: req.user.id, state: TAG_STATE.ACTIVE } },
    },
  });

  if(!goal) {
    return res.status(404).send(failure('NOT_FOUND', `Did not find any goal with id ${req.params.id}.`));
  }

  const tallies = await getTalliesForGoal(goal);

  return res.status(200).send(success({
    goal,
    tallies,
  }))
}));

export type GoalPayload = {
  title: string;
  description: string;
  type: string;
  parameters: GoalParameters; // I could enforce this more strictly with a discriminated union, but it's fine for now
  startDate?: string;
  endDate?: string;
  works: number[];
  tags: number[];
};

const zCommonGoalPayload = {
  title: z.string(),
  description: z.string(),
  startDate: z.string().nullable(),
  endDate: z.string().nullable(),
  works: z.array(z.number().int()),
  tags: z.array(z.number().int()),
};
const zGaolPayload = z.discriminatedUnion('type', [
  z.object({
    type: z.literal(GOAL_TYPE.TARGET),
    parameters: z.object({
      threshold: z.object({
        measure: z.enum(Object.values(TALLY_MEASURE) as NonEmptyArray<string>),
        count: z.number().int(),
      }),
    }),
    ...zCommonGoalPayload,
  }),
  z.object({
    type: z.literal(GOAL_TYPE.HABIT),
    parameters: z.object({
      cadence: z.object({
        unit: z.enum(Object.values(GOAL_CADENCE_UNIT) as NonEmptyArray<string>),
        period: z.number().int(),
      }),
      threshold: z.object({
        measure: z.enum(Object.values(TALLY_MEASURE) as NonEmptyArray<string>),
        count: z.number().int(),
      }).nullable(),
    }),
    ...zCommonGoalPayload,
  }),
]);

goalRouter.post('/',
  requireUser,
  validateBody(zGaolPayload),
  h(async (req: RequestWithUser, res: ApiResponse<GoalAndTallies>) =>
{
  const user = req.user;
  const payload = req.body as GoalPayload;

  const goal = await dbClient.goal.create({
    data: {
      state: WORK_STATE.ACTIVE,
      ownerId: user.id,

      ...omit(payload, ['works', 'tags']),
      worksIncluded: { connect: payload.works.map(workId => ({
        id: workId,
        ownerId: user.id,
        state: WORK_STATE.ACTIVE,
      })) },
      tagsIncluded: { connect: payload.tags.map(workId => ({
        id: workId,
        ownerId: user.id,
        state: TAG_STATE.ACTIVE,
      })) },
    },
    include: {
      worksIncluded: { where: { ownerId: req.user.id, state: WORK_STATE.ACTIVE } },
      tagsIncluded: { where: { ownerId: req.user.id, state: TAG_STATE.ACTIVE } },
    },
  });

  await logAuditEvent('goal:create', user.id, goal.id);

  const tallies = await getTalliesForGoal(goal);

  return res.status(201).send(success({ goal, tallies }));
}));

// workRouter.put('/:id',
//   requireUser,
//   validateParams(zIdParam()),
//   validateBody(zWorkPayload),
//   h(async (req: RequestWithUser, res: ApiResponse<Work>) =>
// {
//   const user = req.user;

//   const work = await dbClient.work.update({
//     where: {
//       id: +req.params.id,
//       ownerId: req.user.id,
//       state: WORK_STATE.ACTIVE,
//     },
//     data: {
//       ...req.body as WorkPayload,
//     },
//   });

//   await logAuditEvent('work:update', user.id, work.id);

//   return res.status(200).send(success(work));
// }));

goalRouter.delete('/:id',
  requireUser,
  validateParams(zIdParam()),
  h(async (req: RequestWithUser, res: ApiResponse<Goal>) =>
{
  const user = req.user;

  // Don't actually delete the goal; set the status instead
  const goal = await dbClient.goal.update({
    data: {
      state: GOAL_STATE.DELETED,
    },
    where: {
      id: +req.params.id,
      ownerId: req.user.id,
      state: GOAL_STATE.ACTIVE,
    },
  });

  await logAuditEvent('goal:delete', user.id, goal.id);

  return res.status(200).send(success(goal));
}));
