import { getDbClient } from 'server/lib/db.ts';
import { PROJECT_STATE } from './project/consts.ts';
import { TALLY_STATE } from './tally/consts.ts';
import { MeasureCounts } from './tally/types.ts';

export type DayCount = {
  date: string;
  counts: MeasureCounts;
};

export async function getDayCounts(userId: number, startDate?: string, endDate?: string): Promise<DayCount[]> {
  const dateFilter: { gte?: string; lte?: string } | undefined = (startDate || endDate) ? {} : undefined;
  if(startDate) {
    dateFilter!.gte = startDate;
  }
  if(endDate) {
    dateFilter!.lte = endDate;
  }

  const db = getDbClient();
  const dateAndMeasureSums = await db.tally.groupBy({
    by: ['date', 'measure'],
    where: {
      ownerId: userId,
      state: TALLY_STATE.ACTIVE,
      work: {
        ownerId: userId,
        state: PROJECT_STATE.ACTIVE,
      },
      date: dateFilter,
    },
    _sum: { count: true },
  });

  const dayCounts = Object.values<DayCount>(dateAndMeasureSums
    .reduce((obj, record) => {
      if(!(record.date in obj)) {
        obj[record.date] = {
          date: record.date,
          counts: {},
        };
      }

      obj[record.date].counts[record.measure] = record._sum.count;
      return obj;
    }, {}))
    .sort((a: { date: string }, b: { date: string }) => a.date < b.date ? -1 : b.date < a.date ? 1 : 0);

  return dayCounts;
}
