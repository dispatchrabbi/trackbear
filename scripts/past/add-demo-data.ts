#!/usr/bin/env -S node --import tsx
import dotenv from 'dotenv';
import winston from 'winston';
import { initLoggers } from '../../server/lib/logger.ts';

import dbClient from '../../server/lib/db.ts';

import { addDays, isBefore } from 'date-fns';
import { parseDateString, formatDate } from '../../src/lib/date.ts';

import { TALLY_STATE, TALLY_MEASURE } from '../../server/lib/models/tally/consts.ts';

const RANDOM_WORDS = [
  918, 2494, 1662, 1286, 2352, 886, 970, 558, 1425, 2089, 1808, 785, 1371, 2296, 1538,
  1906, 990, 1860, 2234, 1729, 1627, 2062, 522, 780, 1994, 1213, 1761, 1348, 2159, 553,
  1017, 2497, 1956, 2115, 492, 2212, 1791, 1776, 2232, 674, 1670, 736, 968, 785, 2355,
  752, 632, 1381, 645, 736, 694, 2411, 1431, 1829, 1508, 992, 1699, 881, 1691, 531, 865,
  1568, 1076, 2166, 591, 1368, 1760, 2298, 834, 1497, 693, 873, 593, 546, 1801, 1173,
  573, 1533, 696, 2106, 2008, 1022, 586, 638, 1792, 2375, 546, 549, 960, 1130, 1935, 2474,
  759, 932, 1486, 1392, 1497, 1939, 1667, 509, 2285, 1439, 950, 484, 1405, 1588, 2076,
  2025, 847, 973, 1504, 2135, 1991, 1815, 2366, 2210, 1193, 995, 1991, 1207, 2378, 1648,
  933, 1213, 509, 2304, 1291, 943, 1406, 948, 1011, 1382, 843, 1625, 1605, 1033, 759, 2110,
  1893, 2300, 1679, 1640, 2424, 1348, 1828, 2195, 1244, 734, 1283, 2164, 1977, 1456, 726,
  1134, 2309, 2311, 2458, 1680, 1404, 1822, 957, 1707, 1032, 2222, 2071, 1691, 2311, 1996,
  2299, 1909, 646, 1564, 889, 1335, 1247, 522, 1530, 996, 1352, 753, 1534, 2146, 1240, 2135,
  838, 1081, 869, 2496, 1467, 961, 835, 1857, 943, 1338, 964, 648, 1954, 2393, 1366, 1470,
];

const RANDOM_TIMES = [
  41, 138, 108, 159, 225, 100, 190, 96, 246, 138, 147, 346, 56, 286, 298, 197, 237, 63, 306, 287, 323, 36, 112, 250,
  165, 257, 205, 198, 322, 362, 223, 49, 185, 161, 230, 259, 83, 261, 58, 86, 253, 32, 36, 123, 354, 326, 116, 123,
  311, 314, 60, 245, 194, 47, 186, 240, 332, 31, 69, 272, 348, 88, 348, 31, 281, 182, 332, 30, 202, 153, 347, 255, 272,
  88, 27, 72, 88, 231, 141, 202, 65, 307, 208, 345, 124, 109, 196, 40, 117, 113, 177, 348, 53, 53, 344, 370, 254, 283,
  264, 215,
];

const DEMO_USER_ID = 39;
const ROMANTIC_DISASTER_ID = 112;
const SPY_NOVEL_ID = 113;
const PATREON_BONUS_COMICS = 114;

const DATA_TO_ADD = {
  [ROMANTIC_DISASTER_ID]: { startDate: '2024-03-10', endDate: '2024-04-04', ratio: 7 / 8 },
  [SPY_NOVEL_ID]: { startDate: '2024-01-12', endDate: '2024-03-25', ratio: 1 / 2 },
  [PATREON_BONUS_COMICS]: { startDate: '2024-01-01', endDate: '2024-04-03', ratio: 1 / 4 },
};

type TallyPayload = {
  workId: number;
  state: string;
  ownerId: number;
  date: string;
  measure: string;
  count: number;
  note: string;
};

async function main() {
  process.env.NODE_ENV = 'production';
  dotenv.config();
  await initLoggers();
  const scriptLogger = winston.child({ service: 'add-admin.ts' });

  scriptLogger.info(`Script initialization complete. Starting main section...`);

  let randomIx = 0;
  const tallies: TallyPayload[] = [];

  let date, endDate, ratio;

  scriptLogger.info('Adding data for Romantic Disaster...');
  date = parseDateString(DATA_TO_ADD[ROMANTIC_DISASTER_ID].startDate);
  endDate = parseDateString(DATA_TO_ADD[ROMANTIC_DISASTER_ID].endDate);
  ratio = DATA_TO_ADD[ROMANTIC_DISASTER_ID].ratio;

  while(isBefore(date, endDate)) {
    if(Math.random() < ratio) {
      tallies.push({
        workId: ROMANTIC_DISASTER_ID,
        state: TALLY_STATE.ACTIVE,
        ownerId: DEMO_USER_ID,
        date: formatDate(date),
        measure: TALLY_MEASURE.WORD,
        count: RANDOM_WORDS[randomIx],
        note: '',
      });

      randomIx++;
    }

    date = addDays(date, 1);
  }

  scriptLogger.info('Adding data for Spy Novel...');
  randomIx = 0;
  date = parseDateString(DATA_TO_ADD[SPY_NOVEL_ID].startDate);
  endDate = parseDateString(DATA_TO_ADD[SPY_NOVEL_ID].endDate);
  ratio = DATA_TO_ADD[SPY_NOVEL_ID].ratio;

  while(isBefore(date, endDate)) {
    if(Math.random() < ratio) {
      tallies.push({
        workId: SPY_NOVEL_ID,
        state: TALLY_STATE.ACTIVE,
        ownerId: DEMO_USER_ID,
        date: formatDate(date),
        measure: TALLY_MEASURE.TIME,
        count: RANDOM_TIMES[randomIx],
        note: '',
      });

      randomIx++;
    }

    date = addDays(date, 1);
  }

  scriptLogger.info('Adding data for Patreon Pages...');
  date = parseDateString(DATA_TO_ADD[PATREON_BONUS_COMICS].startDate);
  endDate = parseDateString(DATA_TO_ADD[PATREON_BONUS_COMICS].endDate);
  ratio = DATA_TO_ADD[PATREON_BONUS_COMICS].ratio;
  while(isBefore(date, endDate)) {
    if(Math.random() < ratio) {
      tallies.push({
        workId: PATREON_BONUS_COMICS,
        state: TALLY_STATE.ACTIVE,
        ownerId: DEMO_USER_ID,
        date: formatDate(date),
        measure: TALLY_MEASURE.PAGE,
        count: 1,
        note: '',
      });
    }

    date = addDays(date, 1);
  }

  scriptLogger.info('Entering the data into the database...');
  const result = await dbClient.tally.createMany({
    data: tallies,
  });

  scriptLogger.info(`Successfully created ${result.count} tallies`);
}

main()
  .then(async () => {
    await dbClient.$disconnect();
  })
  .catch(async e => {
    console.error(e);
    await dbClient.$disconnect();
    process.exit(1);
  });
