import { prefixRoutes, type RouteConfig } from "server/lib/api.ts";

import pingRoutes from './ping.ts';
import meRoutes from './me.ts';
import bannerRoutes from './banner.ts';
import statsRoutes from './stats.ts';
import userRoutes from './user.ts';

const adminRoutes: RouteConfig[] = [
  ...prefixRoutes('/ping', pingRoutes),
  ...prefixRoutes('/me', meRoutes),
  ...prefixRoutes('/banner', bannerRoutes),
  ...prefixRoutes('/stats', statsRoutes),
  ...prefixRoutes('/user', userRoutes),
];

export default adminRoutes;