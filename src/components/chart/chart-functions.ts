import { addDays, eachDayOfInterval } from "date-fns";
import { formatDate, parseDateString, maxDate } from "src/lib/date.ts";

import { cmpTallies } from "src/lib/tally.ts";

export interface Tallyish {
  date: string;
  count: number;
}

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

export function normalizeTallies(tallies: Tallyish[]): CountedTallyPoint[] {
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
export function determineChartStartDate(firstUpdate?: string, nominalStartDate?: string): string {
  if(nominalStartDate) {
    return nominalStartDate;
  } else if(firstUpdate) {
    return firstUpdate;
  } else {
    return formatDate(new Date()); // today
  }
}
export function determineChartEndDate(lastUpdate?: string, nominalEndDate?: string, nominalStartDate?: string): string {
  if(nominalEndDate) {
    return nominalEndDate;
  } else if(lastUpdate) {
    return lastUpdate;
  } else if(nominalStartDate) {
    // display a 7-day chart
    return maxDate(formatDate(addDays(parseDateString(nominalStartDate), 6)), formatDate(addDays(new Date(), 6)));
  } else {
    // display a 7-day chart
    return formatDate(addDays(new Date(), 6));
  }
}

export function densifyTallies(sparseTallies: Tallyish[], eachDay: string[]): Tallyish[] {
  return eachDay.map(date => (sparseTallies.find(tally => tally.date === date) || ({ date, count: 0 })));
}
