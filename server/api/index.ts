import { Router, Request, ErrorRequestHandler } from "express";
import type { WithSessionAuth } from 'server/lib/auth.ts';
import { ApiResponse, failure } from "server/lib/api-response.ts";

import winston from "winston";

import authRouter from './auth.ts';
import bannersRouter from './banners.ts';
import infoRouter from './info.ts';
import pingRouter from './ping.ts';

import adminRouter from './admin/index.ts';
import v1Router from "./v1/index.ts";

const apiRouter = Router();

apiRouter.use((req, res, next) => {
  winston.info(`${req.method} ${req.originalUrl}`, { sessionId: req.sessionID, user: (req as WithSessionAuth<Request>).session.auth?.id });
  next();
});

apiRouter.use('/auth', authRouter);
apiRouter.use('/banners', bannersRouter);
apiRouter.use('/info', infoRouter);
apiRouter.use('/ping', pingRouter);

apiRouter.use('/admin', adminRouter);
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
