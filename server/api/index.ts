import { Router } from "express";

import pingRouter from './ping.js';

const apiRouter = Router();

apiRouter.use('/ping', pingRouter);

export default apiRouter;
