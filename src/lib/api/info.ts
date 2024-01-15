import { callApi } from "./api.ts";
import { Changelog } from "server/lib/parse-changelog.ts";

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
