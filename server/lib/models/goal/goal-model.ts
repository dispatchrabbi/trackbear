import path from 'node:path';

import { traced } from "../../tracer.ts";

import dbClient from "../../db.ts";
import { importRawSql } from "server/lib/sql.ts";
import type { Create } from "../types.ts";

import { type RequestContext } from "../../request-context.ts";
import { buildChangeRecord, logAuditEvent } from '../../audit-events.ts';
import { AUDIT_EVENT_TYPE } from '../audit-event/consts.ts';

import type { User } from '../user/user-model.ts';
import { GOAL_STATE, GOAL_TYPE } from "./consts.ts";
import { Goal, HabitGoal, TargetGoal, HabitGoalParameters, TargetGoalParameters } from "./types.ts";
import { TALLY_STATE } from "../tally/consts.ts";
import type { Tally } from '../tally/tally-model.wip.ts';
import { omit } from 'server/lib/obj.ts';
import { makeIncludeWorkAndTagIds, included2ids, makeSetWorksAndTagsIncluded, makeConnectWorksAndTagsIncluded } from '../helpers.ts';

const getTargetTotalsRawSql = await importRawSql(path.resolve(import.meta.dirname, './sql/get-target-totals.sql'));

export type {
  Goal, HabitGoal, TargetGoal,
  HabitGoalParameters, TargetGoalParameters
};

type OptionalGoalFields = 'description';
export type CreateGoalData = Create<Goal, OptionalGoalFields>;
// this isn't 100% type-safe; if changing your type, you need to send the correct parameters as well
export type UpdateGoalData = Partial<CreateGoalData>;

export class GoalModel {

  @traced
  static async getGoals(owner: User): Promise<Goal[]> {
    const dbGoals = await dbClient.goal.findMany({
      where: {
        ownerId: owner.id,
        state: GOAL_STATE.ACTIVE,
      },
      include: makeIncludeWorkAndTagIds(owner.id),
    });

    const goals = dbGoals.map(included2ids) as Goal[];
    return goals;
  }

  @traced
  static async getGoal(owner: User, id: number): Promise<Goal> {
    const dbGoal = await dbClient.goal.findUnique({
      where: {
        id: id,
        ownerId: owner.id,
        state: GOAL_STATE.ACTIVE,
      },
      include: makeIncludeWorkAndTagIds(owner.id),
    });

    const goal = included2ids(dbGoal) as Goal;
    return goal;
  }

  @traced
  static async createGoal(owner: User, data: CreateGoalData, reqCtx: RequestContext): Promise<Goal> {
    const dataWithDefaults: Required<CreateGoalData> = Object.assign({
      description: '',
      starred: false,
      displayOnProfile: false,
    }, data);

    const dbCreated = await dbClient.goal.create({
      data: {
        state: GOAL_STATE.ACTIVE,
        ownerId: owner.id,
        
        ...omit(dataWithDefaults, ['workIds', 'tagIds']),
        ...makeConnectWorksAndTagsIncluded(dataWithDefaults, owner.id),
      },
      include: makeIncludeWorkAndTagIds(owner.id),
    });
    const created = included2ids(dbCreated) as Goal;

    const changes = buildChangeRecord({}, created);
    await logAuditEvent(
      AUDIT_EVENT_TYPE.GOAL_CREATE,
      reqCtx.userId, created.id, null,
      changes, reqCtx.sessionId
    );

    return created;
  }

  @traced
  static async updateGoal(owner: User, goal: Goal, data: UpdateGoalData, reqCtx: RequestContext): Promise<Goal> {
    const dbUpdated = await dbClient.goal.update({
      where: {
        id: goal.id,
        ownerId: owner.id,
        state: GOAL_STATE.ACTIVE,
      },
      data: {
        ...omit(data, ['workIds', 'tagIds']),
        ...makeSetWorksAndTagsIncluded(data, owner.id),
      },
      include: makeIncludeWorkAndTagIds(owner.id),
    });
    const updated = included2ids(dbUpdated) as Goal;

    const changes = buildChangeRecord(goal, updated);
    await logAuditEvent(
      AUDIT_EVENT_TYPE.GOAL_UPDATE,
      reqCtx.userId, dbUpdated.id, null,
      changes, reqCtx.sessionId
    );

    return updated;
  }

  @traced
  static async deleteGoal(owner: User, goal: Goal, reqCtx: RequestContext): Promise<Goal> {
    const dbDeleted = await dbClient.goal.update({
      where: {
        id: goal.id,
        ownerId: owner.id,
        state: GOAL_STATE.ACTIVE,
      },
      data: {
        state: GOAL_STATE.DELETED,
      },
      include: makeIncludeWorkAndTagIds(owner.id),
    });
    const deleted = included2ids(dbDeleted) as Goal;

    const changes = buildChangeRecord(goal, deleted);
    await logAuditEvent(
      AUDIT_EVENT_TYPE.GOAL_DELETE,
      reqCtx.userId, deleted.id, null,
      changes, reqCtx.sessionId
    );

    return deleted;
  }

  @traced
  static async undeleteGoal(owner: User, goal: Goal, reqCtx: RequestContext): Promise<Goal> {
    const dbUndeleted = await dbClient.goal.update({
      where: {
        id: goal.id,
        ownerId: owner.id,
        state: GOAL_STATE.DELETED,
      },
      data: {
        state: GOAL_STATE.ACTIVE,
      },
      include: makeIncludeWorkAndTagIds(owner.id),
    });
    const undeleted = included2ids(dbUndeleted) as Goal;

    const changes = buildChangeRecord(goal, undeleted);
    await logAuditEvent(
      AUDIT_EVENT_TYPE.GOAL_UNDELETE,
      reqCtx.userId, undeleted.id, null,
      changes, reqCtx.sessionId
    );

    return undeleted;
  }

  @traced
  static async getTargetTotals(owner: User): Promise<Map<number, number>> {
    type TargetTotal = { goalId: number, total: number };
    const results: TargetTotal[] = await dbClient.$queryRawUnsafe(getTargetTotalsRawSql, owner.id);

    const resultsMap = new Map<number, number>();
    for(const result of results) {
      resultsMap.set(result.goalId, result.total);
    }

    return resultsMap;
  }

  @traced
  static async DEPRECATED_getTalliesForGoal(goal: Goal): Promise<Tally[]> {
    const measure = this.DEPRECATED_getMeasureFromGoal(goal);
  
    return await dbClient.tally.findMany({
      where: {
        ownerId: goal.ownerId,
        state: TALLY_STATE.ACTIVE,
  
        // only include tallies from works specified in the goal (if any were)
        workId: goal.workIds.length > 0 ? { in: goal.workIds } : undefined,
        // only include tallies with at least one tag specified in the goal (if any were)
        tags: goal.tagIds.length > 0 ? { some: { id: { in: goal.tagIds } } } : undefined,
        // only include tallies within the time range (if one exists)
        date: {
          gte: goal.startDate ?? undefined,
          lte: goal.endDate ?? undefined,
        },
        // only include tallies of the appropriate measure, if it exists
        measure: measure ?? undefined,
      }
    }) as Tally[];
  }

  private static DEPRECATED_getMeasureFromGoal(goal: Goal): string | null | undefined {
    const measure = goal.type === GOAL_TYPE.TARGET ?
      (goal.parameters as TargetGoalParameters).threshold.measure : // targets always have an associated measure
      (goal.parameters as HabitGoalParameters).threshold?.measure;  // habits sometimes have an associated measure
    
    return measure;
  }
}