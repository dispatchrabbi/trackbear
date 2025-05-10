import { ACCESS_LEVEL, HTTP_METHODS, type RouteConfig } from 'server/lib/api.ts';
import { ApiResponse, success } from '../../lib/api-response.ts';
import { RequestWithUser } from '../../lib/middleware/access.ts';

import { ServiceStatsModel, type WeeklyStat, type DailyStat, type UserStats } from 'server/lib/models/service-stats/service-stats-model.ts';

export type { WeeklyStat, DailyStat, UserStats };

export async function handleGetWeeklyActiveUsers(req: RequestWithUser, res: ApiResponse<WeeklyStat[]>) {
  const activeUsersByWeek = await ServiceStatsModel.getWeeklyUsers();

  return res.status(200).send(success(activeUsersByWeek));
}

export async function handleGetDailyActiveUsers(req: RequestWithUser, res: ApiResponse<DailyStat[]>) {
  const activeUsersByDay = await ServiceStatsModel.getDailyUsers();

  return res.status(200).send(success(activeUsersByDay));
};

export async function handleGetWeeklySignups(req: RequestWithUser, res: ApiResponse<WeeklyStat[]>) {
  const signupsByWeek = await ServiceStatsModel.getWeeklySignups();

  return res.status(200).send(success(signupsByWeek));
}

export async function handleGetDailySignups(req: RequestWithUser, res: ApiResponse<DailyStat[]>) {
  const signupsByDay = await ServiceStatsModel.getDailySignups();

  return res.status(200).send(success(signupsByDay));
}

export async function handleGetUserStats(req: RequestWithUser, res: ApiResponse<UserStats>) {
  const userStats = await ServiceStatsModel.getUserStats();

  return res.status(200).send(success(userStats));
}

const routes: RouteConfig[] = [
  {
    path: '/weekly-active-users',
    method: HTTP_METHODS.GET,
    handler: handleGetWeeklyActiveUsers,
    accessLevel: ACCESS_LEVEL.ADMIN,
  },
  {
    path: '/daily-active-users',
    method: HTTP_METHODS.GET,
    handler: handleGetDailyActiveUsers,
    accessLevel: ACCESS_LEVEL.ADMIN,
  },
  {
    path: '/weekly-signups',
    method: HTTP_METHODS.GET,
    handler: handleGetWeeklySignups,
    accessLevel: ACCESS_LEVEL.ADMIN,
  },
  {
    path: '/daily-signups',
    method: HTTP_METHODS.GET,
    handler: handleGetDailySignups,
    accessLevel: ACCESS_LEVEL.ADMIN,
  },
  {
    path: '/user-stats',
    method: HTTP_METHODS.GET,
    handler: handleGetUserStats,
    accessLevel: ACCESS_LEVEL.ADMIN,
  },
];

export default routes;
