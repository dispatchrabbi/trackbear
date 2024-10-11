import { Banner } from "@prisma/client";
import dbClient from "../db.ts";

export async function getActiveBanners(): Promise<Banner[]> {
  const now = new Date();
  const banners = await dbClient.banner.findMany({
    where: {
      enabled: true,
      showUntil: { gte: now },
    },
    orderBy: { updatedAt: 'asc' },
  });

  return banners;
}