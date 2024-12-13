import { Router } from "express";
import winston from "winston";

import { HTTP_METHODS, ACCESS_LEVEL, type RouteConfig } from "server/lib/api.ts";
import { ApiResponse, success, h } from '../../lib/api-response.ts';
import { requireAdminUser, RequestWithUser } from '../../lib/middleware/access.ts';

import { z } from 'zod';
import { zIdParam } from '../../lib/validators.ts';
import { validateBody, validateParams } from "../../lib/middleware/validate.ts";
import { addDays } from 'date-fns';

import dbClient from "../../lib/db.ts";
import type { Banner } from "@prisma/client";

import { logAuditEvent } from '../../lib/audit-events.ts';

export const bannerRouter = Router();

bannerRouter.get('/',
  requireAdminUser,
  h(handleGetBanners)
);
export async function handleGetBanners(req: RequestWithUser, res: ApiResponse<Banner[]>) {
  const banners = await dbClient.banner.findMany({
    orderBy: { updatedAt: 'asc' },
  });

  return res.status(200).send(success(banners));
}

export type BannerCreatePayload = {
  enabled?: boolean;
  message: string;
  icon?: string;
  color?: string;
  showUntil?: string;
};
const zBannerCreatePayload = z.object({
  enabled: z.boolean().nullable(),
  message: z.string().min(1),
  icon: z.string().min(1).nullable(),
  color: z.enum(['info', 'success', 'warning', 'error']).nullable(),
  showUntil: z.coerce.date().nullable(),
}).strict();

bannerRouter.post('/',
  requireAdminUser,
  validateBody(zBannerCreatePayload),
  h(handleCreateBanner)
);
export async function handleCreateBanner(req: RequestWithUser, res: ApiResponse<Banner>) {
  const user = req.user;
  const payload = req.body as BannerCreatePayload;

  const banner = await dbClient.banner.create({
    data: {
      enabled: payload.enabled || false,
      message: payload.message,
      icon: payload.icon ?? 'campaign',
      color: payload.color ?? 'info',
      showUntil: payload.showUntil ?? addDays(new Date(), 7),
    }
  });

  winston.debug(`Created banner ${banner.id} with message ${banner.message}`);
  await logAuditEvent('banner:create', user.id, banner.id, null, null, req.sessionID);

  return res.status(201).send(success(banner));
}

export type BannerUpdatePayload = Partial<BannerCreatePayload>;
const zBannerUpdatePayload = zBannerCreatePayload.partial();

bannerRouter.patch('/:id',
  requireAdminUser,
  validateParams(zIdParam()),
  validateBody(zBannerUpdatePayload),
  h(handleUpdateBanner)
);
export async function handleUpdateBanner(req: RequestWithUser, res: ApiResponse<Banner>) {
  const user = req.user;
  const payload = req.body as BannerUpdatePayload;

  const banner = await dbClient.banner.update({
    where: {
      id: +req.params.id,
    },
    data: {
      enabled: payload.enabled || false,
      message: payload.message,
      icon: payload.icon ?? 'campaign',
      color: payload.color ?? 'info',
      showUntil: payload.showUntil ?? undefined,
    }
  });

  winston.debug(`Edited banner ${banner.id}`);
  await logAuditEvent('banner:update', user.id, banner.id, null, null, req.sessionID);

  return res.status(200).send(success(banner));
}

bannerRouter.delete('/:id',
  requireAdminUser,
  validateParams(zIdParam()),
  h(handleDeleteBanner)
);
export async function handleDeleteBanner(req: RequestWithUser, res: ApiResponse<Banner>) {
  const user = req.user;

  const banner = await dbClient.banner.delete({
    where: {
      id: +req.params.id,
    }
  });

  await logAuditEvent('banner:delete', user.id, banner.id, null, null, req.sessionID);

  return res.status(200).send(success(banner));
}

const routes: RouteConfig[] = [
  {
    path: '/',
    method: HTTP_METHODS.GET,
    handler: handleGetBanners,
    accessLevel: ACCESS_LEVEL.ADMIN,
  },
  {
    path: '/',
    method: HTTP_METHODS.POST,
    handler: handleCreateBanner,
    accessLevel: ACCESS_LEVEL.ADMIN,
    bodySchema: zBannerCreatePayload,
  },
  {
    path: '/:id',
    method: HTTP_METHODS.PATCH,
    handler: handleUpdateBanner,
    accessLevel: ACCESS_LEVEL.ADMIN,
    paramsSchema: zIdParam(),
    bodySchema: zBannerUpdatePayload,
  },
  {
    path: '/:id',
    method: HTTP_METHODS.DELETE,
    handler: handleDeleteBanner,
    accessLevel: ACCESS_LEVEL.ADMIN,
    paramsSchema: zIdParam(),
  },
];

export default routes;
