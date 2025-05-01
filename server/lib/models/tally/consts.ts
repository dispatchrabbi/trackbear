import { ValueEnum } from '../../obj';

export const TALLY_STATE = {
  ACTIVE: 'active',
  DELETED: 'deleted', // use this when the parent work was deleted
};
export type TallyState = ValueEnum<typeof TALLY_MEASURE>;

export const TALLY_MEASURE = {
  WORD: 'word',
  TIME: 'time',
  PAGE: 'page',
  CHAPTER: 'chapter',
  SCENE: 'scene',
  LINE: 'line',
};
export type TallyMeasure = ValueEnum<typeof TALLY_MEASURE>;
