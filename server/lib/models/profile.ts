import { USER_STATE } from "./user.ts";
import dbClient from "../db.ts";

import { add } from "date-fns";
import { formatDate } from "src/lib/date.ts";

import { WORK_STATE } from "./work.ts";
import { MeasureRecord, TALLY_MEASURE, TALLY_STATE } from "./tally.ts";
import { getDayCounts, DayCount } from "./stats.ts";

export type PublicProfile = {
  username: string;
  displayName: string;
  avatar: string;
  lifetimeTotals: MeasureRecord<number>;
  recentActivity: DayCount[];
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

  // currently, we're just going to return username, display name, and avatar
  return {
    username: user.username,
    displayName: user.displayName,
    avatar: user.avatar,
    lifetimeTotals,
    recentActivity
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