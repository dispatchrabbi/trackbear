import { callApiV1, RoundTrip } from "src/lib/api/api.ts";

import type { Banner as PrismaBanner } from "@prisma/client";
import { BannerPayload } from "server/api/admin/banner.ts";

export type Banner = RoundTrip<PrismaBanner>;
export type { BannerPayload };

const ENDPOINT = '/api/admin/banner';

export async function getBanners() {
  return callApiV1<Banner[]>(ENDPOINT, 'GET');
}

export async function createBanner(data: BannerPayload) {
  return callApiV1<Banner>(ENDPOINT, 'POST', data);
}

export async function updateBanner(id: number, data: BannerPayload) {
  return callApiV1<Banner>(ENDPOINT + `/${id}`, 'PUT', data);
}

export async function deleteBanner(id: number) {
  return callApiV1<Banner>(ENDPOINT + `/${id}`, 'DELETE');
}
