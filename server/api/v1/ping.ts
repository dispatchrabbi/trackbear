import { Router, Request } from "express";
import { ApiResponse, success, h } from '../../lib/api-response.ts';

const pingRouter = Router();
export default pingRouter;

pingRouter.get('/',
  h(handleGetPing)
);
export async function handleGetPing(req: Request, res: ApiResponse<'pong'>) {
  return res.status(200).send(success('pong'));
}
