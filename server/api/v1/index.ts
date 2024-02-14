import { Router } from "express";
const v1Router = Router();

import pingRouter from './ping.ts';
v1Router.use('/ping', pingRouter);

import tagRouter from './tag.ts';
v1Router.use('/tag', tagRouter);

export default v1Router;
