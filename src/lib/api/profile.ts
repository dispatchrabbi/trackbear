import { callApiV1 } from "./api.ts";

import type { PublicProfile } from "server/api/v1/profile.ts";
export type { PublicProfile };

const ENDPOINT = '/api/v1/profile';

export async function getProfile(username: string) {
  return callApiV1<PublicProfile>(ENDPOINT + `/${username}`, 'GET');
}