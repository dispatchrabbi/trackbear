import { Router, Request } from "express";
import { ApiResponse, success, h } from '../lib/api-response.ts';

import type { Banner as PrismaBanner } from "@prisma/client";
import { getActiveBanners } from "server/lib/models/banner.ts";
import { HTTP_METHODS, RouteConfig } from "server/lib/api.ts";

export type Banner = Omit<PrismaBanner, 'id' | 'createdAt' | 'updatedAt'>;

export const bannersRouter = Router();

bannersRouter.get('/', h(handleGetBanners));
export async function handleGetBanners(req: Request, res: ApiResponse<Banner[]>) {
  const banners = await getActiveBanners();
  return res.status(200).send(success(banners));
};

const routes: RouteConfig[] = [
  {
    path: '/',
    method: HTTP_METHODS.GET,
    handler: handleGetBanners,
  },
];
export default routes;