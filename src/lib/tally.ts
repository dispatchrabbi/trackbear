import { TALLY_MEASURE } from 'server/lib/entities/tally.ts';

export const TALLY_MEASURE_INFO = {
  [TALLY_MEASURE.WORD]: {
    counter: { singular: 'word', plural: 'words' },
    label: { singular: 'word', plural: 'words' },
  },
  [TALLY_MEASURE.PAGE]: {
    counter: { singular: 'page', plural: 'pages' },
    label: { singular: 'page', plural: 'pages' },
  },
  [TALLY_MEASURE.CHAPTER]: {
    counter: { singular: 'chapter', plural: 'chapters' },
    label: { singular: 'chapter', plural: 'chapters' },
  },
  [TALLY_MEASURE.TIME]: {
    counter: { singular: 'hour', plural: 'hours' },
    label: { singular: 'time', plural: 'time' },
  },
};
