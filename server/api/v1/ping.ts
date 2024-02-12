import { Response, Router } from "express";
import { ApiResponsePayload, success } from 'server/lib/api-response.ts';

const pingRouter = Router();

pingRouter.get('/', (req, res: Response<ApiResponsePayload<'pong'>>) => {
  res.send(success('pong'));
});

export default pingRouter;
