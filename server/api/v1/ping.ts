import { Request } from 'express';
import { HTTP_METHODS, ACCESS_LEVEL, type RouteConfig } from 'server/lib/api.ts';
import { ApiResponse, success } from '../../lib/api-response.ts';

export async function handleGetPing(req: Request, res: ApiResponse<'pong'>) {
  return res.status(200).send(success('pong'));
}

const routes: RouteConfig[] = [
  {
    path: '/',
    method: HTTP_METHODS.GET,
    handler: handleGetPing,
    accessLevel: ACCESS_LEVEL.PUBLIC,
  },
  {
    path: '/api-token',
    method: HTTP_METHODS.GET,
    handler: handleGetPing,
    accessLevel: ACCESS_LEVEL.API_KEY,
  },
];

export default routes;
