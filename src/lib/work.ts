import { compare } from 'natural-orderby';
import type { SummarizedWork, Work } from './api/work.ts';
import { WORK_PHASE } from 'server/lib/models/work.ts';

export const WORK_PHASE_ORDER = [
  WORK_PHASE.PLANNING,
  WORK_PHASE.OUTLINING,
  WORK_PHASE.DRAFTING,
  WORK_PHASE.REVISING,
  WORK_PHASE.ON_HOLD,
  WORK_PHASE.FINISHED,
  WORK_PHASE.ABANDONED,
];

export const DORMANT_WORK_PHASES = [
  WORK_PHASE.ON_HOLD,
  WORK_PHASE.FINISHED,
  WORK_PHASE.ABANDONED,
];

export function isDormant(work: Work) {
  return DORMANT_WORK_PHASES.includes(work.phase);
}

export function cmpWorkByPhase(a: Work, b: Work) {
  return cmpStarred(a, b) || cmpPhase(a, b) || cmpTitle(a, b) || -cmpCreated(a, b);
}

export function cmpWorkByTitle(a: Work, b: Work) {
  return cmpStarred(a, b) || cmpTitle(a, b) || -cmpCreated(a, b);
}

export function cmpWorkByLastUpdate(a: SummarizedWork, b: SummarizedWork) {
  return cmpStarred(a, b) || cmpLatestTally(a, b) || cmpTitle(a, b) || -cmpCreated(a, b);
}

interface Starred { starred: boolean; }
function cmpStarred(a: Starred, b: Starred) {
  return a.starred === b.starred ? 0 : (a.starred ? -1 : 1);
}

interface Phased { phase: string; }
function cmpPhase(a: Phased, b: Phased) {
  const aPhaseIndex = WORK_PHASE_ORDER.indexOf(a.phase);
  const bPhaseIndex = WORK_PHASE_ORDER.indexOf(b.phase);

  if(aPhaseIndex !== bPhaseIndex) {
    return aPhaseIndex - bPhaseIndex;
  }
}

interface Titled { title: string; }
const cmp = compare();
function cmpTitle(a: Titled, b: Titled) {
  return cmp(a.title, b.title);
}

interface Created { createdAt: Date; }
function cmpCreated(a: Created, b: Created) {
  return a.createdAt < b.createdAt ? -1 : a.createdAt > b.createdAt ? 1 : 0;
}

interface WithLastUpdated { lastUpdated: string | null; }; // should be an ISO datestring
function cmpLatestTally(a: WithLastUpdated, b: WithLastUpdated) {
  // we do the equals case first to also catch when `lastUpdated` is null
  return a.lastUpdated === b.lastUpdated ? 0 : // we do the equals case first to also catch when `lastUpdated` is both null
    a.lastUpdated === null ? 1 : // null goes after
    b.lastUpdated === null ? -1 : // null goes after
    a.lastUpdated > b.lastUpdated ? -1 : 1; // more recently updated goes before
}