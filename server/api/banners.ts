import { Router, Request } from "express";
import { ApiResponse, success } from '../lib/api-response.ts';

import dbClient from "../lib/db.ts";
import type { Banner as BannerRow } from "@prisma/client";

import { requireUser, WithUser } from "../lib/auth.ts";

export type Banner = Omit<BannerRow, 'id' | 'createdAt' | 'updatedAt'>;

const bannerRouter = Router();

bannerRouter.get('/',
  requireUser,
  async (req: WithUser<Request>, res: ApiResponse<Banner[]>, next) =>
{
  try {
    const now = new Date();
    const banners = await dbClient.banner.findMany({
      where: {
        enabled: true,
        showUntil: { gte: now },
      },
      orderBy: { updatedAt: 'asc' },
    });

    return res.status(200).send(success(banners));
  } catch(err) { return next(err); }
});

export default bannerRouter;
