#!/usr/bin/env -S node --import ./ts-node-loader.js

import dotenv from 'dotenv';
import { getNormalizedEnv } from '../server/lib/env.ts';

import { addDays } from 'date-fns';

import winston from 'winston';
import { initLoggers } from '../server/lib/logger.ts';

import dbClient from '../server/lib/db.ts';
import { TRACKBEAR_SYSTEM_ID, logAuditEvent } from '../server/lib/audit-events.ts';

async function main() {
  if(process.argv.includes('-h') || process.argv.includes('--help')) {
    printUsage();
    return;
  }

  process.env.NODE_ENV = 'production';
  dotenv.config();
  const env = await getNormalizedEnv();

  await initLoggers(env.LOG_DIR);
  const scriptLogger = winston.child({ service: 'add-banner.ts' });

  scriptLogger.info(`Script initialization complete. Starting main section...`);

  const [ message, days, icon, color ] = process.argv.slice(2);
  const bannerData = {
    enabled: true,
    showUntil: addDays(new Date(), +days),
    message,
    color,
    icon,
  };

  scriptLogger.info(`Going to add a banner with message: ${message}, color: ${color}, and icon ${icon}`);
  try {
    const banner = await dbClient.banner.create({
      data: bannerData,
    });

    await logAuditEvent('banner:add', TRACKBEAR_SYSTEM_ID, banner.id, undefined, { source: 'add-banner script' });
  } catch(err) {
    scriptLogger.error(`Error adding a banner: ${err.message}`);
    return;
  }

  scriptLogger.info(`Banner has been added!`);
}

function printUsage() {
  console.log(`
add-banner.ts: add a banner to TrackBear

Usage: ./scripts/add-banner.ts <text> <days> <icon> <color>
  `.trim());
}

main().catch(e => console.error(e));
