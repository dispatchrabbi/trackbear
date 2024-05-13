export const TALLY_STATE = {
  ACTIVE:   'active',
  DELETED:  'deleted',
};

export const TALLY_MEASURE = {
  WORD: 'word',
  TIME: 'time',
  PAGE: 'page',
  CHAPTER: 'chapter',
  // TODO: SCENE?
};

export type TallyMeasure = typeof TALLY_MEASURE[keyof typeof TALLY_MEASURE];
