import { Router, Request } from "express";
import { ApiResponse, success } from '../lib/api-response.ts';

import type { Banner as PrismaBanner } from "@prisma/client";
import { getActiveBanners } from "server/lib/models/banner.ts";

export type Banner = Omit<PrismaBanner, 'id' | 'createdAt' | 'updatedAt'>;

const bannerRouter = Router();
export default bannerRouter;

bannerRouter.get('/', handleGetBanners);
export async function handleGetBanners(req: Request, res: ApiResponse<Banner[]>, next) {
  try {
    const banners = await getActiveBanners();
    return res.status(200).send(success(banners));
  } catch(err) { return next(err); }
};
