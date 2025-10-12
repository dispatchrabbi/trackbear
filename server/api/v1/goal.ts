import { HTTP_METHODS, ACCESS_LEVEL, type RouteConfig } from 'server/lib/api.ts';
import { type ApiResponse, success, failure } from '../../lib/api-response.ts';

import { type RequestWithUser } from '../../lib/middleware/access.ts';

import { z } from 'zod';
import { zIdParam, type NonEmptyArray } from '../../lib/validators.ts';

import { getDbClient } from 'server/lib/db.ts';
import { GOAL_TYPE, GOAL_CADENCE_UNIT } from '../../lib/models/goal/consts.ts';
import type { HabitGoalParameters, TargetGoalParameters } from 'server/lib/models/goal/types.ts';
import { PROJECT_STATE } from '../../lib/models/project/consts.ts';
import { TALLY_MEASURE } from '../../lib/models/tally/consts.ts';
import { TAG_STATE } from '../../lib/models/tag/consts.ts';

import { logAuditEvent } from '../../lib/audit-events.ts';

import { omit } from '../../lib/obj.ts';
import { type CreateGoalData, GoalModel, type UpdateGoalData, type Goal } from 'server/lib/models/goal/goal-model.ts';
import { isTargetAchieved, isTargetGoal } from 'server/lib/models/goal/helpers.ts';
import { reqCtx } from 'server/lib/request-context.ts';

export type { Goal };

export type GoalWithAchievement = Goal & {
  achieved: boolean;
};

export async function handleGetGoals(req: RequestWithUser, res: ApiResponse<GoalWithAchievement[]>) {
  const goals = await GoalModel.getGoals(req.user) as GoalWithAchievement[];

  const targetTotals = await GoalModel.getTargetTotals(req.user);

  for(const goal of goals) {
    if(isTargetGoal(goal)) {
      const target = targetTotals.get(goal.id);
      goal.achieved = target === undefined ? false : isTargetAchieved(goal, target);
    } else {
      goal.achieved = false;
    }
  }

  return res.status(200).send(success(goals));
}

export async function handleGetGoal(req: RequestWithUser, res: ApiResponse<Goal>) {
  const goal = await GoalModel.getGoal(req.user, +req.params.id);

  if(!goal) {
    return res.status(404).send(failure('NOT_FOUND', `Did not find any goal with id ${req.params.id}.`));
  }

  return res.status(200).send(success(goal));
}

export type GoalCreatePayload = {
  title: string;
  description: string;
  type: string;
  parameters: TargetGoalParameters | HabitGoalParameters; // I could enforce this more strictly with a discriminated union, but it's fine for now
  startDate: string | null;
  endDate: string | null;
  starred?: boolean;
  displayOnProfile?: boolean;
  workIds: number[];
  tagIds: number[];
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
  parameters: z.union([zTargetGoalParameters, zHabitGoalParameters]), // I could enforce this more strictly with a discriminated union, but it's terrible in zod
  startDate: z.string().nullable(),
  endDate: z.string().nullable(),
  starred: z.boolean().nullable().default(false),
  displayOnProfile: z.boolean().nullable().default(false),
  workIds: z.array(z.number().int()),
  tagIds: z.array(z.number().int()),
}).strict();

export async function handleCreateGoal(req: RequestWithUser, res: ApiResponse<Goal>) {
  const user = req.user;
  const payload = req.body as GoalCreatePayload;

  const goal = await GoalModel.createGoal(user, payload as CreateGoalData, reqCtx(req));

  return res.status(201).send(success(goal));
}

const zBatchGoalCreatePayload = z.array(zGoalCreatePayload);

// TODO: this is a mess, we need to handle it differently
export async function handleCreateGoals(req: RequestWithUser, res: ApiResponse<Goal[]>) {
  const user = req.user;

  const db = getDbClient();
  const createdGoals = await db.goal.createManyAndReturn({
    data: req.body.map(goalData => ({
      state: PROJECT_STATE.ACTIVE,
      ownerId: user.id,

      ...omit(goalData, ['workIds', 'tagIds']),
      worksIncluded: { connect: goalData.works.map(workId => ({
        id: workId,
        ownerId: user.id,
        state: PROJECT_STATE.ACTIVE,
      })) },
      tagsIncluded: { connect: goalData.tags.map(workId => ({
        id: workId,
        ownerId: user.id,
        state: TAG_STATE.ACTIVE,
      })) },
    })),
  }) as Goal[]; // cannot createManyAndReturn and also { include: foreign objs }

  await Promise.all(createdGoals.map(createdGoal => logAuditEvent('goal:create', user.id, createdGoal.id, null, null, req.sessionID)));

  return res.status(201).send(success(createdGoals));
}

export type GoalUpdatePayload = Partial<GoalCreatePayload>;
const zGoalUpdatePayload = zGoalCreatePayload.partial();

export async function handleUpdateGoal(req: RequestWithUser, res: ApiResponse<Goal>) {
  const user = req.user;
  const payload = req.body as GoalUpdatePayload;

  const original = await GoalModel.getGoal(user, +req.params.id);
  if(!original) {
    return res.status(404).send(failure('NOT_FOUND', `Did not find any goal with id ${req.params.id}.`));
  }

  const goal = await GoalModel.updateGoal(user, original, payload as UpdateGoalData, reqCtx(req));

  return res.status(200).send(success(goal));
}

export async function handleDeleteGoal(req: RequestWithUser, res: ApiResponse<Goal>) {
  const user = req.user;

  const original = await GoalModel.getGoal(user, +req.params.id);
  if(!original) {
    return res.status(404).send(failure('NOT_FOUND', `Did not find any goal with id ${req.params.id}.`));
  }

  const goal = await GoalModel.deleteGoal(user, original, reqCtx(req));

  return res.status(200).send(success(goal));
}

const routes: RouteConfig[] = [
  {
    path: '/',
    method: HTTP_METHODS.GET,
    handler: handleGetGoals,
    accessLevel: ACCESS_LEVEL.USER,
  },
  {
    path: '/:id',
    method: HTTP_METHODS.GET,
    handler: handleGetGoal,
    accessLevel: ACCESS_LEVEL.USER,
    paramsSchema: zIdParam(),
  },
  {
    path: '/',
    method: HTTP_METHODS.POST,
    handler: handleCreateGoal,
    accessLevel: ACCESS_LEVEL.USER,
    bodySchema: zGoalCreatePayload,
  },
  {
    path: '/batch',
    method: HTTP_METHODS.POST,
    handler: handleCreateGoals,
    accessLevel: ACCESS_LEVEL.USER,
    bodySchema: zBatchGoalCreatePayload,
  },
  {
    path: '/:id',
    method: HTTP_METHODS.PATCH,
    handler: handleUpdateGoal,
    accessLevel: ACCESS_LEVEL.USER,
    paramsSchema: zIdParam(),
    bodySchema: zGoalUpdatePayload,
  },
  {
    path: '/:id',
    method: HTTP_METHODS.DELETE,
    handler: handleDeleteGoal,
    accessLevel: ACCESS_LEVEL.USER,
    paramsSchema: zIdParam(),
  },
];

export default routes;
