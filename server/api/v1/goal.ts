import { Router } from "express";
import { ApiResponse, success, failure, h } from '../../lib/api-response.ts';

import { requireUser, RequestWithUser } from '../../lib/auth.ts';

import { z } from 'zod';
import { zIdParam, NonEmptyArray } from '../../lib/validators.ts';
import { validateBody, validateParams } from "../../lib/middleware/validate.ts";

import dbClient from "../../lib/db.ts";
import type { Goal } from "@prisma/client";
import { GOAL_STATE, GOAL_TYPE, GOAL_CADENCE_UNIT, getTalliesForGoal } from "../../lib/models/goal.ts";
import type { GoalParameters, GoalWithWorksAndTags } from "../../lib/models/goal.ts"
import { TallyWithWorkAndTags } from "./tally.ts";
import { WORK_STATE } from '../../lib/models/work.ts';
import { TALLY_MEASURE } from "../../lib/models/tally.ts";
import { TAG_STATE } from "../../lib/models/tag.ts";

import { logAuditEvent } from '../../lib/audit-events.ts';

import { omit } from '../../lib/obj.ts';

export type { GoalWithWorksAndTags, GoalParameters };
export type GoalAndTallies = {
  goal: GoalWithWorksAndTags;
  tallies: TallyWithWorkAndTags[]
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

export type GoalCreatePayload = {
  title: string;
  description: string;
  type: string;
  parameters: GoalParameters; // I could enforce this more strictly with a discriminated union, but it's fine for now
  startDate?: string;
  endDate?: string;
  starred?: boolean;
  works: number[];
  tags: number[];
};

const zTargetGoalParameters = z.object({
  threshold: z.object({
    measure: z.enum(Object.values(TALLY_MEASURE) as NonEmptyArray<string>),
    count: z.number().int(),
  }),
}).strict();
const zHabitGoalParameters = z.object({
  cadence: z.object({
    unit: z.enum(Object.values(GOAL_CADENCE_UNIT) as NonEmptyArray<string>),
    period: z.number().int(),
  }),
  threshold: z.object({
    measure: z.enum(Object.values(TALLY_MEASURE) as NonEmptyArray<string>),
    count: z.number().int(),
  }).nullable(),
}).strict();
const zGoalCreatePayload = z.object({
  title: z.string().min(1),
  description: z.string(),
  type: z.enum(Object.values(GOAL_TYPE) as NonEmptyArray<string>),
  parameters: z.union([ zTargetGoalParameters, zHabitGoalParameters ]), // I could enforce this more strictly with a discriminated union, but it's terrible in zod
  startDate: z.string().nullable(),
  endDate: z.string().nullable(),
  starred: z.boolean().nullable().default(false),
  works: z.array(z.number().int()),
  tags: z.array(z.number().int()),
}).strict();

goalRouter.post('/',
  requireUser,
  validateBody(zGoalCreatePayload),
  h(async (req: RequestWithUser, res: ApiResponse<GoalAndTallies>) =>
{
  const user = req.user;
  const payload = req.body as GoalCreatePayload;

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

  await logAuditEvent('goal:create', user.id, goal.id, null, null, req.sessionID);

  const tallies = await getTalliesForGoal(goal);

  return res.status(201).send(success({ goal, tallies }));
}));

export type GoalUpdatePayload = Partial<GoalCreatePayload>;
const zGoalUpdatePayload = zGoalCreatePayload.partial();

goalRouter.put('/:id',
  requireUser,
  validateParams(zIdParam()),
  validateBody(zGoalUpdatePayload),
  h(async (req: RequestWithUser, res: ApiResponse<GoalAndTallies>) =>
{
  const user = req.user;
  const payload = req.body as GoalUpdatePayload;

  const goal = await dbClient.goal.update({
    where: {
      id: +req.params.id,
      ownerId: req.user.id,
      state: WORK_STATE.ACTIVE,
    },
    data: {
      ...omit(payload, ['works', 'tags']),
      worksIncluded: payload.works ? { set: payload.works.map(workId => ({
        id: workId,
        ownerId: user.id,
        state: WORK_STATE.ACTIVE,
      })) } : undefined,
      tagsIncluded: payload.tags ? { set: payload.tags.map(workId => ({
        id: workId,
        ownerId: user.id,
        state: TAG_STATE.ACTIVE,
      })) } : undefined,
    },
    include: {
      worksIncluded: { where: { ownerId: req.user.id, state: WORK_STATE.ACTIVE } },
      tagsIncluded: { where: { ownerId: req.user.id, state: TAG_STATE.ACTIVE } },
    },
  });

  await logAuditEvent('goal:update', user.id, goal.id, null, null, req.sessionID);

  const tallies = await getTalliesForGoal(goal);

  return res.status(200).send(success({ goal, tallies }));
}));

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

  await logAuditEvent('goal:delete', user.id, goal.id, null, null, req.sessionID);

  return res.status(200).send(success(goal));
}));
