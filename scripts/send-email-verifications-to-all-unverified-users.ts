#!/usr/bin/env -S node --import ./ts-node-loader.js

import dotenv from 'dotenv';
import { getNormalizedEnv } from '../server/lib/env.ts';

import { addDays } from 'date-fns';

import winston from 'winston';
import { initLoggers } from '../server/lib/logger.ts';

import dbClient from '../server/lib/db.ts';
import type { User } from '@prisma/client';
import { USER_STATE } from '../server/lib/states.ts';

import { initQueue, pushTask } from '../server/lib/queue.ts';
import sendEmailverificationEmail from '../server/lib/tasks/send-emailverification-email.ts';

async function main() {
  process.env.NODE_ENV = 'development';
  dotenv.config();
  const env = await getNormalizedEnv();

  await initLoggers(env.LOGS_VOLUME_DIR);
  const scriptLogger = winston.child({ service: 'send-email-verifications-to-all-unverified-users.ts' });

  initQueue(env.QUEUE_DB_PATH);

  scriptLogger.info(`Script initialization complete. Starting main section...`);

  let users: User[];
  try {
    users = await dbClient.user.findMany({
      where: {
        isEmailVerified: false,
        state: USER_STATE.ACTIVE,
      },
    });
  } catch(err) {
    scriptLogger.error(`Error fetching unverified users: ${err.message}`);
    return;
  }

  scriptLogger.info(`Found ${users.length} unverified users`);

  let sendCount = 0;
  const erroredUsers: number[] = [];
  for(const user of users) {
    try {
      scriptLogger.info(`Creating the pending email verification for ${user.id}...`);
      const verification = await dbClient.pendingEmailVerification.create({
        data: {
          userId: user.id,
          newEmail: user.email,
          expiresAt: addDays(new Date(), 10),
        },
      });

      scriptLogger.info(`Queueing a verification email for ${verification.uuid} to ${user.id}...`);
      pushTask(sendEmailverificationEmail.makeTask(verification.uuid));
    } catch(err) {
      erroredUsers.push(user.id);
      scriptLogger.error(`Error creating a verification for ${user.id}: ${err.message}`);
      continue;
    }

    sendCount++;
  }

  scriptLogger.info(`Verification emails were sent to ${sendCount}/${users.length} users`);
  if(erroredUsers.length > 0) {
    scriptLogger.info(`Users that did not get emails sent because of errors: ${erroredUsers.join(', ')}`);
  }
}

main().catch(e => console.error(e));
