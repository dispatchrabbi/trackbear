import { Router } from "express";

import pingRouter from './ping.ts';
import authRouter from './auth.ts';
import userRouter from './user.ts';

const apiRouter = Router();

apiRouter.use('/ping', pingRouter);
apiRouter.use('/auth', authRouter);
apiRouter.use('/user', userRouter);

export default apiRouter;
