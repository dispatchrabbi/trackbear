import { Router } from "express";
import winston from "winston";

import { parse, format } from 'date-fns';

import { ApiResponse, success, h, failure } from '../../lib/api-response.ts';
import { requireAdminUser, RequestWithUser } from '../../lib/auth.ts';

import dbClient from "../../lib/db.ts";
import { getActiveUsersByWeek } from '@prisma/client/sql';

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
  const results = await dbClient.$queryRawTyped(getActiveUsersByWeek());

  const now = new Date();
  const activeUsersByWeek = results.map(({ weekNumber, activeUsers }) => {
    const weekStart = format(parse(weekNumber, 'R-II', now), 'y-MM-dd');

    return { weekStart, count: Number(activeUsers) };
  });

  return res.status(200).send(success(activeUsersByWeek));
}));
