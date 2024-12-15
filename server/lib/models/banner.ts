import { addDays } from "date-fns";

import dbClient from "../db.ts";
import { type Banner } from "@prisma/client";

import { type RequestContext } from "../request-context.ts";
import { buildChangeRecord, logAuditEvent } from '../../lib/audit-events.ts';
import { AUDIT_EVENT_TYPE } from '../../lib/models/audit-events.ts';
import { RecordNotFoundError } from "./errors.ts";

import { traced } from "../tracer.ts";

export type { Banner };
export type BannerData = {
  message: string;
  enabled?: boolean;
  showUntil?: Date;
  icon?: string;
  color?: string;
};

export class BannerModel {

  @traced
  static async getBanners(): Promise<Banner[]> {
    const banners = await dbClient.banner.findMany({
      orderBy: { updatedAt: 'asc' },
    });

    return banners;
  }

  @traced
  static async getActiveBanners(): Promise<Banner[]> {
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

  @traced
  static async getBanner(id: number): Promise<Banner> {
    const banner: Banner = await dbClient.banner.findUnique({
      where: { id }
    });

    if(!banner) {
      throw new RecordNotFoundError('banner', id);
    }

    return banner;
  }

  @traced
  static async createBanner(data: BannerData, reqCtx: RequestContext): Promise<Banner> {
    const dataWithDefaults: Required<BannerData> = Object.assign({
      enabled: false,
      showUntil: addDays(new Date(), 7),
      icon: 'campaign',
      color: 'info'
    }, data);

    const created = await dbClient.banner.create({
      data: dataWithDefaults
    });

    const changes = buildChangeRecord({}, created);
    await logAuditEvent(AUDIT_EVENT_TYPE.BANNER_CREATE, reqCtx.userId, created.id, null, changes, reqCtx.sessionId);

    return created;
  }

  @traced
  static async updateBanner(id: number, data: Partial<BannerData>, reqCtx: RequestContext): Promise<Banner> {
    const original = await BannerModel.getBanner(id);

    const updated = await dbClient.banner.update({
      where: { id },
      data: { ...data },
    });

    const changes = buildChangeRecord(original, updated);
    await logAuditEvent(AUDIT_EVENT_TYPE.BANNER_UPDATE, reqCtx.userId, updated.id, null, changes, reqCtx.sessionId);

    return updated;
  }

  @traced
  static async deleteBanner(id: number, reqCtx: RequestContext): Promise<Banner> {
    const deleted = await dbClient.banner.delete({ where: { id } });

    await logAuditEvent(AUDIT_EVENT_TYPE.BANNER_DELETE, reqCtx.userId, deleted.id, null, null, reqCtx.sessionId);

    return deleted;
  }

}