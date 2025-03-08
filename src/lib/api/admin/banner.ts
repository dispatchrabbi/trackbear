import { callApiV1, RoundTrip } from "src/lib/api";

import type { Banner as PrismaBanner } from "@prisma/client";
import { BannerCreatePayload, BannerUpdatePayload } from "server/api/admin/banner.ts";

export type Banner = RoundTrip<PrismaBanner>;
export type { BannerCreatePayload, BannerUpdatePayload };

const ENDPOINT = '/api/admin/banner';

export async function getBanners() {
  return callApiV1<Banner[]>(ENDPOINT, 'GET');
}

export async function createBanner(data: BannerCreatePayload) {
  return callApiV1<Banner>(ENDPOINT, 'POST', data);
}

export async function updateBanner(id: number, data: BannerUpdatePayload) {
  return callApiV1<Banner>(ENDPOINT + `/${id}`, 'PATCH', data);
}

export async function deleteBanner(id: number) {
  return callApiV1<Banner>(ENDPOINT + `/${id}`, 'DELETE');
}
