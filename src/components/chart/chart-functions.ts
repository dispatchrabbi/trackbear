import type { Tally } from 'src/lib/api/tally.ts';

export type TallyPoint = {
  date: string;
  value: number;
}

export type CountedTallyPoint = TallyPoint & {
  count: number;
}

export type AccumulatedTallyPoint = CountedTallyPoint & {
  accumulated: number;
};

export function cmpTallies(a: TallyPoint, b: TallyPoint) {
  return a.date < b.date ? -1 : a.date > b.date ? 1 : 0;
}

export function normalizeTallies(tallies: Tally[]): CountedTallyPoint[] {
  // total all the tallies by day
  const dateTotals = new Map<string, number>();
  for(const tally of tallies) {
    dateTotals.set(tally.date, (dateTotals.get(tally.date) || 0) + tally.count);
  }

  const normalizedTallies = [];
  for(const [ date, value ] of dateTotals) {
    normalizedTallies.push({
      date,
      value,
      count: value,
    });
  }

  return normalizedTallies.sort(cmpTallies);
}

export function accumulateTallies(sortedTallies: TallyPoint[], startingTotal = 0): AccumulatedTallyPoint[] {
  const accumulatedTallies = [];
  let runningTotal = startingTotal;

  for(const tally of sortedTallies) {
    accumulatedTallies.push({
      date: tally.date,
      value: runningTotal + tally.value,
      accumulated: runningTotal + tally.value,
      count: tally.value,
    });

    runningTotal = runningTotal + tally.value;
  }

  return accumulatedTallies;
}
