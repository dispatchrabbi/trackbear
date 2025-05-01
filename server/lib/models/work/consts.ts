import { ValueEnum } from '../../obj';

export const WORK_STATE = {
  ACTIVE: 'active',
  DELETED: 'deleted',
};
export type WorkState = ValueEnum<typeof WORK_STATE>;

export const WORK_PHASE = {
  PLANNING: 'planning',
  OUTLINING: 'outlining',
  DRAFTING: 'drafting',
  REVISING: 'revising',
  ON_HOLD: 'on hold',
  FINISHED: 'finished',
  ABANDONED: 'abandoned',
};
export type WorkPhase = ValueEnum<typeof WORK_PHASE>;

export const ALLOWED_COVER_FORMATS = {
  'image/apng': 'apng',
  'image/avif': 'avif',
  'image/gif': 'gif',
  'image/jpeg': 'jpeg',
  'image/png': 'png',
  'image/svg+xml': 'svg',
  'image/webp': 'webp',
};
export const MAX_COVER_SIZE_IN_BYTES = 2 * 1024 * 1024; // 2MB
