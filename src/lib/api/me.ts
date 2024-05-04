import { callApiV1 } from "./api.ts";
import { User } from "@prisma/client";

import type { MeEditPayload } from "server/api/v1/me.ts";

export type { MeEditPayload, User };

const ENDPOINT = '/api/v1/me';

export async function getMe() {
  return callApiV1<User>(ENDPOINT, 'GET');
}

export async function updateMe(data: MeEditPayload) {
  return callApiV1<User>(ENDPOINT, 'PATCH', data);
}

export async function deleteMe() {
  return callApiV1<User>(ENDPOINT, 'DELETE');
}

export async function uploadAvatar(data: FormData) {
  return callApiV1<User>(ENDPOINT + '/avatar', 'POST', data);
}

export async function deleteAvatar() {
  return callApiV1<User>(ENDPOINT + '/avatar', 'DELETE');
}
