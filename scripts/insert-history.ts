#!/usr/bin/env -S node --import tsx

import dotenv from 'dotenv';

import winston from 'winston';
import { initLoggers } from '../server/lib/logger.ts';

import { subYears, addDays, isBefore } from 'date-fns';
import { formatDate } from '../src/lib/date.ts';

import dbClient from '../server/lib/db.ts';
import { User, Work } from '@prisma/client';
import { USER_STATE } from '../server/lib/models/user/consts.ts';
import { WORK_STATE } from '../server/lib/models/work/consts.ts';
import { TALLY_MEASURE, TALLY_STATE } from '../server/lib/models/tally/consts.ts';
import { TRACKBEAR_SYSTEM_ID, logAuditEvent } from '../server/lib/audit-events.ts';

type TallyData = {
  state: string;
  ownerId: number;

  date: string;
  measure: string;
  count: number;
  note: string;

  workId: number;
};

async function main() {
  if(process.argv.includes('-h') || process.argv.includes('--help') || process.argv.length !== 4) {
    printUsage();
    return;
  }

  process.env.NODE_ENV = 'production';
  dotenv.config();
  await initLoggers();
  const scriptLogger = winston.child({ service: 'insert-history.ts' });

  scriptLogger.info(`Script initialization complete. Starting main section...`);

  const [ userId, workId ] = process.argv.slice(2);
  if(isNaN(parseInt(userId, 10))) {
    scriptLogger.error(`Invalid user ID '${userId}'`);
    return;
  }

  if(isNaN(parseInt(workId, 10))) {
    scriptLogger.error(`Invalid work ID '${workId}'`);
    return;
  }

  let user: User | null = null;
  try {
    user = await dbClient.user.findUnique({
      where: {
        id: +userId,
        state: USER_STATE.ACTIVE,
      },
    });
  } catch(err) {
    scriptLogger.error(`Error finding the user: ${err.message}`);
    return;
  }

  if(user === null) {
    scriptLogger.error(`Could not find a user with ID ${userId}`);
    return;
  }

  let work: Work | null = null;
  try {
    work = await dbClient.work.findUnique({
      where: {
        id: +workId,
        ownerId: +userId,
        state: WORK_STATE.ACTIVE,
      },
    });
  } catch(err) {
    scriptLogger.error(`Error finding the work: ${err.message}`);
    return;
  }

  if(work === null) {
    scriptLogger.error(`Could not find a work with ID ${workId}`);
    return;
  }

  // create 10 years of history
  const tallies: TallyData[] = [];
  const now = new Date();
  let tallyDate = subYears(now, 8);

  scriptLogger.info(`Starting the history at ${formatDate(tallyDate)}`);
  while(isBefore(tallyDate, now)) {
    if(Math.random() > 0.01) {
      tallies.push({
        state: TALLY_STATE.ACTIVE,
        ownerId: user.id,

        date: formatDate(tallyDate),
        measure: TALLY_MEASURE.TIME,
        count: getRandomTimeCount(),
        note: '',

        workId: work.id,
      });
    }

    tallyDate = addDays(tallyDate, 1);
  }

  scriptLogger.info(`Queued ${tallies.length} tallies`);

  const createdTallies = await dbClient.tally.createManyAndReturn({ data: tallies });
  scriptLogger.info(`Created ${createdTallies.length} tallies`);
  await Promise.all(createdTallies.map(createdTally => logAuditEvent('tally:create', TRACKBEAR_SYSTEM_ID, createdTally.id)));

  scriptLogger.info(`History has been inserted!`);
}

// function getRandomWordCount() {
//   return randn_bm(100, 8000, 3);
// }
function getRandomTimeCount() {
  return randn_bm(30, 240, 1.5);
}

// copied shamelessly from https://stackoverflow.com/a/49434653
function randn_bm(min, max, skew) {
  let u = 0, v = 0;
  while(u === 0) u = Math.random() //Converting [0,1) to (0,1)
  while(v === 0) v = Math.random()
  let num = Math.sqrt( -2.0 * Math.log( u ) ) * Math.cos( 2.0 * Math.PI * v )

  num = num / 10.0 + 0.5 // Translate to 0 -> 1
  if (num > 1 || num < 0)
    num = randn_bm(min, max, skew) // resample between 0 and 1 if out of range

  else{
    num = Math.pow(num, skew) // Skew
    num *= max - min // Stretch to fill range
    num += min // offset to min
  }
  return num
}

function printUsage() {
  console.log(`
insert-history.ts: add lots of tallies to a user

Usage: ./scripts/insert-history.ts <userId> <workId>
  `.trim());
}

main().catch(e => console.error(e));
