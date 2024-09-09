import { callApiV1 } from "./api.ts";

import type { DayCount, DaysQuery } from "server/api/v1/stats.ts";

export type { DayCount };

const ENDPOINT = '/api/v1/stats';

export async function getDayCounts(query: DaysQuery = null) {
  return callApiV1<DayCount[]>(ENDPOINT + '/days', 'GET', null, query);
}
