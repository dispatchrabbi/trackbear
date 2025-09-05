import { ValueEnum } from '../../obj';

export const PROJECT_STATE = {
  ACTIVE: 'active',
  DELETED: 'deleted',
};
export type ProjectState = ValueEnum<typeof PROJECT_STATE>;

export const PROJECT_PHASE = {
  PLANNING: 'planning',
  OUTLINING: 'outlining',
  DRAFTING: 'drafting',
  REVISING: 'revising',
  ON_HOLD: 'on hold',
  FINISHED: 'finished',
  ABANDONED: 'abandoned',
};
export type ProjectPhase = ValueEnum<typeof PROJECT_PHASE>;

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
