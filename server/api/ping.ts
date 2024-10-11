import { Response, Router } from "express";
import { ApiResponsePayload, success } from '../lib/api-response.ts';

const pingRouter = Router();
export default pingRouter;

export function handleGetPing(req, res: Response<ApiResponsePayload<'pong'>>) {
  res.status(200).send(success('pong'));
};
pingRouter.get('/', handleGetPing);

export function handleGetError(req, res: Response<ApiResponsePayload<'pong'>>) {
  throw new Error('pong');
};
pingRouter.get('/error', handleGetError);
