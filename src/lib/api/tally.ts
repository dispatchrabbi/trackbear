import { callApiV1 } from '../api.ts';

import type { Tally } from 'generated/prisma/client';
import type { TallyQuery, TallyCreatePayload, TallyUpdatePayload, TallyWithWorkAndTags } from 'server/api/v1/tally.ts';
import type { Tag } from 'src/lib/api/tag.ts';

export type { Tally, TallyWithWorkAndTags, TallyCreatePayload, TallyUpdatePayload };
export type TallyWithTags = Tally & { tags: Tag[] };

const ENDPOINT = '/api/v1/tally';

export async function getTallies(query: TallyQuery = null) {
  return callApiV1<TallyWithWorkAndTags[]>(ENDPOINT, 'GET', null, query);
}

export async function getTally(id: number) {
  return callApiV1<TallyWithWorkAndTags>(ENDPOINT + `/${id}`, 'GET');
}

export async function createTally(data: TallyCreatePayload) {
  return callApiV1<TallyWithWorkAndTags>(ENDPOINT, 'POST', data);
}

export async function batchCreateTallies(data: TallyCreatePayload[]) {
  return callApiV1<TallyWithWorkAndTags[]>(ENDPOINT + `/batch`, 'POST', data);
}

export async function updateTally(id: number, data: TallyUpdatePayload) {
  return callApiV1<TallyWithWorkAndTags>(ENDPOINT + `/${id}`, 'PATCH', data);
}

export async function deleteTally(id: number) {
  return callApiV1<TallyWithWorkAndTags>(ENDPOINT + `/${id}`, 'DELETE');
}
