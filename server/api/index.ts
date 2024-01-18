import { Router, Request, ErrorRequestHandler } from "express";
import type { WithSessionAuth } from '../lib/auth.ts';
import { ApiResponse, failure } from "../lib/api-response.ts";

import winston from "winston";

import pingRouter from './ping.ts';
import infoRouter from './info.ts';
import authRouter from './auth.ts';
import userRouter from './user.ts';
import bannersRouter from './banners.ts';
import projectsRouter from './projects.ts';
import leaderboardsRouter from './leaderboards.ts';
import shareRouter from './share.ts';

const apiRouter = Router();

apiRouter.use((req, res, next) => {
  winston.info(`${req.method} ${req.originalUrl}`, { sessionId: req.sessionID, user: (req as WithSessionAuth<Request>).session.auth?.id });
  next();
});

apiRouter.use('/ping', pingRouter);
apiRouter.use('/info', infoRouter);
apiRouter.use('/auth', authRouter);
apiRouter.use('/user', userRouter);
apiRouter.use('/banners', bannersRouter);
apiRouter.use('/projects', projectsRouter);
apiRouter.use('/leaderboards', leaderboardsRouter);
apiRouter.use('/share', shareRouter);

// handle any API errors
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const lastChanceApiErrorHandler: ErrorRequestHandler = (err, req, res: ApiResponse<never>, next) => {
  if(err) {
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
