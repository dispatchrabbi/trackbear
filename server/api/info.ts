import path from 'path';
const ROOT_DIR = path.resolve(import.meta.url.replace('file://', ''), '../../..');

import { Router, Request } from "express";
import { ApiResponse, success } from '../lib/api-response.ts';

import { readFile } from 'fs/promises';
import { parseChangelog, Changelog } from '../lib/parse-changelog.ts';

import { getNormalizedEnv } from 'server/lib/env.ts';

const infoRouter = Router();
export default infoRouter;

export type { Changelog };
export const handleGetChangelog = (function() {
  let memoizedParsedChangelog = null;
  
  return async function(req: Request, res: ApiResponse<Changelog>, next) {
    if(memoizedParsedChangelog === null) {
      try {
        const changelogContents = await readFile(path.join(ROOT_DIR, 'CHANGELOG.md'), { encoding: 'utf-8' });
        memoizedParsedChangelog = parseChangelog(changelogContents);
      } catch(err) { return next(err); }
    }

    return res.status(200).send(success(memoizedParsedChangelog));
  };
})();
infoRouter.get('/changelog', handleGetChangelog);

infoRouter.get('/env', handleGetEnv);
export type EnvInfo = {
  URL_PREFIX: string;
  ENABLE_METRICS: boolean;
  PLAUSIBLE_HOST: string;
  PLAUSIBLE_DOMAIN: string;
};
export async function handleGetEnv(req: Request, res: ApiResponse<EnvInfo>) {
  const env = await getNormalizedEnv();
  const envInfo: EnvInfo = {
    URL_PREFIX:       env.EMAIL_URL_PREFIX,
    ENABLE_METRICS:   env.ENABLE_METRICS,
    PLAUSIBLE_HOST:   env.ENABLE_METRICS ? env.PLAUSIBLE_HOST : '',
    PLAUSIBLE_DOMAIN: env.ENABLE_METRICS ? env.PLAUSIBLE_DOMAIN : '',
  };

  return res.status(200).send(success(envInfo));
};
infoRouter.get('/env', handleGetEnv);
