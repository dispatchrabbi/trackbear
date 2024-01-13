import dotenv from 'dotenv';
import { getNormalizedEnv } from '../server/lib/env.ts';

import winston from 'winston';
import { initLoggers } from '../server/lib/logger.ts';

import dbClient from '../server/lib/db.ts';
import { initQueue } from '../server/lib/queue.ts';
import sendSignupEmail from '../server/lib/tasks/send-signup-email.ts';

async function main() {
  dotenv.config({ path: '../.env' });
  const env = await getNormalizedEnv();

  await initLoggers(env.LOG_DIR);
  const scriptLogger = winston.child({ service: 'send-email-verifications.ts' });

}

main().catch(e => console.error(e));
