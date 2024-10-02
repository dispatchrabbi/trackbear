import { USER_STATE } from "./user.ts";
import dbClient from "../db.ts";

import { add, endOfDay } from "date-fns";
import { formatDate, parseDateString } from "src/lib/date.ts";

import { WORK_STATE } from "./work.ts";
import { MeasureRecord, TALLY_MEASURE, TALLY_STATE, TallyMeasure } from "./tally.ts";
import {
  GOAL_STATE, GOAL_TYPE, GOAL_CADENCE_UNIT_INFO, GoalCadenceUnit,
  GoalTargetParameters, GoalHabitParameters, GoalCadence, GoalThreshold,
  getTalliesForGoal,
} from "./goal.ts";
import { getDayCounts, DayCount } from "./stats.ts";
import { TAG_STATE } from "./tag.ts";

type ProfileWorkSummary = {
  uuid: string;
  title: string;
  totals: MeasureRecord<number>,
  recentActivity: DayCount[],
};

type SimpleDayCount = { date: string; count: number; };
type ProfileTargetSummary = {
  uuid: string;
  title: string;
  parameters: GoalTargetParameters;
  dayCounts: SimpleDayCount[];
  startDate: string | null;
  endDate: string | null;
};

export type ProfileHabitRange = {
  startDate: string;
  endDate: string;
  tallies: TallyLike[];
  total: number;
  isSuccess: boolean;
};
type ProfileHabitSummary = {
  uuid: string;
  title: string;
  parameters: GoalHabitParameters;
  currentRange: ProfileHabitRange | null;
  currentStreak: number | null;
  successCount: number;
  totalCount: number;
};

export type PublicProfile = {
  username: string;
  displayName: string;
  avatar: string;
  lifetimeTotals: MeasureRecord<number>;
  recentActivity: DayCount[];
  workSummaries: ProfileWorkSummary[];
  targetSummaries: ProfileTargetSummary[];
  habitSummaries: ProfileHabitSummary[];
};

export async function getUserProfile(username): Promise<PublicProfile> {
  // first, get the active user with that username along with user settings
  const user = await dbClient.user.findUnique({
    where: {
      username: username,
      state: USER_STATE.ACTIVE,
    },
    include: {
      userSettings: true,
    }
  });

  if(user === null) {
    // no active user with that username found
    return null;
  } else if(user.userSettings.enablePublicProfile !== true) {
    // the user doesn't have public profile enabled
    return null;
  }

  // next, get their lifetime totals
  // lifetime totals are: lifetime starting balance + work starting balances + total of tallies
  const lifetimeStartingBalance = user.userSettings.lifetimeStartingBalance as MeasureRecord<number>;
  const workStartingBalances = await getWorkStartingBalances(user.id);
  const tallyTotals = await getTallyTotals(user.id);
  const lifetimeTotals = Object.values(TALLY_MEASURE).reduce((obj, measure) => {
    let didTheyUseThisMeasureEver = false;
    let total = 0;
    
    if(measure in lifetimeStartingBalance) {
      total += lifetimeStartingBalance[measure];
      didTheyUseThisMeasureEver = true;
    }

    for(const balance of workStartingBalances) {
      if(measure in balance) {
        total += balance[measure];
        didTheyUseThisMeasureEver = true;
      }
    }

    if(measure in tallyTotals) {
      total += tallyTotals[measure];
      didTheyUseThisMeasureEver = true;
    }

    if(didTheyUseThisMeasureEver) {
      obj[measure] = total;
    }
    return obj;
  }, {});

  // after that, we need activity going back a year for the heatmap
  const oneYearAgo = formatDate(add(new Date(), { years: -1 }));
  const recentActivity = await getDayCounts(user.id, oneYearAgo);

  // we also give the option to display selected works
  const workSummaries = await getProfileWorkSummaries(user.id);

  // not to mention the option to display selected habits and targets
  const targetSummaries = await getProfileTargetSummaries(user.id);
  const habitSummaries = await getProfileHabitSummaries(user.id);

  return {
    username: user.username,
    displayName: user.displayName,
    avatar: user.avatar,
    lifetimeTotals,
    recentActivity,
    workSummaries,
    targetSummaries,
    habitSummaries,
  };
}

