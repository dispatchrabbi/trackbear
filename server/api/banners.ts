import { Request } from "express";
import { ApiResponse, success } from '../lib/api-response.ts';

import type { Banner as PrismaBanner } from "@prisma/client";
import { getActiveBanners } from "server/lib/models/banner.ts";
import { HTTP_METHODS, ACCESS_LEVEL, RouteConfig } from "server/lib/api.ts";

export type Banner = Omit<PrismaBanner, 'id' | 'createdAt' | 'updatedAt'>;

export async function handleGetBanners(req: Request, res: ApiResponse<Banner[]>) {
  const banners = await getActiveBanners();
  return res.status(200).send(success(banners));
};

const routes: RouteConfig[] = [
  {
    path: '/',
    method: HTTP_METHODS.GET,
    handler: handleGetBanners,
    accessLevel: ACCESS_LEVEL.PUBLIC,
  },
];
export default routes;