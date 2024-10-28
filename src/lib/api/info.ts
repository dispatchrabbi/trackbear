import { callApi } from "./api.ts";
import type { Changelog } from "server/api/info.ts";

export type { Changelog };

async function getChangelog() {
  const response = await callApi<Changelog>('/api/info/changelog', 'GET');

  if(response.success === true) {
    return response.data;
  } else {
    throw response.error;
  }
}

export {
  getChangelog,
};
