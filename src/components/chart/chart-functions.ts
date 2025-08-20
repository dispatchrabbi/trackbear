import { addDays, eachDayOfInterval, differenceInCalendarDays } from 'date-fns';
import { formatDate, parseDateString, maxDate, cmpByDate } from 'src/lib/date.ts';

import { cmpTallies } from 'src/lib/tally.ts';

export type Tallyish = {
  date: string;
  count: number;
};

type ChartDataPoint = {
  series: string;
  date: string;
  value: number;
};
type BareDataPoint = Omit<ChartDataPoint, 'series'>;

type CreateChartSeriesOptions = {
  /** Whether the value is a running total (`true`) or the day's value by itself (`false`) */
  accumulate: boolean;
  /** Whether to fill in missing days with a 0 value (`true`) or leave it sparse (`false`) */
  densify: boolean;
  /** Whether to fill in missing days before and after the first data value (`true`) or not (`false`) */
  extend: boolean;
  startDate: string;
  endDate: string;
  /** the first date that appears in any of the data on this chart */
  earliestData: string;
  /** the last date that appears in any of the data on this chart */
  latestData: string;
  /** What value the accumulated total starts at (though this only matters when `accumulate` is set to `true`) */
  startingTotal: number;
  series: string;
};

export function createChartSeries(tallies: Tallyish[], options: Partial<CreateChartSeriesOptions> = {}): ChartDataPoint[] {
  options = Object.assign<CreateChartSeriesOptions, Partial<CreateChartSeriesOptions>>({
    accumulate: false,
    densify: false,
    extend: false,
    startDate: null,
    endDate: null,
    earliestData: null,
    latestData: null,
    startingTotal: 0,
    series: 'Progress',
  }, options);

  const dateCounts = new Map<string, number>([]);
  for(const tally of tallies) {
    if(
      (options.startDate && tally.date < options.startDate) ||
      (options.endDate && tally.date > options.endDate)
    ) {
      continue;
    }

    dateCounts.set(tally.date, (dateCounts.get(tally.date) ?? 0) + tally.count);
  }

  if(options.densify) {
    const dates = Array.from(dateCounts.keys()).sort();
    const startDate = options.extend ? determineChartStartDate(dates.at(0), options.startDate) : options.earliestData;
    const endDate = options.extend ? determineChartEndDate(dates.at(-1), options.endDate, options.startDate) : options.latestData;

    if(startDate && endDate) {
      // get each day in the interval
      eachDayOfInterval({
        start: parseDateString(startDate),
        end: parseDateString(endDate),
      }).map(dateObj => formatDate(dateObj))
      // filter to just the missing ones
        .filter(date => !dateCounts.has(date))
      // fill in the gaps
        .forEach(date => dateCounts.set(date, 0));
    }
  }

  const series: ChartDataPoint[] = [];
  let runningTotal = options.startingTotal;
  for(const date of Array.from(dateCounts.keys()).sort()) {
    const todayCount = dateCounts.get(date);
    runningTotal += todayCount;

    series.push({
      series: options.series,
      date,
      value: options.accumulate ? runningTotal : todayCount,
    });
  }

  return series;
}

type CreateParSeriesOptions = {
  accumulate: boolean;
  startDate: string;
  endDate: string;
  series: string;
};

export function createParSeries(goal: number, options: Partial<CreateParSeriesOptions> = {}): ChartDataPoint[] {
  options = Object.assign<CreateParSeriesOptions, Partial<CreateParSeriesOptions>>({
    /** Whether Par is a running total (`true`) or the same every day (`false`) */
    accumulate: false,
    startDate: null,
    endDate: null,
    series: 'Par',
  }, options);

  const startDateObj = parseDateString(determineChartStartDate(null, options.startDate));
  const endDateObj = parseDateString(determineChartEndDate(null, options.endDate, options.startDate));

  const numberOfDays = options.endDate ?
    differenceInCalendarDays(endDateObj, startDateObj) + 1 : // add 1 so we count both the start and end date
    1; // use the whole goal for every day
  const perDayGoal = goal / numberOfDays;
  // const extra = goal - (perDayGoal * numberOfDays);

  // // if we don't do this, we just will add all the extras on at the end
  // const extraGcd = gcd(numberOfDays, extra);
  // const reducedNumberOfDays = numberOfDays / extraGcd;
  // const reducedExtra = extra / extraGcd;
  // const threshold = reducedNumberOfDays - reducedExtra;

  const series: ChartDataPoint[] = eachDayOfInterval({ start: startDateObj, end: endDateObj })
    .map((dateObj, ix) => {
      const dayNumber = ix + 1;

      // screw it, I'm done trying to figure this out math-wise; I'm just gonna cheat
      const todayAccumulated = (dayNumber === numberOfDays) ? goal : Math.round(perDayGoal * dayNumber);
      const yesterdayAccumulated = Math.round(perDayGoal * (dayNumber - 1));

      const value = options.accumulate ? todayAccumulated : todayAccumulated - yesterdayAccumulated;

      return {
        series: options.series,
        date: formatDate(dateObj),
        value,
      };
    });
    // .map((dateObj, ix) => ({
    //   series: options.series,
    //   date: formatDate(dateObj),
    //   value: options.accumulate ?
    //       // special-case the last day, otherwise it's day number * per day goal (unrounded)
    //       (ix + 1 === numberOfDays ? goal : Math.round((ix + 1) * (goal / numberOfDays))) :
    //     // add one extra at the end of the reducedNumberOfDaus cycle
    //     perDayGoal + (extra && (ix % reducedNumberOfDays > threshold) ? 1 : 0),
    // }));

  return series;
}

