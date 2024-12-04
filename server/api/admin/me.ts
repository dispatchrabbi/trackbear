import { Router } from "express";
import { ApiResponse, success, h } from '../../lib/api-response.ts';
import { HTTP_METHODS, ACCESS_LEVEL, RouteConfig } from "server/lib/api.ts";

import dbClient from "../../lib/db.ts";
import type { AdminPerms } from "@prisma/client";

import { requireAdminUser, type RequestWithUser } from "../../lib/middleware/access.ts";

export const meRouter = Router();

// GET /admin/me/perms - get your own user information
meRouter.get('/perms',
  requireAdminUser,
  h(handleGetPerms)
);
export async function handleGetPerms(req: RequestWithUser, res: ApiResponse<AdminPerms>) {
  const adminPerms = await dbClient.adminPerms.findUnique({
    where: {
      userId: req.user.id,
    },
  });

  return res.status(200).send(success(adminPerms));
}

const routes: RouteConfig[] = [
  {
    path: '/perms',
    method: HTTP_METHODS.GET,
    handler: handleGetPerms,
    accessLevel: ACCESS_LEVEL.ADMIN,
  },
];

export default routes;
