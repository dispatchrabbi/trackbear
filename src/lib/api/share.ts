import { callApi } from "./api.ts";
import type { SharedProjectWithUpdates } from '../../../server/api/share.ts';

async function getSharedProject(uuid: string) {
  const response = await callApi<SharedProjectWithUpdates>(`/api/share/projects/${uuid}`, 'GET');

  if(response.success === true) {
    return response.data;
  } else {
    throw response.error;
  }
}

export {
  getSharedProject,
};
