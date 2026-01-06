import { type Request, type Application, type RequestHandler, type ErrorRequestHandler } from 'express';
import type { WithSessionAuth } from 'server/lib/auth.ts';
import { type ApiResponse, failure } from 'server/lib/api-response.ts';
import { mountEndpoints, prefixRoutes, type RouteConfig } from 'server/lib/api.ts';

import cors from 'cors';
import { corsOptionsDelegate } from 'server/lib/middleware/cors.ts';

import { getLogger } from 'server/lib/logger.ts';
const logger = getLogger();

import progressRoutes from './progress.ts';

const exportRoutes: RouteConfig[] = [
  ...prefixRoutes('/progress', progressRoutes),
];

export function mountExportEndpoint(app: Application) {
  // enable CORS pre-flight for all API calls
  app.options('/export', cors(corsOptionsDelegate));

  app.use('/export', logExportRequest);

  // enable appropriate CORS headers for all API calls
  app.use('/export', cors(corsOptionsDelegate));

  mountEndpoints(app, prefixRoutes('/export', exportRoutes));

  app.use('/export', lastChanceErrorHandler);

  app.all('/export/*', fallthrough404Handler);
}

const logExportRequest: RequestHandler = function(req, res, next) {
  logger.info(`${req.method} ${req.originalUrl}`, { sessionId: req.sessionID, user: (req as WithSessionAuth<Request>).session.auth?.id });
  next();
};

// handle any errors
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const lastChanceErrorHandler: ErrorRequestHandler = (err, req, res: ApiResponse<never>, next) => {
  if(err) {
    logger.error(`${req.method} ${req.originalUrl}: ${err.message}`, {
      sessionId: req.sessionID,
      user: (req as WithSessionAuth<Request>).session.auth?.id,
      message: err.message,
      stack: err.stack.split('\n'),
    });
    console.error(err);
    res.status(500).send(failure('SERVER_ERROR', 'An unanticipated server error occurred.'));
  }
};

const fallthrough404Handler: RequestHandler = function(req, res) {
  res.status(404).send(failure('NOT_FOUND', 'Not found'));
};
