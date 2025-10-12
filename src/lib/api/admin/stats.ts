import { callApiV1 } from 'src/lib/api';

import { type WeeklyStat, type DailyStat, type UserStats } from 'server/api/admin/stats.ts';

export type { WeeklyStat, DailyStat, UserStats };

const ENDPOINT = '/api/admin/stats';

export async function getWeeklyActiveUsers() {
  return callApiV1<WeeklyStat[]>(ENDPOINT + '/weekly-active-users', 'GET');
}

export async function getWeeklySignups() {
  return callApiV1<WeeklyStat[]>(ENDPOINT + '/weekly-signups', 'GET');
}

export async function getDailyActiveUsers() {
  return callApiV1<DailyStat[]>(ENDPOINT + '/daily-active-users', 'GET');
}

export async function getDailySignups() {
  return callApiV1<DailyStat[]>(ENDPOINT + '/daily-signups', 'GET');
}

export async function getUserStats() {
  return callApiV1<UserStats>(ENDPOINT + '/user-stats', 'GET');
}
