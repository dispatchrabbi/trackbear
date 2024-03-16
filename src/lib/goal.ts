import { GOAL_CADENCE_UNIT } from 'server/lib/models/goal.ts';

export const GOAL_CADENCE_UNIT_INFO = {
  [GOAL_CADENCE_UNIT.DAY]: {
    label: { singular: 'day', plural: 'days' },
  },
  [GOAL_CADENCE_UNIT.WEEK]: {
    label: { singular: 'week', plural: 'weeks' },
  },
  [GOAL_CADENCE_UNIT.MONTH]: {
    label: { singular: 'month', plural: 'months' },
  },
  [GOAL_CADENCE_UNIT.YEAR]: {
    label: { singular: 'year', plural: 'years' },
  },
};
