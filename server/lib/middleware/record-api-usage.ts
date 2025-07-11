import type { Request, Response, NextFunction } from 'express';
import { getApiTokenFromRequest } from '../auth';

function recordApiUsage(req: Request, res: Response, next: NextFunction) {
  const apiToken = getApiTokenFromRequest(req);
  const userAgent = req.header('user-agent');

  // TODO: record that apiToken was last used now with UA userAgent
  next();
}
