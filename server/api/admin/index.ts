import { Router } from "express";
const adminRouter = Router();

import pingRouter from './ping.ts';
adminRouter.use('/ping', pingRouter);

import meRouter from './me.ts';
adminRouter.use('/me', meRouter);

import bannerRouter from './banner.ts';
adminRouter.use('/banner', bannerRouter);

import statsRouter from './stats.ts';
adminRouter.use('/stats', statsRouter);

import userRouter from './user.ts';
adminRouter.use('/user', userRouter);

export default adminRouter;
