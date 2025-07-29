import path from 'node:path';
import { parse, format, startOfDay, subDays } from 'date-fns';

import { traced } from '../../metrics/tracer.ts';

import dbClient from '../../db.ts';
import { importRawSql } from 'server/lib/sql.ts';
import { USER_STATE } from '../user/consts.ts';

export type WeeklyStat = {
  weekStart: string;
  count: number;
};

export type DailyStat = {
  date: string;
  count: number;
};

export type UserStats = {
  active: number;
  verified: number;
  signedUpLast7Days: number;
  signedUpLast30Days: number;
};

const dailySignupsSql = await importRawSql(path.resolve(import.meta.dirname, './sql/daily-signups.sql'));
const weeklySignupsSql = await importRawSql(path.resolve(import.meta.dirname, './sql/weekly-signups.sql'));
const dailyUsersSql = await importRawSql(path.resolve(import.meta.dirname, './sql/daily-users.sql'));
const weeklyUsersSql = await importRawSql(path.resolve(import.meta.dirname, './sql/weekly-users.sql'));

export class ServiceStatsModel {
  @traced
  static async getDailySignups(): Promise<DailyStat[]> {
    const results: { date: string; signups: number }[] = await dbClient.$queryRawUnsafe(dailySignupsSql);

    const signupsByDay = results.map(({ date, signups }) => ({ date, count: Number(signups) }));

    return signupsByDay;
  }

  @traced
  static async getWeeklySignups(): Promise<WeeklyStat[]> {
    const results: { weekNumber: string; signups: number }[] = await dbClient.$queryRawUnsafe(weeklySignupsSql);

    const now = new Date();
    const signupsByWeek = results.map(({ weekNumber, signups }) => {
      const weekStart = format(parse(weekNumber, 'R-II', now), 'y-MM-dd');

      return { weekStart, count: Number(signups) };
    });

    return signupsByWeek;
  }

  @traced
  static async getDailyUsers(): Promise<DailyStat[]> {
    const results: { date: string; activeUsers: number }[] = await dbClient.$queryRawUnsafe(dailyUsersSql);

    const usersByDay = results.map(({ date, activeUsers }) => ({ date, count: Number(activeUsers) }));

    return usersByDay;
  }

  @traced
  static async getWeeklyUsers(): Promise<WeeklyStat[]> {
    const results: { weekNumber: string; activeUsers: number }[] = await dbClient.$queryRawUnsafe(weeklyUsersSql);

    const now = new Date();
    const usersByWeek = results.map(({ weekNumber, activeUsers }) => {
      const weekStart = format(parse(weekNumber, 'R-II', now), 'y-MM-dd');

      return { weekStart, count: Number(activeUsers) };
    });

    return usersByWeek;
  }

  @traced
  static async getUserStats(): Promise<UserStats> {
    const active = await dbClient.user.count({
      where: {
        state: USER_STATE.ACTIVE,
      },
    });

    const verified = await dbClient.user.count({
      where: {
        state: USER_STATE.ACTIVE,
        isEmailVerified: true,
      },
    });

    const now = new Date();

    const signedUpLast7Days = await dbClient.user.count({
      where: {
        state: USER_STATE.ACTIVE,
        createdAt: {
          gte: subDays(startOfDay(now), 6),
        },
      },
    });

    const signedUpLast30Days = await dbClient.user.count({
      where: {
        state: USER_STATE.ACTIVE,
        createdAt: {
          gte: subDays(startOfDay(now), 29),
        },
      },
    });

    return {
      active,
      verified,
      signedUpLast7Days,
      signedUpLast30Days,
    };
  }
}
