import { Response, Router } from "express";
import { ApiResponsePayload, success } from '../lib/api-response.ts';
import { HTTP_METHODS, RouteConfig } from "server/lib/api.ts";

export const pingRouter = Router();

pingRouter.get('/', handleGetPing);
export async function handleGetPing(req, res: Response<ApiResponsePayload<'pong'>>) {
  return res.status(200).send(success('pong'));
};

pingRouter.get('/error', handleGetError);
export async function handleGetError(req, res: Response<ApiResponsePayload<'pong'>>) {
  throw new Error('pong');
  return res.status(200).send(success('pong'));
};

const routes: RouteConfig[] = [
  {
    path: '/',
    method: HTTP_METHODS.GET,
    handler: handleGetPing,
  },
  {
    path: '/error',
    method: HTTP_METHODS.GET,
    handler: handleGetError,
  },
];
export default routes;