import { compare } from 'natural-orderby';
import type { Goal, GoalWithAchievement } from 'src/lib/api/goal.ts';
import { GOAL_CADENCE_UNIT_INFO, GOAL_TYPE } from 'server/lib/models/goal/consts.ts';
import type { HabitGoalParameters, TargetGoalParameters } from 'server/lib/models/goal/types.ts';
import { formatCount } from './tally.ts';
import { formatDate } from './date.ts';

export const GOAL_COMPLETION = {
  UPCOMING: 'upcoming',
  ONGOING: 'ongoing',
  ACHIEVED: 'achieved',
  ENDED: 'ended',
};

export const GOAL_COMPLETION_ORDER = [
  GOAL_COMPLETION.UPCOMING,
  GOAL_COMPLETION.ONGOING,
  GOAL_COMPLETION.ACHIEVED,
  GOAL_COMPLETION.ENDED,
];

interface WithProgress {
  achieved: boolean;
  startDate?: string;
  endDate?: string;
}
export function getGoalProgress(goal: WithProgress) {
  const today = formatDate(new Date());

  if(goal.achieved) {
    return GOAL_COMPLETION.ACHIEVED;
  } else if(goal.endDate && goal.endDate < today) {
    return GOAL_COMPLETION.ENDED;
  } else if(goal.startDate && goal.startDate > today) {
    return GOAL_COMPLETION.UPCOMING;
  } else {
    return GOAL_COMPLETION.ONGOING;
  };
}

export function cmpGoalByDate(a: Goal, b: Goal) {
  return cmpStarred(a, b) || cmpTimebounds(a, b) || cmpTitle(a, b) || -cmpCreated(a, b);
}

export function cmpGoalByCompletion(a: GoalWithAchievement, b: GoalWithAchievement) {
  return cmpStarred(a, b) || cmpCompletion(a, b) || cmpTimebounds(a, b) || cmpTitle(a, b) || -cmpCreated(a, b);
}

interface Starred { starred: boolean }
function cmpStarred(a: Starred, b: Starred) {
  return a.starred === b.starred ? 0 : (a.starred ? -1 : 1);
}

interface WithProgress {
  achieved: boolean;
  startDate?: string;
  endDate?: string;
}
function cmpCompletion(a: WithProgress, b: WithProgress) {
  const aCompletionIndex = GOAL_COMPLETION_ORDER.indexOf(getGoalProgress(a));
  const bCompletionIndex = GOAL_COMPLETION_ORDER.indexOf(getGoalProgress(b));

  return aCompletionIndex - bCompletionIndex;
}

interface TimeBound {
  startDate?: string;
  endDate?: string;
}
// This function is probably not exactly correct, but it's close enough for now, and stable
// TODO: base this off of the number of days between the dates and today
function cmpTimebounds(a: TimeBound, b: TimeBound) {
  if(a.endDate !== b.endDate) {
    if(a.endDate === null) {
      return 1;
    } else if(b.endDate === null) {
      return -1;
    } else {
      return a.endDate < b.endDate ? -1 : a.endDate > b.endDate ? 1 : 0;
    }
  } else if(a.startDate !== b.startDate) {
    if(a.startDate === null) {
      return 1;
    } else if(b.startDate === null) {
      return -1;
    } else {
      return a.startDate < b.startDate ? -1 : a.startDate > b.startDate ? 1 : 0;
    }
  } else {
    return 0;
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

export function describeGoal(goal: Goal) {
  if(goal.type === GOAL_TYPE.TARGET) {
    const params = goal.parameters as TargetGoalParameters;

    let description = `Reach ${formatCount(params.threshold.count, params.threshold.measure)}`;
    if(goal.endDate) {
      description += ` by ${goal.endDate}`;
    }

    return description;
  } else if(goal.type === GOAL_TYPE.HABIT) {
    const params = goal.parameters as HabitGoalParameters;

    const threshold = params.threshold ? formatCount(params.threshold.count, params.threshold.measure) : 'something';
    const cadence = params.cadence.period === 1 ? GOAL_CADENCE_UNIT_INFO[params.cadence.unit].label.singular : `${params.cadence.period} ${GOAL_CADENCE_UNIT_INFO[params.cadence.unit].label.plural}`;

    let description = `Log ${threshold} every ${cadence}`;
    if(goal.endDate) {
      description += ` until ${goal.endDate}`;
    }

    return description;
  } else {
    return 'Mystery goal!';
  }
}
