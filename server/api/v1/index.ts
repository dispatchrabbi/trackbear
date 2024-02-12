import { Router } from "express";
const v1Router = Router();

import pingRouter from './ping.ts';
v1Router.use('/ping', pingRouter);

export default v1Router;
