import { TALLY_MEASURE } from 'server/lib/models/tally.ts';
import { formatDuration } from "src/lib/date.ts";

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
    defaultChartMax: 250,

  },
};

export function formatCount(count: number, measure: string ) {
  return measure === TALLY_MEASURE.TIME ? formatDuration(count) : `${count} ${TALLY_MEASURE_INFO[measure].counter[Math.abs(count) === 1 ? 'singular' : 'plural']}`;
}
