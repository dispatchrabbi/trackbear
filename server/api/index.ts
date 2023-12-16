import { Router } from "express";
import type { RequestWithSessionAuth } from '../lib/auth.ts';

import winston from "winston";

import pingRouter from './ping.ts';
import authRouter from './auth.ts';
import userRouter from './user.ts';
import projectsRouter from './projects.ts';

const apiRouter = Router();

apiRouter.use((req, res, next) => {
  winston.info(`${req.method} ${req.originalUrl}`, { sessionId: req.sessionID, user: (req as RequestWithSessionAuth).session.auth?.id });
  next();
});

apiRouter.use('/ping', pingRouter);
apiRouter.use('/auth', authRouter);
apiRouter.use('/user', userRouter);
apiRouter.use('/projects', projectsRouter);

export default apiRouter;
