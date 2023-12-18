import { Router } from "express";
import type { RequestWithSessionAuth } from '../lib/auth.ts';

import winston from "winston";

import pingRouter from './ping.ts';
import authRouter from './auth.ts';
import projectsRouter from './projects.ts';
import { ApiResponse, failure } from "./common.ts";

const apiRouter = Router();

apiRouter.use((req, res, next) => {
  winston.info(`${req.method} ${req.originalUrl}`, { sessionId: req.sessionID, user: (req as RequestWithSessionAuth).session.auth?.id });
  next();
});

apiRouter.use('/ping', pingRouter);
apiRouter.use('/auth', authRouter);
apiRouter.use('/projects', projectsRouter);

// handle any API errors
// eslint-disable-next-line @typescript-eslint/no-unused-vars
apiRouter.use((err, req, res: ApiResponse<never>, next) => {
  console.error(err);
  res.status(500).send(failure('SERVER_ERROR', 'An unanticipated server error occurred.'));
});

export default apiRouter;
