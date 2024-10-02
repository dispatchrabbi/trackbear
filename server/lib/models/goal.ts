import {
  eachDayOfInterval, startOfDay, endOfDay, addDays,
  eachWeekOfInterval, startOfWeek, endOfWeek, addWeeks,
  eachMonthOfInterval, startOfMonth, endOfMonth, addMonths,
  eachYearOfInterval, startOfYear, endOfYear, addYears,
} from 'date-fns';
import type { Goal, Work, Tag } from "@prisma/client";
import dbClient from "../db.ts";

import { TALLY_STATE, TallyMeasure } from "./tally.ts";
import type { TallyWithWorkAndTags } from "../../api/v1/tally.ts";

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

export type GoalCadenceUnit = typeof GOAL_CADENCE_UNIT[keyof typeof GOAL_CADENCE_UNIT];

export const GOAL_CADENCE_UNIT_INFO = {
  [GOAL_CADENCE_UNIT.DAY]: {
    label: { singular: 'day', plural: 'days' },
    fns: {
      each: eachDayOfInterval,
      startOf: startOfDay,
      endOf: endOfDay,
      add: addDays
    },
  },
  [GOAL_CADENCE_UNIT.WEEK]: {
    label: { singular: 'week', plural: 'weeks' },
    fns: {
      each: eachWeekOfInterval,
      startOf: startOfWeek,
      endOf: endOfWeek,
      add: addWeeks
    },
  },
  [GOAL_CADENCE_UNIT.MONTH]: {
    label: { singular: 'month', plural: 'months' },
    fns: {
      each: eachMonthOfInterval,
      startOf: startOfMonth,
      endOf: endOfMonth,
      add: addMonths
    },
  },
  [GOAL_CADENCE_UNIT.YEAR]: {
    label: { singular: 'year', plural: 'years' },
    fns: {
      each: eachYearOfInterval,
      startOf: startOfYear,
      endOf: endOfYear,
      add: addYears
    },
  },
};

export type GoalThreshold = {
  measure: TallyMeasure;
  count: number;
};

export type GoalCadence = {
  times?: number | null; // actually, this property is on hiatus until I want to start using it again
  period: number;
  unit: GoalCadenceUnit;
};

export type GoalTargetParameters = {
  threshold: GoalThreshold;
  cadence?: null;
};

export type GoalHabitParameters = {
  cadence: GoalCadence;
  threshold: GoalThreshold | null;
};

export type GoalParameters = GoalTargetParameters | GoalHabitParameters;

export type GoalWithWorksAndTags = Goal & {
  worksIncluded: Work[];
  tagsIncluded: Tag[]
};
export async function getTalliesForGoal(goal: GoalWithWorksAndTags): Promise<TallyWithWorkAndTags[]> {
  const measure = goal.type === GOAL_TYPE.TARGET ?
    (goal.parameters as GoalTargetParameters).threshold.measure : // targets always have an associated measure
    (goal.parameters as GoalHabitParameters).threshold?.measure;  // habits sometimes have an associated measure

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
      // only include tallies of the appropriate measure, if it exists
      measure: measure || undefined,
    },
    include: {
      work: true,
      tags: true,
    },
  });
}
