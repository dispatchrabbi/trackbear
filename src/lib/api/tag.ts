import { callApiV1 } from '../api.ts';

import type { Tag } from '@prisma/client';
import type { TagCreatePayload, TagUpdatePayload } from 'server/api/v1/tag.ts';

export type { Tag, TagCreatePayload, TagUpdatePayload };

const ENDPOINT = '/api/v1/tag';

export async function getTags() {
  return callApiV1<Tag[]>(ENDPOINT, 'GET');
}

export async function getTag(id: number) {
  return callApiV1<Tag>(ENDPOINT + `/${id}`, 'GET');
}

export async function createTag(data: TagCreatePayload) {
  return callApiV1<Tag>(ENDPOINT, 'POST', data);
}

export async function updateTag(id: number, data: TagUpdatePayload) {
  return callApiV1<Tag>(ENDPOINT + `/${id}`, 'PATCH', data);
}

export async function deleteTag(id: number) {
  return callApiV1<Tag>(ENDPOINT + `/${id}`, 'DELETE');
}
