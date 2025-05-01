import { HTTP_METHODS, ACCESS_LEVEL, type RouteConfig } from 'server/lib/api.ts';
import { ApiResponse, success } from '../../lib/api-response.ts';

import { RequestWithUser } from '../../lib/middleware/access.ts';

import { z } from 'zod';

import type { Work, Tally, Tag } from '@prisma/client';
import { TallyMeasure } from '../../lib/models/tally/consts.ts';
import { getDayCounts } from 'server/lib/models/stats.ts';

export type WorkWithTotals = Work & { totals: Record<string, number> };

export type TallyWithTags = Tally & { tags: Tag[] };
export type WorkWithTallies = Work & { tallies: TallyWithTags[] };

export type DayCount = {
  date: string;
  counts: Record<TallyMeasure, number>;
};

const DATE_STRING_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const zDaysQuery = z.object({
  startDate: z.string().regex(DATE_STRING_REGEX, { message: 'startDate must be a date' }),
  endDate: z.string().regex(DATE_STRING_REGEX, { message: 'endDate must be a date' }),
}).partial();

export type DaysQuery = z.infer<typeof zDaysQuery>;

export async function handleGetDays(req: RequestWithUser, res: ApiResponse<DayCount[]>) {
  const dayCounts = await getDayCounts(req.user.id);

  return res.status(200).send(success(dayCounts));
}

const routes: RouteConfig[] = [
  {
    path: '/days',
    method: HTTP_METHODS.GET,
    handler: handleGetDays,
    accessLevel: ACCESS_LEVEL.USER,
    querySchema: zDaysQuery,
  },
];

export default routes;
