import { addDays, eachDayOfInterval, differenceInCalendarDays } from 'date-fns';
import twColors from 'tailwindcss/colors.js';

import { formatDate, parseDateString, maxDate, cmpByDate } from 'src/lib/date.ts';

import type { SeriesDataPoint, BareDataPoint } from './types.ts';
import { USER_COLOR_NAMES, userColorLevel } from './user-colors';
import { type ChartColors } from './chart-colors.ts';

import { formatCount } from 'src/lib/tally.ts';
import { formatPercent } from 'src/lib/number.ts';
import { LEADERBOARD_MEASURE, type LeaderboardMeasure } from 'server/lib/models/leaderboard/consts.ts';

export type Tallyish = {
  date: string;
  count: number;
};

export type SeriesTallyish = Tallyish & {
  series: string;
};

type CreateChartSeriesOptions = {
  /** Whether the value is a running total (`true`) or the day's value by itself (`false`) */
  accumulate: boolean;
  /** Whether to fill in missing days with a 0 value (`true`) or leave it sparse (`false`) */
  densify: boolean;
  /** Whether to fill in missing days before and after the first data value (`true`) or not (`false`) */
  extend: boolean;
  startDate: string | null;
  endDate: string | null;
  /** the first date that appears in any of the data on this chart */
  earliestData: string | null;
  /** the last date that appears in any of the data on this chart */
  latestData: string | null;
  /** What value the accumulated total starts at (though this only matters when `accumulate` is set to `true`) */
  startingTotal: number;
  series: string;
};

export function createChartSeries(tallies: Tallyish[], options: Partial<CreateChartSeriesOptions> = {}): SeriesDataPoint[] {
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
    const startDate = options.extend ? determineChartStartDate(options.earliestData, options.startDate) : options.earliestData;
    const endDate = options.extend ? determineChartEndDate(options.latestData, options.endDate, options.startDate) : options.latestData;

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

  const series: SeriesDataPoint[] = [];
  let runningTotal = options.startingTotal!;
  for(const date of Array.from(dateCounts.keys()).sort()) {
    const todayCount = dateCounts.get(date)!;
    runningTotal += todayCount;

    series.push({
      series: options.series!,
      date,
      value: options.accumulate ? runningTotal : todayCount,
    });
  }

  return series.sort(cmpByDate);
}

type CreateParSeriesOptions = {
  accumulate: boolean;
  startDate: string | null;
  endDate: string | null;
  series: string;
};

export function createParSeries(goal: number, options: Partial<CreateParSeriesOptions> = {}): SeriesDataPoint[] {
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

  const series: SeriesDataPoint[] = eachDayOfInterval({ start: startDateObj, end: endDateObj })
    .map((dateObj, ix) => {
      const dayNumber = ix + 1;

      // screw it, I'm done trying to figure this out math-wise; I'm just gonna cheat
      const todayAccumulated = (dayNumber === numberOfDays) ? goal : Math.round(perDayGoal * dayNumber);
      const yesterdayAccumulated = Math.round(perDayGoal * (dayNumber - 1));

      const value = options.accumulate ? todayAccumulated : todayAccumulated - yesterdayAccumulated;

      return {
        series: options.series!,
        date: formatDate(dateObj),
        value,
      };
    });

  return series;
}

export function determineChartIntervals(tallies: Tallyish[], overrideStartDate?: string | null, overrideEndDate?: string | null) {
  const sorted = tallies.toSorted(cmpByDate);
  const earliestData = sorted.at(0)?.date ?? null;
  const latestData = sorted.at(-1)?.date ?? null;

  const startDate = determineChartStartDate(earliestData, overrideStartDate);
  const endDate = determineChartEndDate(latestData, overrideEndDate, overrideStartDate);

  return {
    startDate,
    endDate,
    earliestData: earliestData === null ?
      null :
      earliestData < startDate ? startDate : earliestData,
    latestData: latestData === null ?
      null :
      latestData > endDate ? endDate : latestData,
  };
}

export function determineChartStartDate(firstUpdate?: string | null, overrideStartDate?: string | null): string {
  if(overrideStartDate) {
    return overrideStartDate;
  } else if(firstUpdate) {
    return firstUpdate;
  } else {
    return formatDate(new Date()); // today
  }
}
export function determineChartEndDate(lastUpdate?: string | null, overrideEndDate?: string | null, overrideStartDate?: string | null): string {
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

export function formatCountForChart(count: number, measure: LeaderboardMeasure) {
  if(measure === LEADERBOARD_MEASURE.PERCENT) {
    return formatPercent(count, 100) + '%';
  } else {
    return formatCount(count, measure);
  }
}

export function orderSeries(data: SeriesDataPoint[]) {
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

export type SeriesInfoMap = Record<string, {
  uuid: string;
  name: string;
  color: string;
}>;
export function mapSeriesToColor(seriesInfo: SeriesInfoMap, orderedSeries: string[], chartColors: ChartColors): string[] {
  const orderedColors: string[] = [];

  let colorIndex = 0;
  for(const series of orderedSeries) {
    if(series in seriesInfo && USER_COLOR_NAMES.includes(seriesInfo[series].color)) {
      const userColor = twColors[seriesInfo[series].color][userColorLevel(chartColors.theme)];
      orderedColors.push(userColor);
    } else {
      orderedColors.push(chartColors.data[colorIndex % chartColors.data.length]);
      colorIndex++;
    }
  }

  return orderedColors;
}
export function getSeriesName(seriesInfo: SeriesInfoMap, series: string): string {
  if(series in seriesInfo) {
    return seriesInfo[series].name;
  } else if(series === 'Par') {
    return 'Par';
  } else {
    return series;
  }
}

export function determineChartDomain(data: BareDataPoint[], par: BareDataPoint[] | null, suggestedYAxisMaximum: number, stacked: boolean = false) {
  let dataValues: number[] = [];
  if(stacked) {
    // group the data points by date, then sum the positive values and the negative values for each date, and return each date's sums in an array
    const dataPointsByDate = Object.values(Object.groupBy(data, dataPoint => dataPoint.date)) as BareDataPoint[][];
    dataValues = dataPointsByDate
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
