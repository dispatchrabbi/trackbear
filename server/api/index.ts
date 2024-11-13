import { Router, Request, ErrorRequestHandler } from "express";
import type { WithSessionAuth } from 'server/lib/auth.ts';
import { ApiResponse, failure } from "server/lib/api-response.ts";
import { mountEndpoints, prefixRoutes } from "server/lib/api.ts";

import winston from "winston";

import authRoutes from './auth.ts';
import bannersRoutes from './banners.ts';
import infoRoutes from './info.ts';
import pingRoutes from './ping.ts';

import adminRoutes from './admin/index.ts';
import v1Router from "./v1/index.ts";

const apiRouter = Router();

apiRouter.use((req, res, next) => {
  winston.info(`${req.method} ${req.originalUrl}`, { sessionId: req.sessionID, user: (req as WithSessionAuth<Request>).session.auth?.id });
  next();
});

mountEndpoints(apiRouter, prefixRoutes('/auth', authRoutes));
mountEndpoints(apiRouter, prefixRoutes('/banners', bannersRoutes));
mountEndpoints(apiRouter, prefixRoutes('/info', infoRoutes));
mountEndpoints(apiRouter, prefixRoutes('/ping', pingRoutes));

mountEndpoints(apiRouter, prefixRoutes('/admin', adminRoutes));

apiRouter.use('/v1', v1Router);

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
apiRouter.use(lastChanceApiErrorHandler);

// fall-through 404 for api routes
apiRouter.all('*', (req, res) => {
  res.status(404).send(failure('NOT_FOUND', 'Not found'));
});

export default apiRouter;
