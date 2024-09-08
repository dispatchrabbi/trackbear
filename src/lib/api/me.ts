import { callApiV1 } from "./api.ts";
import { UserSettings } from "@prisma/client";

import type { FullUser, MeEditPayload, SettingsEditPayload } from "server/api/v1/me.ts";

export type { MeEditPayload, FullUser };

const ENDPOINT = '/api/v1/me';

export async function getMe() {
  return callApiV1<FullUser>(ENDPOINT, 'GET');
}

export async function updateMe(data: MeEditPayload) {
  return callApiV1<FullUser>(ENDPOINT, 'PATCH', data);
}

export async function deleteMe() {
  return callApiV1<FullUser>(ENDPOINT, 'DELETE');
}

export async function uploadAvatar(data: FormData) {
  return callApiV1<FullUser>(ENDPOINT + '/avatar', 'POST', data);
}

export async function deleteAvatar() {
  return callApiV1<FullUser>(ENDPOINT + '/avatar', 'DELETE');
}

export async function updateSettings(data: SettingsEditPayload) {
  return callApiV1<UserSettings>(ENDPOINT + '/settings', 'PATCH', data);
}
