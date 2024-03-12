import { TALLY_MEASURE } from "./tally.ts";

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

export type GoalParameters =
| {
  threshold: {
    measure: typeof TALLY_MEASURE[keyof typeof TALLY_MEASURE];
    count: number;
  };
};
