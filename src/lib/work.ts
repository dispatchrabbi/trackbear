import type { Work } from './api/work.ts';
import { WORK_PHASE } from 'server/lib/models/work.ts';

export const WORK_PHASE_ORDER = [
  WORK_PHASE.DRAFTING,
  WORK_PHASE.REVISING,
  WORK_PHASE.ON_HOLD,
  WORK_PHASE.FINISHED,
  WORK_PHASE.ABANDONED,
];

export function cmpWork(a: Work, b: Work) {
  if(a.starred !== b.starred) {
    return a.starred ? -1 : 1;
  }

  const aPhaseIndex = WORK_PHASE_ORDER.indexOf(a.phase);
  const bPhaseIndex = WORK_PHASE_ORDER.indexOf(b.phase);
  if(aPhaseIndex !== bPhaseIndex) {
    return aPhaseIndex - bPhaseIndex;
  }

  const aTitle = a.title.toLowerCase();
  const bTitle = b.title.toLowerCase();
  return aTitle < bTitle ? -1 : aTitle > bTitle ? 1 : 0;
}
