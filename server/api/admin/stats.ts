import { parse, format } from 'date-fns';

import { ACCESS_LEVEL, HTTP_METHODS, type RouteConfig } from 'server/lib/api.ts';
import { ApiResponse, success } from '../../lib/api-response.ts';
import { RequestWithUser } from '../../lib/middleware/access.ts';

import dbClient from '../../lib/db.ts';

export type WeeklyStat = {
  weekStart: string;
  count: number;
};

export type DailyStat = {
  date: string;
  count: number;
};

export async function handleGetWeeklyActiveUsers(req: RequestWithUser, res: ApiResponse<WeeklyStat[]>) {
  const results: { weekNumber: string; activeUsers: number }[] = await dbClient.$queryRaw`
SELECT
	EXTRACT(ISOYEAR FROM "createdAt") || '-' || lpad(EXTRACT(WEEK FROM "createdAt")::text, 2, '0') AS "weekNumber",
	COUNT(DISTINCT "agentId") AS "activeUsers"
FROM public."AuditEvent"
GROUP BY "weekNumber"
;
  `;

  const now = new Date();
  const activeUsersByWeek = results.map(({ weekNumber, activeUsers }) => {
    const weekStart = format(parse(weekNumber, 'R-II', now), 'y-MM-dd');

    return { weekStart, count: Number(activeUsers) };
  });

  return res.status(200).send(success(activeUsersByWeek));
}

export async function handleGetDailyActiveUsers(req: RequestWithUser, res: ApiResponse<DailyStat[]>) {
  const results: { date: string; activeUsers: number }[] = await dbClient.$queryRaw`
SELECT
	EXTRACT(ISOYEAR FROM "createdAt") || '-' || lpad(EXTRACT(MONTH FROM "createdAt")::text, 2, '0') || '-' || lpad(EXTRACT(DAY FROM "createdAt")::text, 2, '0') AS "date",
	COUNT(DISTINCT "agentId") AS "activeUsers"
FROM public."AuditEvent"
GROUP BY "date"
;
  `;

  const activeUsersByDay = results.map(({ date, activeUsers }) => ({ date, count: Number(activeUsers) }));

  return res.status(200).send(success(activeUsersByDay));
};

export async function handleGetWeeklyLogins(req: RequestWithUser, res: ApiResponse<WeeklyStat[]>) {
  const results: { weekNumber: string; activeUsers: number }[] = await dbClient.$queryRaw`
SELECT
	EXTRACT(ISOYEAR FROM "createdAt") || '-' || lpad(EXTRACT(WEEK FROM "createdAt")::text, 2, '0') AS "weekNumber",
	COUNT(DISTINCT "agentId") AS "activeUsers"
FROM public."AuditEvent"
WHERE "eventType" = 'user:login'
GROUP BY "weekNumber"
;
  `;

  const now = new Date();
  const activeUsersByWeek = results.map(({ weekNumber, activeUsers }) => {
    const weekStart = format(parse(weekNumber, 'R-II', now), 'y-MM-dd');

    return { weekStart, count: Number(activeUsers) };
  });

  return res.status(200).send(success(activeUsersByWeek));
}

export async function handleGetWeeklyTallies(req: RequestWithUser, res: ApiResponse<WeeklyStat[]>) {
  const results: { weekNumber: string; activeUsers: number }[] = await dbClient.$queryRaw`
SELECT
	EXTRACT(ISOYEAR FROM "createdAt") || '-' || lpad(EXTRACT(WEEK FROM "createdAt")::text, 2, '0') AS "weekNumber",
	COUNT(DISTINCT "agentId") AS "activeUsers"
FROM public."AuditEvent"
WHERE "eventType" = 'tally:create'
GROUP BY "weekNumber"
;
  `;

  const now = new Date();
  const activeUsersByWeek = results.map(({ weekNumber, activeUsers }) => {
    const weekStart = format(parse(weekNumber, 'R-II', now), 'y-MM-dd');

    return { weekStart, count: Number(activeUsers) };
  });

  return res.status(200).send(success(activeUsersByWeek));
}

export async function handleGetWeeklySignups(req: RequestWithUser, res: ApiResponse<WeeklyStat[]>) {
  const results: { weekNumber: string; signups: number }[] = await dbClient.$queryRaw`
SELECT
	EXTRACT(ISOYEAR FROM "createdAt") || '-' || lpad(EXTRACT(WEEK FROM "createdAt")::text, 2, '0') AS "weekNumber",
	COUNT(DISTINCT "agentId") AS "signups"
FROM public."AuditEvent"
WHERE "eventType" = 'user:signup'
GROUP BY "weekNumber"
;
  `;

  const now = new Date();
  const signupsByWeek = results.map(({ weekNumber, signups }) => {
    const weekStart = format(parse(weekNumber, 'R-II', now), 'y-MM-dd');

    return { weekStart, count: Number(signups) };
  });

  return res.status(200).send(success(signupsByWeek));
}

export async function handleGetDailySignups(req: RequestWithUser, res: ApiResponse<DailyStat[]>) {
  const results: { date: string; signups: number }[] = await dbClient.$queryRaw`
SELECT
	EXTRACT(ISOYEAR FROM "createdAt") || '-' || lpad(EXTRACT(MONTH FROM "createdAt")::text, 2, '0') || '-' || lpad(EXTRACT(DAY FROM "createdAt")::text, 2, '0') AS "date",
  COUNT(DISTINCT "agentId") AS "signups"
FROM public."AuditEvent"
WHERE "eventType" = 'user:signup'
GROUP BY "date"
;
  `;

  const signupsByDay = results.map(({ date, signups }) => ({ date, count: Number(signups) }));

  return res.status(200).send(success(signupsByDay));
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
    path: '/weekly-logins',
    method: HTTP_METHODS.GET,
    handler: handleGetWeeklyLogins,
    accessLevel: ACCESS_LEVEL.ADMIN,
  },
  {
    path: '/weekly-tallies',
    method: HTTP_METHODS.GET,
    handler: handleGetWeeklyTallies,
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
];

export default routes;
