import {
  eachDayOfInterval, startOfDay, endOfDay, addDays,
  eachWeekOfInterval, startOfWeek, endOfWeek, addWeeks,
  eachMonthOfInterval, startOfMonth, endOfMonth, addMonths,
  eachYearOfInterval, startOfYear, endOfYear, addYears,
  add
} from 'date-fns';
import { formatDate, parseDateString } from 'src/lib/date.ts';

import type { Goal, Work, Tag } from "@prisma/client";
import dbClient from "../db.ts";

import { TALLY_STATE, TallyMeasure } from "./tally.ts";
import type { TallyWithWorkAndTags } from "../../api/v1/tally.ts";

export const GOAL_STATE = {
  ACTIVE:   'active',
  // TODO: Paused goals seem like a thing?
  // PAUSED:   'paused',
  DELETED:  'deleted',
};

export const GOAL_TYPE = {
  TARGET: 'target',
  HABIT: 'habit',
};

export const GOAL_CADENCE_UNIT = {
  DAY: 'day',
  WEEK: 'week',
  MONTH: 'month',
  YEAR: 'year',
};

export type GoalCadenceUnit = typeof GOAL_CADENCE_UNIT[keyof typeof GOAL_CADENCE_UNIT];

export const GOAL_CADENCE_UNIT_INFO = {
  [GOAL_CADENCE_UNIT.DAY]: {
    label: { singular: 'day', plural: 'days' },
    fns: {
      each: eachDayOfInterval,
      startOf: startOfDay,
      endOf: endOfDay,
      add: addDays
    },
  },
  [GOAL_CADENCE_UNIT.WEEK]: {
    label: { singular: 'week', plural: 'weeks' },
    fns: {
      each: eachWeekOfInterval,
      startOf: startOfWeek,
      endOf: endOfWeek,
      add: addWeeks
    },
  },
  [GOAL_CADENCE_UNIT.MONTH]: {
    label: { singular: 'month', plural: 'months' },
    fns: {
      each: eachMonthOfInterval,
      startOf: startOfMonth,
      endOf: endOfMonth,
      add: addMonths
    },
  },
  [GOAL_CADENCE_UNIT.YEAR]: {
    label: { singular: 'year', plural: 'years' },
    fns: {
      each: eachYearOfInterval,
      startOf: startOfYear,
      endOf: endOfYear,
      add: addYears
    },
  },
};

export type GoalThreshold = {
  measure: TallyMeasure;
  count: number;
};

export type GoalCadence = {
  times?: number | null; // actually, this property is on hiatus until I want to start using it again
  period: number;
  unit: GoalCadenceUnit;
};

export type GoalTargetParameters = {
  threshold: GoalThreshold;
  cadence?: null;
};

export type GoalHabitParameters = {
  cadence: GoalCadence;
  threshold: GoalThreshold | null;
};

export type GoalParameters = GoalTargetParameters | GoalHabitParameters;

export type GoalWithWorksAndTags = Goal & {
  worksIncluded: Work[];
  tagsIncluded: Tag[]
};
export async function getTalliesForGoal(goal: GoalWithWorksAndTags): Promise<TallyWithWorkAndTags[]> {
  const measure = getMeasureFromGoal(goal);

  return dbClient.tally.findMany({
    where: {
      ownerId: goal.ownerId,
      state: TALLY_STATE.ACTIVE,

      // only include tallies from works specified in the goal (if any were)
      workId: goal.worksIncluded.length > 0 ? { in: goal.worksIncluded.map(work => work.id ) } : undefined,
      // only include tallies with at least one tag specified in the goal (if any were)
      tags: goal.tagsIncluded.length > 0 ? { some: { id: { in: goal.tagsIncluded.map(tag => tag.id ) } } } : undefined,
      // only include tallies within the time range (if one exists)
      date: {
        gte: goal.startDate || undefined,
        lte: goal.endDate || undefined,
      },
      // only include tallies of the appropriate measure, if it exists
      measure: measure || undefined,
    },
    include: {
      work: true,
      tags: true,
    },
  });
}

