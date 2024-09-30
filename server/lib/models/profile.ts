import { USER_STATE } from "./user.ts";
import dbClient from "../db.ts";

import { add } from "date-fns";
import { formatDate } from "src/lib/date.ts";

import { WORK_STATE } from "./work.ts";
import { MeasureRecord, TALLY_MEASURE, TALLY_STATE } from "./tally.ts";
import { getDayCounts, DayCount } from "./stats.ts";

type ProfileWorkSummary = {
  uuid: string;
  title: string;
  totals: MeasureRecord<number>,
  recentActivity: DayCount[],
};

export type PublicProfile = {
  username: string;
  displayName: string;
  avatar: string;
  lifetimeTotals: MeasureRecord<number>;
  recentActivity: DayCount[];
  workSummaries: ProfileWorkSummary[];
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
  const workSummaries = await getProfileWorkSummary(user.id);

  return {
    username: user.username,
    displayName: user.displayName,
    avatar: user.avatar,
    lifetimeTotals,
    recentActivity,
    workSummaries,
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

async function getProfileWorkSummary(userId: number): Promise<ProfileWorkSummary[]> {
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