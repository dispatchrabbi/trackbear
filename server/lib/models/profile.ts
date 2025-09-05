import { USER_STATE } from './user/consts.ts';
import dbClient from '../db.ts';

import { add, Day } from 'date-fns';
import { formatDate } from 'src/lib/date.ts';

import { FullUser, User } from './user/user-model.ts';
import { PROJECT_STATE } from './project/consts.ts';
import { TALLY_MEASURE, TALLY_STATE } from './tally/consts.ts';
import { MeasureCounts } from './tally/types.ts';
import { GOAL_TYPE } from './goal/consts.ts';
import { analyzeStreaksForHabit, HabitRange, isRangeCurrent } from './goal/helpers.ts';
import type { TargetGoalParameters, HabitGoalParameters, HabitGoal, TargetGoal } from './goal/types.ts';
import { GoalModel } from './goal/goal-model.ts';
import { getDayCounts, DayCount } from './stats.ts';

type ProfileProjectSummary = {
  uuid: string;
  title: string;
  totals: MeasureCounts;
  recentActivity: DayCount[];
};

type SimpleDayCount = { date: string; count: number };
type ProfileTargetSummary = {
  uuid: string;
  title: string;
  parameters: TargetGoalParameters;
  dayCounts: SimpleDayCount[];
  startDate: string | null;
  endDate: string | null;
};

type ProfileHabitSummary = {
  uuid: string;
  title: string;
  parameters: HabitGoalParameters;
  currentRange: HabitRange | null;
  currentStreakLength: number | null;
  longestStreakLength: number | null;
  successfulRanges: number;
  totalRanges: number;
};

type ProfileConfig = {
  weekStartDay: Day;
};

export type PublicProfile = {
  username: string;
  displayName: string;
  avatar: string;
  lifetimeTotals: MeasureCounts;
  recentActivity: DayCount[];
  projectSummaries: ProfileProjectSummary[];
  targetSummaries: ProfileTargetSummary[];
  habitSummaries: ProfileHabitSummary[];
  config: ProfileConfig;
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
    },
  }) as FullUser;

  if(user === null) {
    // no active user with that username found
    return null;
  } else if(user.userSettings.enablePublicProfile !== true) {
    // the user doesn't have public profile enabled
    return null;
  }

  const [
    lifetimeTotals,
    recentActivity,
    projectSummaries,
    targetSummaries,
    habitSummaries,
  ] = await Promise.all([
    // next, get their lifetime totals
    getLifetimeTotals(user.id, user.userSettings.lifetimeStartingBalance),
    // we need activity going back a year for the heatmap
    getRecentActivity(user.id),
    // we also give the option to display selected projects
    getProfileProjectSummaries(user.id),
    // not to mention the option to display selected habits and targets
    getProfileTargetSummaries(user.id),
    getProfileHabitSummaries(user.id, user.userSettings.weekStartDay),
  ]);

  return {
    username: user.username,
    displayName: user.displayName,
    avatar: user.avatar,
    lifetimeTotals,
    recentActivity,
    projectSummaries,
    targetSummaries,
    habitSummaries,
    config: {
      weekStartDay: user.userSettings.weekStartDay,
    },
  };
}

