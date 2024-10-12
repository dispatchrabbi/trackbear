import { Router } from "express";
import winston from "winston";

import { parse, format } from 'date-fns';

import { ApiResponse, success, h, failure } from '../../lib/api-response.ts';
import { requireAdminUser, RequestWithUser } from '../../lib/auth.ts';

import dbClient from "../../lib/db.ts";

const statsRouter = Router();
export default statsRouter;

export type WeeklyStat = {
  weekStart: string;
  count: number;
};

statsRouter.get('/weekly-active-users',
  requireAdminUser,
  h(async (req: RequestWithUser, res: ApiResponse<WeeklyStat[]>) =>
{
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
}));

statsRouter.get('/weekly-logins',
  requireAdminUser,
  h(async (req: RequestWithUser, res: ApiResponse<WeeklyStat[]>) =>
{
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
}));

statsRouter.get('/weekly-tallies',
  requireAdminUser,
  h(async (req: RequestWithUser, res: ApiResponse<WeeklyStat[]>) =>
{
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
}));

statsRouter.get('/weekly-signups',
  requireAdminUser,
  h(async (req: RequestWithUser, res: ApiResponse<WeeklyStat[]>) =>
{
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
}));
