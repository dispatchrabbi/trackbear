import { Request, ErrorRequestHandler, RequestHandler, Application } from "express";
import type { WithSessionAuth } from 'server/lib/auth.ts';
import { ApiResponse, failure } from "server/lib/api-response.ts";
import { mountEndpoints, prefixRoutes, type RouteConfig } from "server/lib/api.ts";

import winston from "winston";

import authRoutes from './auth.ts';
import bannersRoutes from './banners.ts';
import infoRoutes from './info.ts';
import pingRoutes from './ping.ts';

import adminRoutes from './admin/index.ts';
import v1Routes from "./v1/index.ts";

const apiRoutes: RouteConfig[] = [
  ...prefixRoutes('/auth', authRoutes),
  ...prefixRoutes('/banners', bannersRoutes),
  ...prefixRoutes('/info', infoRoutes),
  ...prefixRoutes('/ping', pingRoutes),
  ...prefixRoutes('/admin', adminRoutes),
  ...prefixRoutes('/v1', v1Routes),
];

export function mountApiEndpoints(app: Application) {
  app.use('/api', logApiRequest);

  mountEndpoints(app, prefixRoutes('/api', apiRoutes));

  app.use('/api', lastChanceApiErrorHandler);

  app.all('/api/*', fallthrough404Handler);
}

const logApiRequest: RequestHandler = function(req, res, next) {
  winston.info(`${req.method} ${req.originalUrl}`, { sessionId: req.sessionID, user: (req as WithSessionAuth<Request>).session.auth?.id });
  next();
}

// handle any API errors
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const lastChanceApiErrorHandler: ErrorRequestHandler = (err, req, res: ApiResponse<never>, next) => {
  if(err) {
    winston.error(`${req.method} ${req.originalUrl}: ${err.message}`, {
      sessionId: req.sessionID,
      user: (req as WithSessionAuth<Request>).session.auth?.id,
      message: err.message,
      stack: err.stack.split('\n'),
    });
    console.error(err);
    res.status(500).send(failure('SERVER_ERROR', 'An unanticipated server error occurred.'));
  }
};

const fallthrough404Handler: RequestHandler = function (req, res) {
  res.status(404).send(failure('NOT_FOUND', 'Not found'));
}
