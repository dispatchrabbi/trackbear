import { TALLY_MEASURE } from '../tally/consts';
import type { ValueEnum } from '../../obj';

export const LEADERBOARD_STATE = {
  ACTIVE: 'active',
  DELETED: 'deleted',
};

export const LEADERBOARD_PARTICIPANT_STATE = {
  ACTIVE: 'active',
  BANNED: 'banned',
};

export const LEADERBOARD_MEASURE = {
  ...TALLY_MEASURE,
  PERCENT: 'percent',
} as const;
export type LeaderboardMeasure = ValueEnum<typeof LEADERBOARD_MEASURE>;
