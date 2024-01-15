import path from 'path';
const ROOT_DIR = path.resolve(import.meta.url.replace('file://', ''), '../../..');

import { Router, Request } from "express";
import { ApiResponse, success } from '../lib/api-response.ts';

import { readFile } from 'fs/promises';
import { parseChangelog, Changelog } from '../lib/parse-changelog.ts';

const infoRouter = Router();

let PARSED_CHANGELOG = null;
infoRouter.get('/changelog',
  async (req: Request, res: ApiResponse<Changelog>, next) =>
{
  if(PARSED_CHANGELOG === null) {
    try {
      const changelogContents = await readFile(path.join(ROOT_DIR, 'CHANGELOG.md'), { encoding: 'utf-8' });
      PARSED_CHANGELOG = parseChangelog(changelogContents);
    } catch(err) { return next(err); }
  }

  return res.status(200).send(success(PARSED_CHANGELOG));
});

export default infoRouter;
