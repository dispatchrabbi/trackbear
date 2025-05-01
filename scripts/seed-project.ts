#!/usr/bin/env -S node --import tsx

import dotenv from 'dotenv';

import winston from 'winston';
import { initLoggers } from '../server/lib/logger.ts';

import dbClient from '../server/lib/db.ts';
import { Tally, User, Work } from '@prisma/client';
import { USER_STATE } from '../server/lib/models/user/consts.ts';
import { TRACKBEAR_SYSTEM_ID, logAuditEvent } from '../server/lib/audit-events.ts';

import { eachDayOfInterval } from 'date-fns';
import { parseDateStringSafe, parseDateString, formatDate } from '../src/lib/date.ts';
import { WORK_PHASE, WORK_STATE } from '../server/lib/models/work/consts.ts';
import { TALLY_MEASURE, TALLY_STATE } from '../server/lib/models/tally/consts.ts';

const RANGE_SPREAD = 0.15;
const SKIP_CHANCE = 0.15;
const DOUBLE_CHANCE = 0.15;

async function main() {
  if(process.argv.includes('-h') || process.argv.includes('--help') || process.argv.length !== (2 + 4)) {
    printUsage();
    return;
  }

  process.env.NODE_ENV = 'production';
  dotenv.config();
  await initLoggers();
  const scriptLogger = winston.child({ service: 'seed-project.ts' });

  scriptLogger.info(`Script initialization complete`);

  const [userId, startDate, endDate, avgTally] = process.argv.slice(2);
  if(isNaN(parseInt(userId, 10))) {
    scriptLogger.error(`Invalid user ID '${userId}'`);
    return;
  }

  if(parseDateStringSafe(startDate) === null) {
    scriptLogger.error(`Invalid start date '${startDate}'`);
    return;
  }

  if(parseDateStringSafe(endDate) === null) {
    scriptLogger.error(`Invalid end date '${endDate}'`);
    return;
  } else if(endDate < startDate) {
    scriptLogger.error(`End date '${endDate}' is before start date '${startDate}`);
    return;
  }

  if(isNaN(parseInt(avgTally, 10))) {
    scriptLogger.error(`Invalid average tally '${avgTally}'`);
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
  } catch (err) {
    scriptLogger.error(`Error finding the user: ${err.message}`);
    return;
  }

  if(user === null) {
    scriptLogger.error(`Could not find a user with ID ${userId}`);
    return;
  }

  scriptLogger.info(`Creating new project...`);
  let work: Work | null = null;
  try {
    work = await dbClient.work.create({
      data: {
        ownerId: user.id,
        state: WORK_STATE.ACTIVE,
        title: 'Seed',
        description: '',
        phase: WORK_PHASE.DRAFTING,
        startingBalance: {},
        starred: false,
      },
    });

    await logAuditEvent('work:create', TRACKBEAR_SYSTEM_ID, work.id);
    scriptLogger.info(`Project created`);
  } catch (err) {
    scriptLogger.error(`Error creating the project: ${err.message}`);
    return;
  }

  scriptLogger.info(`Seeding tallies...`);
  const eachDayOfRange = eachDayOfInterval({ start: parseDateString(startDate), end: parseDateString(endDate) });
  for(const day of eachDayOfRange) {
    // occasionally we should skip a day
    const skip = Math.random() < SKIP_CHANCE;
    if(skip) {
      scriptLogger.info(`Skipping tally for ${formatDate(day)}`);
      continue;
    }

    let tally: Tally | null = null;
    try {
      const count = getRandomTallyCount(avgTally);
      tally = await dbClient.tally.create({
        data: {
          state: TALLY_STATE.ACTIVE,
          ownerId: user.id,

          date: formatDate(day),
          measure: TALLY_MEASURE.WORD,
          count,
          note: '',

          workId: work.id,
        },
      });
      await logAuditEvent('tally:create', TRACKBEAR_SYSTEM_ID, tally.id);
      scriptLogger.info(`Tally created for ${formatDate(day)} with ${count}`);
    } catch (err) {
      scriptLogger.error(`Error creating the tally for ${formatDate(day)}: ${err.message}`);
      return;
    }

    // occasionally we should double a day
    const double = Math.random() < DOUBLE_CHANCE;
    if(double) {
      scriptLogger.info(`Second tally for ${formatDate(day)}`);
      let butWhatAboutSecondTally: Tally | null = null;
      try {
        const count2 = getRandomTallyCount(avgTally);
        butWhatAboutSecondTally = await dbClient.tally.create({
          data: {
            state: TALLY_STATE.ACTIVE,
            ownerId: user.id,

            date: formatDate(day),
            measure: TALLY_MEASURE.WORD,
            count: count2,
            note: '',

            workId: work.id,
          },
        });
        await logAuditEvent('tally:create', TRACKBEAR_SYSTEM_ID, butWhatAboutSecondTally.id);
        scriptLogger.info(`Tally #2 created for ${formatDate(day)} with ${count2}`);
      } catch (err) {
        scriptLogger.error(`Error creating the second tally for ${formatDate(day)}: ${err.message}`);
        return;
      }
    }
  }

  scriptLogger.info(`Finished tally seeding!`);
}

function getRandomTallyCount(avgTally) {
  const avg = +avgTally;
  const rangeMax = Math.floor(avg * RANGE_SPREAD * 2);
  const offset = (Math.random() * rangeMax) - (rangeMax / 2);

  return Math.round(avg + offset);
}

function printUsage() {
  console.log(`
seed-project.ts: create a new project for the given user and populate it

Usage: ./scripts/seed-project.ts <userId> <startDate> <endDate> <avgTally>
  `.trim());
}

main().catch(e => console.error(e));
