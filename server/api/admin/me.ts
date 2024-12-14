import { ApiResponse, success } from '../../lib/api-response.ts';
import { HTTP_METHODS, ACCESS_LEVEL, RouteConfig } from "server/lib/api.ts";

import { type RequestWithUser } from "../../lib/middleware/access.ts";
import { type AdminPerms, AdminPermsModel } from 'server/lib/models/admin-perms.ts';


export async function handleGetPerms(req: RequestWithUser, res: ApiResponse<AdminPerms>) {
  const adminPerms = await AdminPermsModel.getAdminPerms(req.user.id);

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
