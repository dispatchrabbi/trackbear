import { USER_STATE } from "./user.ts";
import dbClient from "../db.ts";

import { add } from "date-fns";
import { formatDate } from "src/lib/date.ts";

import { WORK_STATE } from "./work.ts";
import { MeasureRecord, TALLY_MEASURE, TALLY_STATE } from "./tally.ts";
import {
  GOAL_STATE, GOAL_TYPE,
  GoalTargetParameters, GoalHabitParameters,
  getTalliesForGoal, analyzeStreaksForHabit, HabitRange,
  isRangeCurrent
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


type ProfileHabitSummary = {
  uuid: string;
  title: string;
  parameters: GoalHabitParameters;
  currentRange: HabitRange | null;
  currentStreakLength: number | null;
  longestStreakLength: number | null;
  successfulRanges: number;
  totalRanges: number;
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
  const works = await getWorksWithStartingBalances(user.id);
  const tallyTotals = await getTallyTotals(user.id);
  const lifetimeTotals = Object.values(TALLY_MEASURE).reduce((obj, measure) => {
    let didTheyUseThisMeasureEver = false;
    let total = 0;
    
    if(measure in lifetimeStartingBalance) {
      total += lifetimeStartingBalance[measure];
      didTheyUseThisMeasureEver = true;
    }

    for(const work of works) {
      if(measure in work.startingBalance) {
        total += work.startingBalance[measure];
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
async function getWorksWithStartingBalances(userId: number): Promise<WorkStartingBalance[]> {
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
    
    const dayCounts = Object.values(talliesForTarget.reduce((obj: Record<string, SimpleDayCount>, tally) => {
      if(!(tally.date in obj)) {
        obj[tally.date] = { date: tally.date, count: 0 };
      }
      
      obj[tally.date].count += tally.count;
      
      return obj;
    }, {}));

    summaries.push({
      uuid: target.uuid,
      title: target.title,
      parameters: target.parameters,
      dayCounts,
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

    const { ranges, streaks } = analyzeStreaksForHabit(
      talliesForHabit, parameters.cadence, parameters.threshold,
      habit.startDate, habit.endDate
    );

    const currentRange = isRangeCurrent(ranges.at(-1)) ? ranges.at(-1) : null;
    const successfulRanges = ranges.filter(range => range.isSuccess).length;
    const totalRanges = ranges.length;
    
    summaries.push({
      uuid: habit.uuid,
      title: habit.title,
      parameters: parameters,
      currentRange,
      currentStreakLength: streaks.current === null ? null : streaks.current.length,
      longestStreakLength: streaks.longest.length,
      successfulRanges,
      totalRanges,
    });
  }

  return summaries;
}