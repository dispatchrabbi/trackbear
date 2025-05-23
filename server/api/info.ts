import path from 'path';
const ROOT_DIR = path.resolve(import.meta.url.replace('file://', ''), '../../..');

import { Request } from 'express';
import { ApiHandler, ApiResponse, success } from '../lib/api-response.ts';

import { readFile } from 'fs/promises';
import { parseChangelog, Changelog } from '../lib/parse-changelog.ts';

import { getNormalizedEnv } from 'server/lib/env.ts';
import { HTTP_METHODS, ACCESS_LEVEL, RouteConfig } from 'server/lib/api.ts';

export type { Changelog };
export const handleGetChangelog: ApiHandler<Changelog> = (function() {
  let memoizedParsedChangelog = null;

  return async function(req: Request, res: ApiResponse<Changelog>) {
    if(memoizedParsedChangelog === null) {
      const changelogContents = await readFile(path.join(ROOT_DIR, 'CHANGELOG.md'), { encoding: 'utf-8' });
      memoizedParsedChangelog = parseChangelog(changelogContents);
    }

    return res.status(200).send(success(memoizedParsedChangelog));
  };
})();

export type EnvInfo = {
  URL_PREFIX: string;
  ENABLE_METRICS: boolean;
  PLAUSIBLE_HOST: string;
  PLAUSIBLE_DOMAIN: string;
};
export async function handleGetEnv(req: Request, res: ApiResponse<EnvInfo>) {
  const env = await getNormalizedEnv();
  const envInfo: EnvInfo = {
    URL_PREFIX: env.EMAIL_URL_PREFIX,
    ENABLE_METRICS: env.ENABLE_METRICS,
    PLAUSIBLE_HOST: env.ENABLE_METRICS ? env.PLAUSIBLE_HOST : '',
    PLAUSIBLE_DOMAIN: env.ENABLE_METRICS ? env.PLAUSIBLE_DOMAIN : '',
  };

  return res.status(200).send(success(envInfo));
}

const routes: RouteConfig[] = [
  {
    path: '/changelog',
    method: HTTP_METHODS.GET,
    handler: handleGetChangelog,
    accessLevel: ACCESS_LEVEL.PUBLIC,
  },
  {
    path: '/env',
    method: HTTP_METHODS.GET,
    handler: handleGetEnv,
    accessLevel: ACCESS_LEVEL.PUBLIC,
  },
];
export default routes;