type WorkStartingBalance = {
  id: number;
  startingBalance: MeasureRecord<number>;
};
async function getWorkStartingBalances(userId: number): Promise<WorkStartingBalance[]> {
  const works = await dbClient.work.findMany({
    where: {
      ownerId: userId,
      state: WORK_STATE.ACTIVE,
    },
    select: {
      id: true,
      startingBalance: true,
    }
  });

  return works as WorkStartingBalance[];
}

async function getTallyTotals(userId: number): Promise<MeasureRecord<number>> {
  const totalsResult = await dbClient.tally.groupBy({
    by: [ 'measure' ],
    where: {
      ownerId: userId,
      state: TALLY_STATE.ACTIVE,
      work: {
        ownerId: userId,
        state: WORK_STATE.ACTIVE
      },
    },
    _sum: { count: true },
  });

  const totals = totalsResult.reduce((obj, record) => {
    obj[record.measure] = record._sum.count;
    return obj;
  }, {});

  return totals;
}

async function getProfileWorkSummaries(userId: number): Promise<ProfileWorkSummary[]> {
  const worksOnProfile = await dbClient.work.findMany({
    where: {
      ownerId: userId,
      state: WORK_STATE.ACTIVE,
      displayOnProfile: true,
    },
    select: {
      id: true,
      uuid: true,
      title: true,
      startingBalance: true,
    },
  });

  const dayCountsForProfile = await dbClient.tally.groupBy({
    by: [ 'workId', 'date', 'measure' ],
    where: {
      ownerId: userId,
      workId: { in: worksOnProfile.map(work => work.id) },
      state: TALLY_STATE.ACTIVE,
    },
    _sum: { count: true },
  });

  const oneYearAgo = formatDate(add(new Date(), { years: -1 }));
  const summaries = worksOnProfile.map(work => {
    const workCounts = dayCountsForProfile.filter(dayCount => dayCount.workId === work.id);
    const totals = workCounts.reduce((obj, dayCount) => {
      obj[dayCount.measure] = obj[dayCount.measure] || work.startingBalance[dayCount.measure] || 0;
      obj[dayCount.measure] += dayCount._sum.count;
      return obj;
    }, {});

    const recentActivityObj = workCounts
      .filter(dayCount => dayCount.date > oneYearAgo)
      .reduce<Record<string, DayCount>>((obj, dayCount) => {
        obj[dayCount.date] = obj[dayCount.date] || { date: dayCount.date, counts: {} };
        obj[dayCount.date].counts[dayCount.measure] = (obj[dayCount.date].counts[dayCount.measure] || 0) + dayCount._sum.count;
        return obj;
      }, {});
    const recentActivity = Object.values(recentActivityObj);

    return {
      uuid: work.uuid,
      title: work.title,
      totals,
      recentActivity
    }
  });

  return summaries;
}

async function getProfileTargetSummaries(userId: number): Promise<ProfileTargetSummary[]> {
  const eligibleTargets = await dbClient.goal.findMany({
    where: {
      ownerId: userId,
      state: GOAL_STATE.ACTIVE,
      type: GOAL_TYPE.TARGET,
      displayOnProfile: true,
    },
    include: {
      worksIncluded: {
        where: { state: WORK_STATE.ACTIVE },
      },
      tagsIncluded: {
        where: { state: TAG_STATE.ACTIVE },
      },
    },
  });

  const summaries = [];
  for(const target of eligibleTargets) {
    // not happy about hitting the db once for every target but anything else is way too complicated
    const talliesForTarget = await getTalliesForGoal(target);
    
    const countsForTarget = Object.values(talliesForTarget.reduce((obj: Record<string, SimpleDayCount>, tally) => {
      if(!(tally.date in obj)) {
        obj[tally.date] = { date: tally.date, count: 0 };
      }
      
      obj[tally.date].count += tally.count;
      
      return obj;
    }, {}));

    let total = 0;
    const totalsForTarget = countsForTarget.map(el => {
      total += el.count;
      return {
        date: el.date,
        count: total,
      };
    });

    summaries.push({
      uuid: target.uuid,
      title: target.title,
      parameters: target.parameters,
      dayCounts: totalsForTarget,
      startDate: target.startDate,
      endDate: target.endDate,
    });
  }

  return summaries;
}

