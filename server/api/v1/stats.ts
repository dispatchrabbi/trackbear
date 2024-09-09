import { Router } from "express";
import { ApiResponse, success, h } from '../../lib/api-response.ts';

import { requireUser, RequestWithUser } from '../../lib/auth.ts';

import { z } from 'zod';
import { validateQuery } from "../../lib/middleware/validate.ts";

import dbClient from "../../lib/db.ts";
import type { Work, Tally, Tag } from "@prisma/client";
import { WORK_STATE } from '../../lib/models/work.ts';
import { TALLY_STATE, TallyMeasure } from "../../lib/models/tally.ts";

export type WorkWithTotals = Work & { totals: Record<string, number> };

export type TallyWithTags = Tally & { tags: Tag[] };
export type WorkWithTallies = Work & { tallies: TallyWithTags[] };

export type DayCount = {
  date: string;
  counts: Record<TallyMeasure, number>,
};

const statsRouter = Router();
export default statsRouter;

const DATE_STRING_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const zDaysQuery = z.object({
  startDate: z.string().regex(DATE_STRING_REGEX, { message: 'startDate must be a date'}),
  endDate: z.string().regex(DATE_STRING_REGEX, { message: 'endDate must be a date'}),
}).partial();

export type DaysQuery = z.infer<typeof zDaysQuery>;

statsRouter.get('/days',
  requireUser,
  // validateQuery(zDaysQuery), // TODO: allow specifying start and end dates
  h(async (req: RequestWithUser, res: ApiResponse<DayCount[]>) =>
{
  const dateAndMeasureSums = await dbClient.tally.groupBy({
    by: [ 'date', 'measure' ],
    where: {
      ownerId: req.user.id,
      state: TALLY_STATE.ACTIVE,
      work: {
        ownerId: req.user.id,
        state: WORK_STATE.ACTIVE
      },
    },
    _sum: { count: true },
  });
  const dayCounts = Object.values<DayCount>(dateAndMeasureSums.reduce((obj, record) => {
    if(!(record.date in obj)) {
      obj[record.date] = {
        date: record.date,
        counts: {},
      };
    }

    obj[record.date].counts[record.measure] = record._sum.count;
    return obj;
  }, {})).sort((a: { date: string }, b: { date: string }) => a.date < b.date ? -1 : b.date < a.date ? 1 : 0);

  return res.status(200).send(success(dayCounts));
}));