export async function getTalliesForGoals(goals: GoalWithWorksAndTags[]): Promise<Record<number, TallyWithWorkAndTags[]>> {
  if(goals.length === 0) {
    return {};
  }

  const ownerIds = new Set(goals.map(goal => goal.ownerId));
  if(ownerIds.size > 1) { throw new Error('Cannot getTalliesForGoals when the goals have more than one owner'); }
  const ownerId = goals[0].ownerId;

  const allMeasures = goals.map(getMeasureFromGoal);
  const measures = allMeasures.some(m => m === null || m === undefined) ? undefined : new Set(allMeasures);
  
  const workIdsIncluded = goals.some(goal => goal.worksIncluded.length === 0) ? undefined : new Set(goals.flatMap(goal => goal.worksIncluded.map(work => work.id)));
  const tagsIdsIncluded = goals.some(goal => goal.tagsIncluded.length === 0) ? undefined : new Set(goals.flatMap(goal => goal.tagsIncluded.map(tag => tag.id)));
  
  const startDate = goals.some(goal => goal.startDate === null) ? undefined : goals.reduce((earliest, goal) => earliest <= goal.startDate ? earliest : goal.startDate, '9999-12-31');
  const endDate = goals.some(goal => goal.endDate === null) ? undefined : goals.reduce((latest, goal) => latest >= goal.endDate ? latest : goal.endDate, '0000-01-01');

  const allPossibleTallies = await dbClient.tally.findMany({
    where: {
      ownerId,
      state: TALLY_STATE.ACTIVE,

      // only include tallies from works specified in the goals (if any were)
      workId: workIdsIncluded !== undefined ? { in: Array.from(workIdsIncluded) } : undefined,
      // only include tallies with at least one tag specified in the goals (if any were)
      tags: tagsIdsIncluded !== undefined ? { some: { id: { in: Array.from(tagsIdsIncluded) } } } : undefined,
      // only include tallies within the time range (if one exists)
      date: {
        gte: startDate,
        lte: endDate,
      },
      // only include tallies of the appropriate measure, if it exists
      measure: measures !== undefined ? { in: Array.from(measures) } : undefined,
    },
    include: {
      work: true,
      tags: true,
    },
  });

  const talliesForGoals = goals.reduce((obj, goal) => {
    obj[goal.id] = filterTalliesForGoal(allPossibleTallies, goal);
    return obj;
  }, {});
  return talliesForGoals;
}

function getMeasureFromGoal(goal: Goal): string | null | undefined {
  const measure = goal.type === GOAL_TYPE.TARGET ?
    (goal.parameters as GoalTargetParameters).threshold.measure : // targets always have an associated measure
    (goal.parameters as GoalHabitParameters).threshold?.measure;  // habits sometimes have an associated measure
  
  return measure;
}

function filterTalliesForGoal(tallies: TallyWithWorkAndTags[], goal: GoalWithWorksAndTags) {
  const goalMeasure = getMeasureFromGoal(goal);
  const workIdsIncluded = goal.worksIncluded.map(work => work.id);
  const tagsIdsIncluded = goal.tagsIncluded.map(tag => tag.id);
  
  return tallies.filter(tally => {
    if(goalMeasure !== null && tally.measure !== goalMeasure) {
      return false;
    }

    if(goal.startDate !== null && tally.date < goal.startDate) {
      return false;
    }

    if(goal.endDate !== null && tally.date > goal.endDate) {
      return false;
    }

    if(workIdsIncluded.length > 0 && !workIdsIncluded.includes(tally.workId)) {
      return false;
    }

    const tallyTagIds = tally.tags.map(tag => tag.id);
    if(tagsIdsIncluded.length > 0 && !tagsIdsIncluded.some(goalTagId => tallyTagIds.includes(goalTagId))) {
      return false;
    }

    return true;
  });
}

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