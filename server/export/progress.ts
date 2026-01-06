import path from 'node:path';
import fs from 'node:fs';
import { makeTempDir } from 'server/lib/fs.ts';

import { type Response } from 'express';
import { HTTP_METHODS, ACCESS_LEVEL, type RouteConfig } from '../lib/api.ts';
import { type RequestWithUser } from '../lib/middleware/access.ts';

import { exportUserDataZip } from 'server/lib/models/export.ts';

import { reqCtx } from '../lib/request-context.ts';

async function handleGetExport(req: RequestWithUser, res: Response<never>) {
  const tempDir = await makeTempDir('export');
  const exportFilepath = path.join(tempDir, 'trackbear-progress-export.zip');
  const writeStream = fs.createWriteStream(exportFilepath);

  await exportUserDataZip(req.user, writeStream, reqCtx(req));

  return res.status(200).download(exportFilepath, 'trackbear-progress-export.zip');
}

const routes: RouteConfig[] = [{
  path: '/',
  method: HTTP_METHODS.GET,
  handler: handleGetExport,
  accessLevel: ACCESS_LEVEL.SESSION,
}];

export default routes;
