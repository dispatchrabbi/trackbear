import {
  eachDayOfInterval, startOfDay, endOfDay, addDays,
  eachWeekOfInterval, startOfWeek, endOfWeek, addWeeks,
  eachMonthOfInterval, startOfMonth, endOfMonth, addMonths,
  eachYearOfInterval, startOfYear, endOfYear, addYears,
} from 'date-fns';

import { type ValueEnum } from '../../obj.ts';

export const GOAL_STATE = {
  ACTIVE: 'active',
  // TODO: Paused goals seem like a thing?
  // PAUSED:   'paused',
  DELETED: 'deleted',
};
export type GoalState = ValueEnum<typeof GOAL_STATE>;

export const GOAL_TYPE = {
  TARGET: 'target',
  HABIT: 'habit',
} as const;
export type GoalType = ValueEnum<typeof GOAL_TYPE>;

export const GOAL_CADENCE_UNIT = {
  DAY: 'day',
  WEEK: 'week',
  MONTH: 'month',
  YEAR: 'year',
};
export type GoalCadenceUnit = ValueEnum<typeof GOAL_CADENCE_UNIT>;

export const GOAL_CADENCE_UNIT_INFO = {
  [GOAL_CADENCE_UNIT.DAY]: {
    label: { singular: 'day', plural: 'days' },
    fns: {
      each: eachDayOfInterval,
      startOf: startOfDay,
      endOf: endOfDay,
      add: addDays,
    },
  },
  [GOAL_CADENCE_UNIT.WEEK]: {
    label: { singular: 'week', plural: 'weeks' },
    fns: {
      each: eachWeekOfInterval,
      startOf: startOfWeek,
      endOf: endOfWeek,
      add: addWeeks,
    },
  },
  [GOAL_CADENCE_UNIT.MONTH]: {
    label: { singular: 'month', plural: 'months' },
    fns: {
      each: eachMonthOfInterval,
      startOf: startOfMonth,
      endOf: endOfMonth,
      add: addMonths,
    },
  },
  [GOAL_CADENCE_UNIT.YEAR]: {
    label: { singular: 'year', plural: 'years' },
    fns: {
      each: eachYearOfInterval,
      startOf: startOfYear,
      endOf: endOfYear,
      add: addYears,
    },
  },
};
