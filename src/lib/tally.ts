import { addDays, eachDayOfInterval } from "date-fns";

import { TALLY_MEASURE } from 'server/lib/models/tally.ts';
import type { Tally } from 'src/lib/api/tally.ts';
import { formatDuration, formatDate, parseDateString } from "src/lib/date.ts";
import { commaify } from './number.ts';

export const TALLY_MEASURE_INFO = {
  [TALLY_MEASURE.WORD]: {
    counter: { singular: 'word', plural: 'words' },
    label: { singular: 'word', plural: 'words' },
    defaultChartMax: 5000,
  },
  [TALLY_MEASURE.PAGE]: {
    counter: { singular: 'page', plural: 'pages' },
    label: { singular: 'page', plural: 'pages' },
    defaultChartMax: 50,
  },
  [TALLY_MEASURE.CHAPTER]: {
    counter: { singular: 'chapter', plural: 'chapters' },
    label: { singular: 'chapter', plural: 'chapters' },
    defaultChartMax: 30,
  },
  [TALLY_MEASURE.TIME]: {
    counter: { singular: 'hour', plural: 'hours' },
    label: { singular: 'time', plural: 'time' },
    defaultChartMax: 250, // hours
  },
};

export function formatCount(count: number, measure: string ) {
  return measure === TALLY_MEASURE.TIME ? formatDuration(count) : `${commaify(count)} ${TALLY_MEASURE_INFO[measure].counter[Math.abs(count) === 1 ? 'singular' : 'plural']}`;
}

interface ComparableTally {
  date: string;
}
export function cmpTallies(a: ComparableTally, b: ComparableTally) {
  return a.date < b.date ? -1 : a.date > b.date ? 1 : 0;
}

export interface CompiledTally {
  date: string;
  count: {
    [measure in keyof typeof TALLY_MEASURE_INFO]: number;
  };
  total: {
    [measure in keyof typeof TALLY_MEASURE_INFO]: number;
  };
  tallies: Tally[];
}

export function compileTallies(tallies: Tally[], overrideStartDate: string = null, overrideEndDate: string = null): CompiledTally[] {
  const sortedTallies = tallies.toSorted(cmpTallies);
  const bounds = determineDateBounds(
    overrideStartDate, overrideEndDate,
    sortedTallies[0]?.date, sortedTallies[sortedTallies.length - 1]?.date
  );

  // first populate the base object and the counts (totals come later)
  const eachDay = eachDayOfInterval({ start: parseDateString(bounds.start), end: parseDateString(bounds.end) }).map(d => formatDate(d));
  const compiledPoints: CompiledTally[] = eachDay.map(date => {
    const base = {
      date,
      count: Object.keys(TALLY_MEASURE_INFO).reduce((obj, measure) => { obj[measure] = 0; return obj; }, {}),
      total: Object.keys(TALLY_MEASURE_INFO).reduce((obj, measure) => { obj[measure] = 0; return obj; }, {}),
      tallies: [],
    };

    const todayTallies = sortedTallies.filter(tally => tally.date === date);

    base.tallies = todayTallies;
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

export function streakColors(streakLength) {
  if(streakLength < 1) {
    return '';
  } else if(streakLength < 3) {
    return 'bg-primary-500 dark:bg-primary-400 text-surface-0 dark:text-surface-950';
  } else if(streakLength < 5) {
    return 'bg-purple-600 dark:bg-purple-400 text-surface-0 dark:text-surface-950';
  } else if(streakLength < 10) {
    return 'bg-green-500 dark:bg-green-400 text-surface-0 dark:text-surface-950';
  } else if(streakLength < 30) {
    return 'bg-pink-500 dark:bg-pink-400 text-surface-0 dark:text-surface-950';
  } else if(streakLength < 50) {
    return 'bg-sky-400 dark:bg-sky-400 text-surface-0 dark:text-surface-950';
  } else if(streakLength < 100) {
    return 'bg-red-600 dark:bg-red-400 text-surface-0 dark:text-surface-950';
  } else {
    return 'bg-amber-400 dark:bg-amber-400 text-surface-950 dark:text-surface-950';
  }
}
