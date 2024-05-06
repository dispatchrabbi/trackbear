import { TALLY_MEASURE } from "./tally.ts";

export const BOARD_STATE = {
  ACTIVE:   'active',
  DELETED:  'deleted',
};

export const BOARD_PARTICIPANT_STATE = {
  ACTIVE: 'active',
  // I anticipate that we'll eventually want a BANNED or KICKED state of some kind
};

export type BoardGoal = Record<typeof TALLY_MEASURE[keyof typeof TALLY_MEASURE], number>;
