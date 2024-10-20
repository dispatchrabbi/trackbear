import { callApiV1 } from "./api.ts";

import type { Tally, Tag } from "@prisma/client";
import type { Work, SummarizedWork } from "server/api/v1/work.ts";

export type { Work, SummarizedWork };

export type TallyWithTags = Tally & { tags: Tag[] };
export type WorkWithTallies = Work & { tallies: TallyWithTags[] };

import type { WorkCreatePayload, WorkUpdatePayload } from "server/api/v1/work.ts";
export type { WorkCreatePayload, WorkUpdatePayload };

const ENDPOINT = '/api/v1/work';

export async function getWorks() {
  return callApiV1<SummarizedWork[]>(ENDPOINT, 'GET');
}

export async function getWork(id: number) {
  return callApiV1<WorkWithTallies>(ENDPOINT + `/${id}`, 'GET');
}

export async function createWork(data: WorkCreatePayload) {
  return callApiV1<Work>(ENDPOINT, 'POST', data);
}

export async function updateWork(id: number, data: WorkUpdatePayload) {
  return callApiV1<Work>(ENDPOINT + `/${id}`, 'PUT', data);
}

export async function starWork(id: number, starred: boolean) {
  return callApiV1<Work>(ENDPOINT + `/${id}`, 'PUT', { starred });
}

export async function deleteWork(id: number) {
  return callApiV1<Work>(ENDPOINT + `/${id}`, 'DELETE');
}
