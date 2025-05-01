import { callApi } from '../api.ts';
import type { Changelog, EnvInfo } from 'server/api/info.ts';

export type { Changelog, EnvInfo };

async function getChangelog() {
  const response = await callApi<Changelog>('/api/info/changelog', 'GET');

  if(response.success === true) {
    return response.data;
  } else {
    throw response.error;
  }
}

async function getEnv() {
  const response = await callApi<EnvInfo>('/api/info/env', 'GET');

  if(response.success === true) {
    return response.data;
  } else {
    throw response.error;
  }
}

export {
  getChangelog,
  getEnv,
};
