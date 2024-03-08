import { callApiV1 } from "./api.ts";

import type { Tally } from "@prisma/client";
import type { TallyQuery, TallyPayload } from "server/api/v1/tally.ts";

export type { Tally };

const ENDPOINT = '/api/v1/tally';

export async function getTallies(query: TallyQuery = null) {
  return callApiV1<Tally[]>(ENDPOINT, 'GET', null, query);
}

export async function getTally(id: number) {
  return callApiV1<Tally>(ENDPOINT + `/${id}`, 'GET');
}

export async function createTally(data: TallyPayload) {
  return callApiV1<Tally>(ENDPOINT, 'POST', data);
}

export async function updateTally(id: number, data: TallyPayload) {
  return callApiV1<Tally>(ENDPOINT + `/${id}`, 'PUT', data);
}

export async function deleteTally(id: number) {
  return callApiV1<Tally>(ENDPOINT + `/${id}`, 'DELETE');
}
