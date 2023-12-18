import { Response, Router } from "express";
import { ApiResponsePayload, success } from './common.ts';

const pingRouter = Router();

pingRouter.get('/', (req, res: Response<ApiResponsePayload<'pong'>>) => {
  res.send(success('pong'));
});

export default pingRouter;
