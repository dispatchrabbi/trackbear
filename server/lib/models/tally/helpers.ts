import type { TallyMeasure } from "./consts";
import type { MeasureCounts } from "./types";

type Counted = {
  measure: TallyMeasure;
  count: number;
};
export function sumTallies(tallies: Counted[], startingBalance: MeasureCounts = {}): MeasureCounts {
  const totals = tallies.reduce((totals, tally) => {
    totals[tally.measure] = (totals[tally.measure] || 0) + tally.count;
    return totals;
  }, { ...startingBalance });

  return totals;
}