import { endOfDay, add } from 'date-fns';
import { formatDate, parseDateString } from 'src/lib/date.ts';

import { type TallyMeasure } from "../tally/consts.ts";
import type { Goal, GoalCadence, GoalThreshold, HabitGoal, TargetGoal } from './types.ts';
import { type GoalCadenceUnit, GOAL_CADENCE_UNIT_INFO, GOAL_TYPE } from './consts.ts';

type TallyLike = {
  date: string;
  measure: TallyMeasure;
  count: number;
}
export type HabitRange = {
  startDate: string;
  endDate: string;
  tallies: TallyLike[];
  total: number;
  isSuccess: boolean;
};
export type HabitAnalysis = {
  ranges: HabitRange[];
  streaks: {
    longest: HabitRange[];
    current: HabitRange[];
    all: HabitRange[][];
  };
};
export function analyzeStreaksForHabit(tallies: TallyLike[], cadence: GoalCadence, threshold: GoalThreshold, startDate?: string, endDate?: string): HabitAnalysis {
  const today = formatDate(new Date());
  // we will only consider tallies up to and including today
  const filteredTalles = threshold === null ? tallies : tallies.filter(tally => tally.measure === threshold.measure && tally.date <= today);
  const sortedTallies = filteredTalles.toSorted((a, b) => a.date < b.date ? -1 : a.date > b.date ? 1 : 0);

  // don't even bother if we don't have any tallies left
  if(sortedTallies.length === 0) {
    return {
      ranges: [],
      streaks: { longest: [], current: [], all: [[]] }
    };
  }

  startDate = startDate ?? sortedTallies[0].date;
  // if endDate doesn't exist, use today; otherwise use the earlier of endDate or today
  endDate = endDate ? endDate > today ? today : endDate : today;

  // first, get all the possible date ranges for the habit
  const dateRanges = createDateRanges(cadence.period, cadence.unit, startDate, endDate);

  const streaks: HabitRange[][] = [[]];
  const ranges: HabitRange[] = [];
  for(const dateRange of dateRanges) {
    const talliesInRange = sortedTallies.filter(tally => (tally.date >= dateRange.start && tally.date <= dateRange.end));
    const total = threshold === null ? talliesInRange.length : talliesInRange.reduce((total, tally) => total + tally.count, 0);

    const range = {
      startDate: dateRange.start,
      endDate: dateRange.end,
      tallies: talliesInRange,
      total: total,
      isSuccess: threshold === null ? total > 0 : total >= threshold.count
    };
    ranges.push(range);

    if(range.isSuccess) {
      // if this range is a success, we add it to the current streak
      streaks.at(-1).push(range);
    } else if(isRangeCurrent(range)) {
      // if this is the current range (and it wasn't a success), we don't add it to any streak
      // NO-OP
    } else if(streaks.at(-1).length !== 0) {
      // if this range isn't a success but we had a streak going, break that streak
      streaks.push([]);
    } // else the most recent streak is already 0, so no need to replace it
  }

  const longestStreak = streaks.reduce((winner, streak) => winner === null ? streak : streak.length > winner.length ? streak : winner, null);
  const currentStreak = isRangeCurrent(ranges.at(-1)) ? streaks.at(-1) : null;

  return {
    ranges,
    streaks: {
      longest: longestStreak,
      current: currentStreak,
      all: streaks,
    },
  };
}

function createDateRanges(period: number, unit: GoalCadenceUnit, startDate: string, endDate: string) {
  const fns = GOAL_CADENCE_UNIT_INFO[unit].fns;
  const start = fns.startOf(parseDateString(startDate));
  const end = endOfDay(parseDateString(endDate));

  const ranges: { start: string; end: string }[] = [];

  let startOfRange = start;
  while(startOfRange < end) {
    const nextStartOfRange = fns.add(startOfRange, period);
    const endOfRange = endOfDay(add(nextStartOfRange, { days: -1 }));
    ranges.push({
      start: formatDate(startOfRange),
      end: formatDate(endOfRange)
    });

    startOfRange = nextStartOfRange;
  }

  return ranges;
}

export function isRangeCurrent(range: HabitRange) {
  const today = formatDate(new Date());
  return range.startDate <= today && range.endDate >= today;
}

export function isTargetAchieved(target: TargetGoal, currentCount: number) {
  const targetCount = target.parameters.threshold.count;

  // why not just a normal >= check? to account for negative goals
  return (
    Math.abs(currentCount) >= Math.abs(targetCount) &&
    Math.sign(currentCount) === Math.sign(targetCount)
  );
}

export function isTargetGoal(goal: Goal): goal is TargetGoal {
  return goal.type === GOAL_TYPE.TARGET;
}

export function isHabitGoal(goal: Goal): goal is HabitGoal {
  return goal.type === GOAL_TYPE.HABIT;
}