import type { MeasureRecord } from "server/lib/models/tally/types";
import type { DayCount } from "src/lib/api/stats.ts";

export type DailyStats = {
  days: MeasureRecord<number>;
  totals: MeasureRecord<number>;
  averages: MeasureRecord<number>;
  mostProductiveDays: MeasureRecord<{ date: string; count: number; }>;
};
export function calculateDailyStats(dayCounts: DayCount[]): DailyStats {
    const days = {};
    const totals = {};
    const mostProductiveDays = {};

  for(const dayCount of dayCounts) {
    for(const measure of Object.keys(dayCount.counts)) {
      // add a tally mark to days
      if(!(measure in days)) {
        days[measure] = 0;
      }
      days[measure] += 1;

      // add the count to totals
      if(!(measure in totals)) {
        totals[measure] = 0;
      }
      totals[measure] += dayCount.counts[measure];

      // check if this is the most productive day so far
      if(!(measure in mostProductiveDays)) {
        mostProductiveDays[measure] = {
          date: dayCount.date,
          count: dayCount.counts[measure],
        };
      } else {
        if(dayCount.counts[measure] > mostProductiveDays[measure].count) {
          mostProductiveDays[measure] = {
            date: dayCount.date,
            count: dayCount.counts[measure],
          };
        }
      }
    }
  }

  const averages = Object.keys(days).reduce((avgs, measure) => {
    avgs[measure] = days[measure] ? totals[measure] / days[measure] : 0;
    return avgs;
  }, {});

  return {
    days,
    totals,
    averages,
    mostProductiveDays
  };
}
