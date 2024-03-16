export const WORK_STATE = {
  ACTIVE:   'active',
  DELETED:  'deleted',
};

export const WORK_PHASE = {
  DRAFTING: 'drafting',
  REVISING: 'revising',
  ON_HOLD: 'on hold',
  FINISHED: 'finished',
  ABANDONED: 'abandoned',
};

export const WORK_PHASE_ORDER = [
  WORK_PHASE.DRAFTING,
  WORK_PHASE.REVISING,
  WORK_PHASE.ON_HOLD,
  WORK_PHASE.FINISHED,
  WORK_PHASE.ABANDONED,
];
