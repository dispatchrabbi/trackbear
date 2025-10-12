import { type Response } from 'express';
import { type ApiResponsePayload, success } from '../lib/api-response.ts';
import { ACCESS_LEVEL, HTTP_METHODS, type RouteConfig } from 'server/lib/api.ts';

export async function handleGetPing(req, res: Response<ApiResponsePayload<'pong'>>) {
  return res.status(200).send(success('pong'));
};

export async function handleGetError(req, res: Response<ApiResponsePayload<'pong'>>) {
  throw new Error('pong');
  return res.status(200).send(success('pong'));
};

const routes: RouteConfig[] = [
  {
    path: '/',
    method: HTTP_METHODS.GET,
    handler: handleGetPing,
    accessLevel: ACCESS_LEVEL.PUBLIC,
  },
  {
    path: '/error',
    method: HTTP_METHODS.GET,
    handler: handleGetError,
    accessLevel: ACCESS_LEVEL.PUBLIC,
  },
];
export default routes;
