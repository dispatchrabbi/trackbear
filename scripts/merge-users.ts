#!/usr/bin/env -S node --import tsx

import { createInterface } from 'node:readline/promises';
import dotenv from 'dotenv';

import { initLoggers, getLogger } from '../server/lib/logger.ts';
import { reqCtxForScript } from '../server/lib/request-context.ts';

import { initDbClient, getDbClient, testDatabaseConnection } from 'server/lib/db.ts';

import { UserModel } from 'server/lib/models/user/user-model.ts';
import { USER_STATE } from 'server/lib/models/user/consts.ts';
import { MergeUsers } from 'server/lib/data-manipulations/merge-users.ts';

async function main() {
  if(process.argv.includes('-h') || process.argv.includes('--help') || process.argv.length > 2) {
    printUsage();
    return;
  }

  dotenv.config();
  await initLoggers();
  const scriptLogger = getLogger('default').child({ service: 'merge-users.ts' });

  initDbClient({
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    host: process.env.DATABASE_HOST,
    name: process.env.DATABASE_NAME,
    schema: process.env.DATABASE_SCHEMA,
  });

  const db = getDbClient();
  await testDatabaseConnection(db);

  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  scriptLogger.info(`Script initialization complete. Starting main section...`);

  const currentIdString = await rl.question('Enter the user ID for the active (current) user: ');
  const currentId = parseInt(currentIdString, 10);
  if(isNaN(currentId) || currentId <= 0) {
    scriptLogger.error(`IDs must be positive integers. (Received: ${currentIdString}) Exiting...`);
    process.exit(1);
  }
  const currentUser = await UserModel.getUser(currentId);
  if(!currentUser) {
    scriptLogger.error(`There is no user with ID ${currentId}. Exiting...`);
    process.exit(1);
  }
  if(currentUser.state !== USER_STATE.ACTIVE) {
    scriptLogger.error(`User ${currentId} (${currentUser.username}) is not active. (They are ${currentUser.state}.) Check that you don't have the users backwards. Exiting...`);
    process.exit(1);
  }
  console.log(`Found active user ${currentUser.username} (${currentUser.id}).`);
  console.log('');

  const pastIdString = await rl.question('Enter the user ID for the suspended (past) user: ');
  const pastId = parseInt(pastIdString, 10);
  if(isNaN(pastId) || pastId <= 0) {
    scriptLogger.error(`IDs must be positive integers. (Received: ${pastIdString}) Exiting...`);
    process.exit(1);
  }
  const pastUser = await UserModel.getUser(pastId);
  if(!pastUser) {
    scriptLogger.error(`There is no user with ID ${pastId}. Exiting...`);
    process.exit(1);
  }
  if(pastUser.state !== USER_STATE.SUSPENDED) {
    scriptLogger.error(`User ${pastId} (${pastUser.username}) is not suspended. (They are ${pastUser.state}.) Check that you don't have the users backwards. Exiting...`);
    process.exit(1);
  }
  console.log(`Found suspended user ${pastUser.username} (${pastUser.id}).`);
  console.log('');

  console.log(`About to merge ${pastUser.username} (${pastUser.id}: ${pastUser.state}) into ${currentUser.username} (${currentUser.id}: ${currentUser.state}).`);
  const confirmation = await rl.question('Enter MERGE to continue (anything else will exit): ');
  if(confirmation !== 'MERGE') {
    scriptLogger.error(`Confirmation was not given. Halting the merge and exiting...`);
    process.exit(0);
  }

  rl.close();

  scriptLogger.info(`About to merge ${pastUser.username} (${pastUser.id}: ${pastUser.state}) into ${currentUser.username} (${currentUser.id}: ${currentUser.state}).`);
  const reqCtx = reqCtxForScript('merge-users.ts');
  try {
    await MergeUsers.mergeUsers(currentUser.id, pastUser.id, reqCtx);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    scriptLogger.error(`Error while merging users: ${msg}. Exiting...`);
    process.exit(2);
  }

  scriptLogger.info(`Done!`);
}

function printUsage() {
  console.log(`
merge-users.ts: merge two users

Usage: ./scripts/merge-users.ts

The CLI will prompt you to enter a current, active user's ID and a past, suspended user's ID to merge into it. Then
you'll be prompted to confirm the merge.

If either user ID does not match a user, or if the suspended and active users are not, in fact,
suspended and active respectively, the script will exit with 1.

If you don't confirm the merge, the script will exit with 0.

If there is an error during the merge, the script will exit with 2.
  `.trim());
}

main().catch(e => console.error(e));
