#!/usr/bin/env -S node --import ./ts-node-loader.js

import dotenv from 'dotenv';

import winston from 'winston';
import { initLoggers } from '../server/lib/logger.ts';

import dbClient from '../server/lib/db.ts';
import { User } from '@prisma/client';
import { USER_STATE } from '../server/lib/models/user.ts';
import { TRACKBEAR_SYSTEM_ID, logAuditEvent } from '../server/lib/audit-events.ts';

async function main() {
  if(process.argv.includes('-h') || process.argv.includes('--help') || process.argv.length !== 3) {
    printUsage();
    return;
  }

  process.env.NODE_ENV = 'production';
  dotenv.config();
  await initLoggers();
  const scriptLogger = winston.child({ service: 'add-admin.ts' });

  scriptLogger.info(`Script initialization complete. Starting main section...`);

  const [ userId ] = process.argv.slice(2);
  if(isNaN(parseInt(userId, 10))) {
    scriptLogger.error(`Invalid user ID '${userId}'`);
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

  scriptLogger.info(`Going to add ${user.username} as an admin...`);
  try {
    await dbClient.adminPerms.create({
      data: {
        isAdmin: true,
        userId: user.id,
      }
    });

    await logAuditEvent('adminperms:add', TRACKBEAR_SYSTEM_ID, user.id, undefined, { source: 'add-admin script' });
  } catch(err) {
    scriptLogger.error(`Error adding admin permissions: ${err.message}`);
    return;
  }

  scriptLogger.info(`${user.username} is now an admin!`);
}

function printUsage() {
  console.log(`
add-admin.ts: add admin permissions to a user

Usage: ./scripts/add-admin.ts <userId>
  `.trim());
}

main().catch(e => console.error(e));
