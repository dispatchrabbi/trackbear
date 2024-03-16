import type { Goal, Work, Tally, Tag } from "@prisma/client";
import dbClient from "../db.ts";

import { TALLY_MEASURE, TALLY_STATE } from "./tally.ts";

export const GOAL_STATE = {
  ACTIVE:   'active',
  // TODO: Paused goals seem like a thing?
  // PAUSED:   'paused',
  DELETED:  'deleted',
};

export const GOAL_TYPE = {
  TARGET: 'target',
  HABIT: 'habit',
};

export const GOAL_CADENCE_UNIT = {
  DAY: 'day',
  WEEK: 'week',
  MONTH: 'month',
  YEAR: 'year',
};

type GoalThreshold = {
  measure: typeof TALLY_MEASURE[keyof typeof TALLY_MEASURE];
    count: number;
};

type GoalCadence = {
  period: number;
  unit: typeof GOAL_CADENCE_UNIT[keyof typeof GOAL_CADENCE_UNIT];
};

export type GoalTargetParameters = {
  threshold: GoalThreshold;
};

// TODO: currently this can't model "three times a week"
export type GoalHabitParameters = {
  cadence: GoalCadence;
  threshold: GoalThreshold | null;
}

export type GoalParameters = GoalTargetParameters | GoalHabitParameters;

export type GoalWithWorksAndTags = Goal & {
  worksIncluded: Work[];
  tagsIncluded: Tag[]
};
export async function getTalliesForGoal(goal: GoalWithWorksAndTags):Promise<Tally[]> {
  return dbClient.tally.findMany({
    where: {
      ownerId: goal.ownerId,
      state: TALLY_STATE.ACTIVE,

      // only include tallies from works specified in the goal (if any were)
      workId: goal.worksIncluded.length > 0 ? { in: goal.worksIncluded.map(work => work.id ) } : undefined,
      // only include tallies with at least one tag specified in the goal (if any were)
      tags: goal.tagsIncluded.length > 0 ? { some: { id: { in: goal.tagsIncluded.map(tag => tag.id ) } } } : undefined,
      // only include tallies within the time range (if one exists)
      date: {
        gte: goal.startDate || undefined,
        lte: goal.endDate || undefined,
      },
    },
  });
}
