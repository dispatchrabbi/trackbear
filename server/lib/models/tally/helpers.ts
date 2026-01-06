import type { TallyMeasure } from './consts';
import type { PlainTally, Tally, MeasureCounts } from './types';

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

export type PrismaTallyWithTagIds = PlainTally & {
  tags: {
    id: number;
  }[];
};
export function db2tally(from: PrismaTallyWithTagIds | null): Tally | null {
  if(from === null) {
    return null;
  }

  return {
    ...from,
    tagIds: from.tags.map(tag => tag.id),
  };
}
