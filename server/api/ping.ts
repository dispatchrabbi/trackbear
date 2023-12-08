import { Router } from "express";

const pingRouter = Router();

pingRouter.get('/', (req, res) => {
  res.send('pong');
});

export default pingRouter;
