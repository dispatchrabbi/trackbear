import {
  addDays, endOfDay,
} from 'date-fns';
import { formatDate, parseDateString } from './date.ts';

import { Tally } from 'src/lib/api/tally.ts';
import { Goal } from 'src/lib/api/goal.ts';
import { GOAL_CADENCE_UNIT_INFO, GOAL_TYPE, GoalHabitParameters, GoalTargetParameters } from 'server/lib/models/goal.ts';
import { formatCount } from './tally.ts';

export function cmpGoal(a: Goal, b: Goal) {
  if(a.starred !== b.starred) {
    return a.starred ? -1 : 1;
  }

  if(a.endDate < b.endDate) {
    return -1;
  } else if(a.endDate > b.endDate) {
    return 1;
  }

  const aTitle = a.title.toLowerCase();
  const bTitle = b.title.toLowerCase();
  return aTitle < bTitle ? -1 : aTitle > bTitle ? 1 : 0;
}

export type HabitRange = {
  startDate: string;
  endDate: string;
  tallies: Tally[];
  total: number;
  isSuccess: boolean;
};

export function describeGoal(goal: Goal) {
  if(goal.type === GOAL_TYPE.TARGET) {
    const params = goal.parameters as GoalTargetParameters;

    let description = `Reach ${formatCount(params.threshold.count, params.threshold.measure)}`;
    if(goal.endDate) {
      description += ` by ${goal.endDate}`;
    }

    return description;
  } else if(goal.type === GOAL_TYPE.HABIT) {
    const params = goal.parameters as GoalHabitParameters;

    const threshold = params.threshold ? formatCount(params.threshold.count, params.threshold.measure) : 'something';
    const cadence = params.cadence.period === 1 ? GOAL_CADENCE_UNIT_INFO[params.cadence.unit].label.singular : `${params.cadence.period} ${GOAL_CADENCE_UNIT_INFO[params.cadence.unit].label.plural}`;
    const description = `Log ${threshold} every ${cadence}`;

    return description;
  } else {
    return 'Mystery goal!';
  }
}

export type HabitAnalysis = {
  ranges: HabitRange[];
  streaks: {
    longest: number;
    current: number;
    list: number[];
  };
};
export function analyzeHabitTallies(tallies: Tally[], goal: Goal, startDate?: string, endDate?: string): HabitAnalysis {
  const threshold = (goal.parameters as GoalHabitParameters).threshold;
  const cadence = (goal.parameters as GoalHabitParameters).cadence;

  const filteredTalles = threshold === null ? tallies : tallies.filter(tally => tally.measure === threshold.measure);
  const sortedTallies = filteredTalles.toSorted((a, b) => a.date < b.date ? -1 : a.date > b.date ? 1 : 0);

  if(sortedTallies.length === 0) {
    return {
      ranges: [],
      streaks: { longest: 0, current: 0, list: [] }
    };
  }

  startDate = startDate ?? goal.startDate ?? sortedTallies[0].date;
  endDate = endDate ?? goal.endDate ?? sortedTallies[sortedTallies.length - 1].date;

  // first, get all the possible date ranges for the habit
  const dateRanges = createDateRanges(cadence.period, cadence.unit, startDate, endDate);

  // then check each range to see which tallies are there, how many hits they have, and if that's enough
  // keep a streak counter going as well
  const streaks = [0];
  const ranges = [];
  for(const dateRange of dateRanges) {
    const talliesInRange = sortedTallies.filter(tally => (tally.date >= dateRange.start && tally.date <= dateRange.end));
    const total = threshold === null ? talliesInRange.length : talliesInRange.reduce((total, tally) => total + tally.count, 0);

    const range: HabitRange = {
      startDate: dateRange.start,
      endDate: dateRange.end,
      tallies: talliesInRange,
      total: total,
      isSuccess: threshold === null ? total > 0 : total >= threshold.count
    };
    ranges.push(range);

    if(range.isSuccess) {
      streaks[streaks.length - 1] += 1;
    } else if(streaks[streaks.length - 1] !== 0) {
      streaks.push(0);
    } // else we already have a zero streak recorded
  }

  return {
    ranges,
    streaks: {
      longest: streaks.reduce((max, streak) => Math.max(max, streak), 0),
      current: streaks[streaks.length - 1],
      list: streaks,
    },
  };
}

function createDateRanges(period: number, unit: string, startDate: string, endDate: string) {
  const fns = GOAL_CADENCE_UNIT_INFO[unit].fns;
  const start = fns.startOf(parseDateString(startDate));
  const end = endOfDay(parseDateString(endDate));

  const ranges: { start: string; end: string }[] = [];

  let startOfRange = start;
  while(startOfRange < end) {
    const nextStartOfRange = fns.add(startOfRange, period);
    const endOfRange = endOfDay(addDays(nextStartOfRange, -1));
    ranges.push({
      start: formatDate(startOfRange),
      end: formatDate(endOfRange)
    });

    startOfRange = nextStartOfRange;
  }

  return ranges;
}
