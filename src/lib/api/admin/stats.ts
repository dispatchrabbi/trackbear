import { callApiV1 } from "src/lib/api/api.ts";

import { WeeklyStat, DailyStat } from "server/api/admin/stats.ts";

export type { WeeklyStat, DailyStat };

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
