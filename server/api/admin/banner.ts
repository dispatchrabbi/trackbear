import { HTTP_METHODS, ACCESS_LEVEL, type RouteConfig } from 'server/lib/api.ts';
import { type ApiResponse, success, failure } from '../../lib/api-response.ts';
import { type RequestWithUser } from '../../lib/middleware/access.ts';

import { z } from 'zod';
import { zIdParam } from '../../lib/validators.ts';

import { reqCtx } from 'server/lib/request-context.ts';
import { transformPayload } from 'server/lib/transform-payload.ts';
import { BannerModel, type Banner, type BannerData } from 'server/lib/models/banner/banner-model.ts';

export async function handleGetBanners(req: RequestWithUser, res: ApiResponse<Banner[]>) {
  const banners = await BannerModel.getBanners();

  return res.status(200).send(success(banners));
}

export type BannerCreatePayload = {
  message: string;
  enabled?: boolean;
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

export async function handleCreateBanner(req: RequestWithUser, res: ApiResponse<Banner>) {
  const payload = req.body as BannerCreatePayload;

  const created = await BannerModel.createBanner({
    message: payload.message,
    enabled: payload.enabled,
    showUntil: payload.showUntil ? new Date(payload.showUntil) : new Date(),
    icon: payload.icon,
    color: payload.color,
  }, reqCtx(req));

  return res.status(201).send(success(created));
}

export type BannerUpdatePayload = Partial<BannerCreatePayload>;
const zBannerUpdatePayload = zBannerCreatePayload.partial();

export async function handleUpdateBanner(req: RequestWithUser, res: ApiResponse<Banner>) {
  const payload = req.body as BannerUpdatePayload;

  const data: Partial<BannerData> = transformPayload(payload, {
    showUntil: val => val ? new Date(val) : new Date(),
  });

  const updated = await BannerModel.updateBanner(+req.params.id, data, reqCtx(req));
  if(!updated) {
    return res.status(404).send(failure('NOT_FOUND', `Could not find a banner with id ${req.params.id}`));
  }

  return res.status(200).send(success(updated));
}

export async function handleDeleteBanner(req: RequestWithUser, res: ApiResponse<Banner>) {
  const deleted = await BannerModel.deleteBanner(+req.params.id, reqCtx(req));
  if(!deleted) {
    return res.status(404).send(failure('NOT_FOUND', `Could not find a banner with id ${req.params.id}`));
  }

  return res.status(200).send(success(deleted));
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
