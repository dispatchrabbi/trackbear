import { Router } from "express";
import { ApiResponse, success, h } from '../../lib/api-response.ts';

import dbClient from "../../lib/db.ts";
import type { AdminPerms } from "@prisma/client";

import { requireAdminUser, RequestWithUser } from "../../lib/auth.ts";

const meRouter = Router();

// GET /admin/me/perms - get your own user information
meRouter.get('/perms',
  requireAdminUser,
  h(async (req: RequestWithUser, res: ApiResponse<AdminPerms>) =>
{
  const adminPerms = await dbClient.adminPerms.findUnique({
    where: {
      userId: req.user.id,
    },
  });

  return res.status(200).send(success(adminPerms));
}));

export default meRouter;
