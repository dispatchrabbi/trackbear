#!/usr/bin/env -S node --import tsx

import { readFile } from 'fs/promises';

import dotenv from 'dotenv';

import { initLoggers, getLogger } from '../server/lib/logger.ts';

import { User, UserModel } from '../server/lib/models/user/user-model.ts';
import { reqCtxForScript } from '../server/lib/request-context.ts';
import { AUDIT_EVENT_SOURCE } from 'server/lib/models/audit-event/consts.ts';

async function main() {
  if(process.argv.includes('-h') || process.argv.includes('--help') || process.argv.length !== 3) {
    printUsage();
    return;
  }

  process.env.NODE_ENV = 'production';
  dotenv.config();
  await initLoggers();
  const scriptLogger = getLogger('default').child({ service: 'verify-users.ts' });

  scriptLogger.info(`Script initialization complete. Starting main section...`);

  const [userFilePath] = process.argv.slice(2);
  const contents = await readFile(userFilePath, { encoding: 'utf-8' });
  const lines = contents.trim().split('\n').map(line => line.trim());

  const userIds: number[] = [];
  for(let lineNumber = 0; lineNumber < lines.length; ++lineNumber) {
    const line = lines[lineNumber];
    // skip empty lines and comments
    if(line.length === 0 || line[0] === '#') {
      continue;
    }

    const userId = +line;
    if(userId.toString() !== line) {
      scriptLogger.error(`Invalid user ID on line ${lineNumber}: ${line}. Aborting!`);
      process.exit(1);
    }

    userIds.push(userId);
  }

  const usersToVerify: User[] = [];
  for(const userId of userIds) {
    const user = await UserModel.getUser(userId);
    if(!user) {
      scriptLogger.error(`No user found for user ID ${userId}. Aborting!`);
      process.exit(2);
    }

    usersToVerify.push(user);
  }

  const results = {
    success: [] as User[],
    failure: [] as User[],
    noop: [] as User[],
  };

  for(const user of usersToVerify) {
    if(user.isEmailVerified) {
      results.noop.push(user);
      continue;
    }

    try {
      await UserModel.verifyEmailByFiat(user, AUDIT_EVENT_SOURCE.SCRIPT, reqCtxForScript('verify-users'));

      results.success.push(user);
    } catch (err) {
      scriptLogger.error(`Could not verify ${user.username} (${user.id}): ${err.message}`);
      results.failure.push(user);
    }
  }

  scriptLogger.info(`User force-verification complete. Here's the stats:`);
  scriptLogger.info(`No-Op: ${results.noop.length}`);
  scriptLogger.info(`Success: ${results.success.length}`);
  scriptLogger.info(`Failure: ${results.failure.length}`);
  results.failure.forEach(user => scriptLogger.info(`- ${user.id} ${user.username}`));
}

function printUsage() {
  console.log(`
verify-users.ts: force-verify a list of users

Usage: ./scripts/verify-users.ts <path-to-user-file>

<path-to-user-file> is the path to a file that contains a list of users to be verified, one user ID per line
  `.trim());
}

main().catch(e => console.error(e));