async function getLifetimeTotals(userId: number, lifetimeStartingBalance: MeasureCounts): Promise<MeasureCounts> {
  // lifetime totals are: lifetime starting balance + project starting balances + total of tallies
  const projects = await getProjectsWithStartingBalances(userId);
  const tallyTotals = await getTallyTotals(userId);
  const lifetimeTotals = Object.values(TALLY_MEASURE).reduce((obj, measure) => {
    let didTheyUseThisMeasureEver = false;
    let total = 0;

    if(measure in lifetimeStartingBalance) {
      total += lifetimeStartingBalance[measure];
      didTheyUseThisMeasureEver = true;
    }

    for(const project of projects) {
      if(measure in project.startingBalance) {
        total += project.startingBalance[measure];
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

  return lifetimeTotals;
}

async function getRecentActivity(userId: number): Promise<DayCount[]> {
  const oneYearAgo = formatDate(add(new Date(), { years: -1 }));
  const recentActivity = await getDayCounts(userId, oneYearAgo);

  return recentActivity;
}

type ProjectStartingBalance = {
  id: number;
  startingBalance: MeasureCounts;
};
async function getProjectsWithStartingBalances(userId: number): Promise<ProjectStartingBalance[]> {
  const projects = await dbClient.work.findMany({
    where: {
      ownerId: userId,
      state: PROJECT_STATE.ACTIVE,
    },
    select: {
      id: true,
      startingBalance: true,
    },
  });

  return projects as ProjectStartingBalance[];
}

async function getTallyTotals(userId: number): Promise<MeasureCounts> {
  const totalsResult = await dbClient.tally.groupBy({
    by: ['measure'],
    where: {
      ownerId: userId,
      state: TALLY_STATE.ACTIVE,
      work: {
        ownerId: userId,
        state: PROJECT_STATE.ACTIVE,
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

async function getProfileProjectSummaries(userId: number): Promise<ProfileProjectSummary[]> {
  const projectsOnProfile = await dbClient.work.findMany({
    where: {
      ownerId: userId,
      state: PROJECT_STATE.ACTIVE,
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
    by: ['workId', 'date', 'measure'],
    where: {
      ownerId: userId,
      workId: { in: projectsOnProfile.map(project => project.id) },
      state: TALLY_STATE.ACTIVE,
    },
    _sum: { count: true },
  });

  const oneYearAgo = formatDate(add(new Date(), { years: -1 }));
  const summaries = projectsOnProfile.map(project => {
    const projectCounts = dayCountsForProfile.filter(dayCount => dayCount.workId === project.id);
    const totals = projectCounts.reduce((obj, dayCount) => {
      obj[dayCount.measure] = obj[dayCount.measure] || project.startingBalance[dayCount.measure] || 0;
      obj[dayCount.measure] += dayCount._sum.count;
      return obj;
    }, {});

    const recentActivityObj = projectCounts
      .filter(dayCount => dayCount.date > oneYearAgo)
      .reduce<Record<string, DayCount>>((obj, dayCount) => {
        obj[dayCount.date] = obj[dayCount.date] || { date: dayCount.date, counts: {} };
        obj[dayCount.date].counts[dayCount.measure] = (obj[dayCount.date].counts[dayCount.measure] || 0) + dayCount._sum.count;
        return obj;
      }, {});
    const recentActivity = Object.values(recentActivityObj);

    return {
      uuid: project.uuid,
      title: project.title,
      totals,
      recentActivity,
    };
  });

  return summaries;
}

async function getProfileTargetSummaries(userId: number): Promise<ProfileTargetSummary[]> {
  const allGoals = await GoalModel.getGoals({ id: userId } as User);
  const eligibleTargets = allGoals.filter(goal => goal.type === GOAL_TYPE.TARGET && goal.displayOnProfile === true) as TargetGoal[];

  const summaries = [];
  for(const target of eligibleTargets) {
    // not happy about hitting the db once for every target but anything else is way too complicated
    const talliesForTarget = await GoalModel.DEPRECATED_getTalliesForGoal(target);

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

async function getProfileHabitSummaries(userId: number, weekStartDay: Day): Promise<ProfileHabitSummary[]> {
  const allGoals = await GoalModel.getGoals({ id: userId } as User);
  const eligibleHabits = allGoals.filter(goal => goal.type === GOAL_TYPE.HABIT && goal.displayOnProfile === true) as HabitGoal[];

  const summaries = [];
  for(const habit of eligibleHabits) {
    const talliesForHabit = await GoalModel.DEPRECATED_getTalliesForGoal(habit);

    const { ranges, streaks } = analyzeStreaksForHabit(
      talliesForHabit, habit.parameters.cadence, habit.parameters.threshold,
      habit.startDate, habit.endDate,
      weekStartDay,
    );

    const currentRange = (ranges.length > 0 && isRangeCurrent(ranges.at(-1))) ? ranges.at(-1) : null;
    const successfulRanges = ranges.filter(range => range.isSuccess).length;
    const totalRanges = ranges.length;

    summaries.push({
      uuid: habit.uuid,
      title: habit.title,
      parameters: habit.parameters,
      currentRange,
      currentStreakLength: streaks.current === null ? null : streaks.current.length,
      longestStreakLength: streaks.longest.length,
      successfulRanges,
      totalRanges,
    });
  }

  return summaries;
}