async function getProfileHabitSummaries(userId: number): Promise<ProfileHabitSummary[]> {
  const eligibleHabits = await dbClient.goal.findMany({
    where: {
      ownerId: userId,
      state: GOAL_STATE.ACTIVE,
      type: GOAL_TYPE.HABIT,
      displayOnProfile: true,
    },
    include: {
      worksIncluded: {
        where: { state: WORK_STATE.ACTIVE },
      },
      tagsIncluded: {
        where: { state: TAG_STATE.ACTIVE },
      },
    },
  });

  const summaries = [];
  for(const habit of eligibleHabits) {

    const parameters = habit.parameters as GoalHabitParameters;
    const talliesForHabit = await getTalliesForGoal(habit);

    const { ranges, streaks } = tabulateStreaks(
      talliesForHabit, parameters.cadence, parameters.threshold,
      habit.startDate, habit.endDate
    );

    const currentRange = streaks.current ? ranges.at(-1) : null;
    const successCount = ranges.filter(range => range.isSuccess).length;
    const totalCount = ranges.length;
    
    summaries.push({
      uuid: habit.uuid,
      title: habit.title,
      parameters: parameters,
      currentRange,
      currentStreak: streaks.current,
      successCount,
      totalCount,
    });
  }

  return summaries;
}

// TODO: this is almost exactly the same as what's in src/lib/goal.ts - cleatn it up
type TallyLike = {
  date: string;
  measure: TallyMeasure;
  count: number;
};
function tabulateStreaks(tallies: TallyLike[], cadence: GoalCadence, threshold: GoalThreshold, startDate?: string, endDate?: string) {
  const filteredTalles = threshold === null ? tallies : tallies.filter(tally => tally.measure === threshold.measure);
  const sortedTallies = filteredTalles.toSorted((a, b) => a.date < b.date ? -1 : a.date > b.date ? 1 : 0);

  if(sortedTallies.length === 0) {
    return {
      ranges: [],
      streaks: { longest: 0, current: 0, list: [] }
    };
  }

  startDate = startDate ?? sortedTallies[0].date;
  endDate = endDate ?? sortedTallies[sortedTallies.length - 1].date;

  // first, get all the possible date ranges for the habit
  const dateRanges = createDateRanges(cadence.period, cadence.unit, startDate, endDate);

  // then check each range to see which tallies are there, how many hits they have, and if that's enough
  // keep a streak counter going as well
  const streaks: ProfileHabitRange[][] = [[]];
  const ranges: ProfileHabitRange[] = [];
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
      streaks[streaks.length - 1].push(range);
    } else if(streaks[streaks.length - 1].length !== 0) {
      streaks.push([]);
    } // else we already have a zero streak recorded
  }

  // TODO: Fix this streak logic
  // Currently you're always going to be at a 0 streak unless you've already hit it this (time period)
  // What it *should* be is that any current streak you've got going should be kept that way (but not counting the current time period) until
  // you either MISS a time period (then it's zero) or you HIT the time period (and then it's +1 to the streak)
  // aaaaaaaaaa
  // don't forget to fix the logic in other places too
  const today = formatDate(new Date());
  const lastStreak = streaks[streaks.length - 1];
  const lastStreakIsCurrentStreak = (lastStreak.length > 0 && today >= lastStreak[0].startDate && today <= lastStreak.at(-1).endDate && lastStreak);
  const currentStreak = lastStreakIsCurrentStreak ? lastStreak.length : null;

  return {
    ranges,
    streaks: {
      longest: streaks.reduce((max, streak) => Math.max(max, streak.length), 0),
      current: currentStreak,
      list: streaks,
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