export function determineChartIntervals(tallies: Tallyish[], overrideStartDate?: string, overrideEndDate?: string) {
  const sorted = tallies.toSorted(cmpByDate);
  const earliestData = sorted.at(0)?.date ?? null;
  const latestData = sorted.at(-1)?.date ?? null;

  const startDate = determineChartStartDate(earliestData, overrideStartDate);
  const endDate = determineChartEndDate(latestData, overrideEndDate, overrideStartDate);

  return {
    startDate,
    endDate,
    earliestData: earliestData < startDate ? startDate : earliestData,
    latestData: latestData > endDate ? endDate : latestData,
  };
}

export function determineChartStartDate(firstUpdate?: string, overrideStartDate?: string): string {
  if(overrideStartDate) {
    return overrideStartDate;
  } else if(firstUpdate) {
    return firstUpdate;
  } else {
    return formatDate(new Date()); // today
  }
}
export function determineChartEndDate(lastUpdate?: string, overrideEndDate?: string, overrideStartDate?: string): string {
  if(overrideEndDate) {
    return overrideEndDate;
  } else if(lastUpdate) {
    return lastUpdate;
  } else if(overrideStartDate) {
    // display a 7-day chart
    const sixDaysAfterOverrideStartDate = formatDate(addDays(parseDateString(overrideStartDate), 6));
    const sixDaysAfterToday = formatDate(addDays(new Date(), 6));
    return maxDate(sixDaysAfterOverrideStartDate, sixDaysAfterToday);
  } else {
    // display a 7-day chart
    return formatDate(addDays(new Date(), 6));
  }
}

export function orderSeries(data: ChartDataPoint[]) {
  const mins = {};
  const maxes = {};

  for(const dataPoint of data) {
    const series = dataPoint.series;
    mins[series] = Math.min((mins[series] ?? 0), dataPoint.value);
    maxes[series] = Math.max((maxes[series] ?? 0), dataPoint.value);
  }

  const sortedSeries = Object.keys(mins).sort((a, b) => {
    // we want the biggest first
    return maxes[a] < maxes[b] ? 1 : maxes[a] > maxes[b] ? -1 : mins[a] > mins[b] ? 1 : mins[a] < mins[b] ? -1 : 0;
  });

  return sortedSeries;
}

export function getChartDomain(data: BareDataPoint[], par: BareDataPoint[], suggestedYAxisMaximum: number, stacked: boolean = false) {
  let dataValues: number[] = [];
  if(stacked) {
    // group the data points by date, then sum the positive values and the negative values for each date, and return each date's sums in an array
    dataValues = Object.values(Object.groupBy(data, dataPoint => dataPoint.date))
      .flatMap(dataPoints => ([
        dataPoints.filter(dataPoint => dataPoint.value >= 0).reduce((total, dataPoint) => total + dataPoint.value, 0),
        dataPoints.filter(dataPoint => dataPoint.value <= 0).reduce((total, dataPoint) => total + dataPoint.value, 0),
      ]));
  } else {
    dataValues = data.map(el => el.value);
  }
  const parValues = (par ?? []).map(el => el.value);

  let min = Math.min(...dataValues, ...parValues);
  let max = Math.max(...dataValues, ...parValues);

  // if they're all negative...
  if(max <= 0) {
    // the domain is from the lowest (or default) to zero
    max = 0;
    min = Math.min(min, -suggestedYAxisMaximum);
  } else {
    // this assumes that if they're not all negative, they'll be only occasionally negative
    max = Math.max(max, suggestedYAxisMaximum);
    // and if they're all positive, set the minimum to 0
    if(min >= 0) {
      min = 0;
    }
  }

  return [min, max];
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
  for(const [date, value] of dateTotals) {
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

export function densifyTallies(sparseTallies: TallyPoint[], eachDay: string[]): TallyPoint[] {
  return eachDay.map(date => (sparseTallies.find(tally => tally.date === date) || ({ date, count: 0, value: 0 })));
}
