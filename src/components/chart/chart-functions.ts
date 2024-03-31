import { addDays, eachDayOfInterval } from "date-fns";
import { formatDate, parseDateString, maxDateStr } from "src/lib/date.ts";

import type { Tally } from 'src/lib/api/tally.ts';
import { TALLY_MEASURE_INFO } from "src/lib/tally.ts";

export interface TallyPoint {
  date: string;
  value: number;
}

export interface CountedTallyPoint extends TallyPoint {
  count: number;
}

export interface AccumulatedTallyPoint extends CountedTallyPoint {
  accumulated: number;
}

export interface CompiledTallyPoint {
  date: string;
  count: {
    [measure in keyof typeof TALLY_MEASURE_INFO]: number;
  };
  total: {
    [measure in keyof typeof TALLY_MEASURE_INFO]: number;
  };
}

export function cmpTallies(a: TallyPoint | Tally, b: TallyPoint | Tally) {
  return a.date < b.date ? -1 : a.date > b.date ? 1 : 0;
}

export function compileTallies(tallies: Tally[], overrideStartDate: string = null, overrideEndDate: string = null): CompiledTallyPoint[] {
  const sortedTallies = tallies.toSorted(cmpTallies);
  const bounds = determineDateBounds(
    overrideStartDate, overrideEndDate,
    sortedTallies[0]?.date, sortedTallies[sortedTallies.length - 1]?.date
  );

  // first populate the base object and the counts (totals come later)
  const eachDay = eachDayOfInterval({ start: parseDateString(bounds.start), end: parseDateString(bounds.end) }).map(d => formatDate(d));
  const compiledPoints: CompiledTallyPoint[] = eachDay.map(date => {
    const base = {
      date,
      count: Object.keys(TALLY_MEASURE_INFO).reduce((obj, measure) => { obj[measure] = 0; return obj; }, {}),
      total: Object.keys(TALLY_MEASURE_INFO).reduce((obj, measure) => { obj[measure] = 0; return obj; }, {}),
    };

    const todayTallies = sortedTallies.filter(tally => tally.date === date);
    for(const tally of todayTallies) {
      base.count[tally.measure] += tally.count;
    }

    return base;
  });

  // now go through and accumulate the totals
  for(let i = 0; i < compiledPoints.length; ++i) {
    for(const measure of Object.keys(compiledPoints[i].total)) {
      compiledPoints[i].total[measure] = compiledPoints[i].count[measure] + (i > 0 ? compiledPoints[i-1].total[measure] : 0);
    }
  }

  return compiledPoints;
}
function determineDateBounds(
  overrideStartDate?: string, overrideEndDate?: string,
  firstTallyDate?: string, lastTallyDate?: string,
  minimumDaySpan: number = 0
): { start: string, end: string } {
  const today = new Date();

  const start = overrideStartDate ?? firstTallyDate ?? formatDate(today);
  const end = overrideEndDate ?? lastTallyDate ?? formatDate(addDays(parseDateString(start), minimumDaySpan));

  return { start, end };
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
  const accumulatedTallies: AccumulatedTallyPoint[] = [];
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

export function listEachDayOfData(nominalStartDate?: string, nominalEndDate?: string, firstUpdate?: string, lastUpdate?: string): string[] {
  const start = determineChartStartDate(firstUpdate, nominalStartDate);
  const end = determineChartEndDate(lastUpdate, nominalEndDate, nominalStartDate);

  let dates = { start: parseDateString(start), end: parseDateString(end) };
  if(dates.end < dates.start) {
    dates = { start: dates.end, end: dates.start };
  }

  const eachDay = eachDayOfInterval(dates).map(formatDate).sort();
  return eachDay;
}
function determineChartStartDate(firstUpdate?: string, nominalStartDate?: string): string {
  if(nominalStartDate) {
    return nominalStartDate;
  } else if(firstUpdate) {
    return firstUpdate;
  } else {
    return formatDate(new Date()); // today
  }
}
function determineChartEndDate(lastUpdate?: string, nominalEndDate?: string, nominalStartDate?: string): string {
  if(nominalEndDate) {
    return nominalEndDate;
  } else if(lastUpdate) {
    return lastUpdate;
  } else if(nominalStartDate) {
    // display a 7-day chart
    return maxDateStr(formatDate(addDays(parseDateString(nominalStartDate), 6)), formatDate(addDays(new Date(), 6)));
  } else {
    // display a 7-day chart
    return formatDate(addDays(new Date(), 6));
  }
}

export function densifyTallies(sparseTallies: TallyPoint[], eachDay: string[]): TallyPoint[] {
  return eachDay.map(date => (sparseTallies.find(tally => tally.date === date) || ({ date, value: 0 })));
}
