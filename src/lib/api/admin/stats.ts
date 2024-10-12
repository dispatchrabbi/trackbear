import { callApiV1 } from "src/lib/api/api.ts";

import { WeeklyStat } from "server/api/admin/stats.ts";

export type { WeeklyStat };

const ENDPOINT = '/api/admin/stats';

export async function getWeeklyActiveUsers() {
  return callApiV1<WeeklyStat[]>(ENDPOINT + '/weekly-active-users', 'GET');
}

export async function getWeeklySignups() {
  return callApiV1<WeeklyStat[]>(ENDPOINT + '/weekly-signups', 'GET');
}
