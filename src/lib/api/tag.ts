import { callApiV1 } from "./api.ts";

import type { Tag } from "@prisma/client";
import type { TagPayload } from "server/api/v1/tag.ts";

export type { Tag, TagPayload };

const ENDPOINT = '/api/v1/tag';

export async function getTags() {
  return callApiV1<Tag[]>(ENDPOINT, 'GET');
}

export async function getTag(id: number) {
  return callApiV1<Tag>(ENDPOINT + `/${id}`, 'GET');
}

export async function createTag(data: TagPayload) {
  return callApiV1<Tag>(ENDPOINT, 'POST', data);
}

export async function updateTag(id: number, data: TagPayload) {
  return callApiV1<Tag>(ENDPOINT + `/${id}`, 'PUT', data);
}

export async function deleteTag(id: number) {
  return callApiV1<Tag>(ENDPOINT + `/${id}`, 'DELETE');
}
