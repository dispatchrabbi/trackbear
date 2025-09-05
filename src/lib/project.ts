import { compare } from 'natural-orderby';
import type { SummarizedProject, Project } from './api/project.ts';
import { PROJECT_PHASE } from 'server/lib/models/project/consts.ts';

export const PROJECT_PHASE_ORDER = [
  PROJECT_PHASE.PLANNING,
  PROJECT_PHASE.OUTLINING,
  PROJECT_PHASE.DRAFTING,
  PROJECT_PHASE.REVISING,
  PROJECT_PHASE.ON_HOLD,
  PROJECT_PHASE.FINISHED,
  PROJECT_PHASE.ABANDONED,
];

export const DORMANT_PROJECT_PHASES = [
  PROJECT_PHASE.ON_HOLD,
  PROJECT_PHASE.FINISHED,
  PROJECT_PHASE.ABANDONED,
];

export function isDormant(project: Project) {
  return DORMANT_PROJECT_PHASES.includes(project.phase);
}

export function cmpByPhase(a: Project, b: Project) {
  return cmpStarred(a, b) || cmpPhase(a, b) || cmpTitle(a, b) || -cmpCreated(a, b);
}

export function cmpByTitle(a: Project, b: Project) {
  return cmpStarred(a, b) || cmpTitle(a, b) || -cmpCreated(a, b);
}

export function cmpByLastUpdate(a: SummarizedProject, b: SummarizedProject) {
  return cmpStarred(a, b) || cmpLatestTally(a, b) || cmpTitle(a, b) || -cmpCreated(a, b);
}

interface Starred { starred: boolean }
function cmpStarred(a: Starred, b: Starred) {
  return a.starred === b.starred ? 0 : (a.starred ? -1 : 1);
}

interface Phased { phase: string }
function cmpPhase(a: Phased, b: Phased) {
  const aPhaseIndex = PROJECT_PHASE_ORDER.indexOf(a.phase);
  const bPhaseIndex = PROJECT_PHASE_ORDER.indexOf(b.phase);

  if(aPhaseIndex !== bPhaseIndex) {
    return aPhaseIndex - bPhaseIndex;
  }
}

interface Titled { title: string }
const cmp = compare();
function cmpTitle(a: Titled, b: Titled) {
  return cmp(a.title, b.title);
}

interface Created { createdAt: Date }
function cmpCreated(a: Created, b: Created) {
  return a.createdAt < b.createdAt ? -1 : a.createdAt > b.createdAt ? 1 : 0;
}

interface WithLastUpdated { lastUpdated: string | null }; // should be an ISO datestring
function cmpLatestTally(a: WithLastUpdated, b: WithLastUpdated) {
  /* eslint-disable @stylistic/multiline-ternary */
  // we do the equals case first to also catch when `lastUpdated` is null
  return a.lastUpdated === b.lastUpdated ? 0 : // we do the equals case first to also catch when `lastUpdated` is both null
    a.lastUpdated === null ? 1 : // null goes after
      b.lastUpdated === null ? -1 : // null goes after
        a.lastUpdated > b.lastUpdated ? -1 : 1; // more recently updated goes before
  /* eslint-enable @stylistic/multiline-ternary */
}
