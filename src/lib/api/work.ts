import { callApiV1 } from "./api.ts";

import type { Work } from "@prisma/client";
import type { WorkWithTotals, WorkWithTallies, WorkPayload } from "server/api/v1/work.ts";

export type { Work, WorkWithTotals, WorkWithTallies, WorkPayload };

const ENDPOINT = '/api/v1/work';

export async function getWorks() {
  return callApiV1<WorkWithTotals[]>(ENDPOINT, 'GET');
}

export async function getWork(id: number) {
  return callApiV1<WorkWithTallies>(ENDPOINT + `/${id}`, 'GET');
}

export async function createWork(data: WorkPayload) {
  return callApiV1<Work>(ENDPOINT, 'POST', data);
}

export async function updateWork(id: number, data: WorkPayload) {
  return callApiV1<Work>(ENDPOINT + `/${id}`, 'PUT', data);
}

export async function deleteWork(id: number) {
  return callApiV1<Work>(ENDPOINT + `/${id}`, 'DELETE');
}
