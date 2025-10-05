#!/usr/bin/env -S node --import tsx

import path from 'node:path';
import fs from 'node:fs/promises';
import dotenv from 'dotenv';
import { v4 } from 'uuid';

import { initLoggers, getLogger } from '../server/lib/logger.ts';
import { initDbClient, getDbClient, testDatabaseConnection } from 'server/lib/db.ts';
import { createDatabase } from 'testing-support/db-setup/db-setup.ts';
import { reqCtxForScript } from '../server/lib/request-context.ts';
import { validateSeed, createSeed } from 'testing-support/seed/seed.ts';

async function main() {
  if(process.argv.includes('-h') || process.argv.includes('--help') || process.argv.length < 3 || process.argv.length > 4) {
    printUsage();
    return;
  }

  process.env.NODE_ENV = 'development';
  dotenv.config();
  process.env.LOG_LEVEL = 'info'; // setting this higher than debug prevents a flood of audit event messages
  await initLoggers();
  const scriptLogger = getLogger('default').child({ service: 'seed-random-users.ts' });

  scriptLogger.info(`Script initialization complete. Starting main section...`);

  const [seedFileArg, dbNameArg] = process.argv.slice(2);
  if(!seedFileArg.endsWith('.json')) {
    scriptLogger.error('seed-file does not end in .json. Exiting out of an abundance of caution...');
    process.exit(1);
  }

  if(dbNameArg && !/^[a-z][a-z0-9-_]+$/.test(dbNameArg)) {
    scriptLogger.error(`database-name must match /^[a-z][a-z0-9-_]+$/. Received: ${dbNameArg}. Exiting...`);
    process.exit(1);
  } else if(dbNameArg && dbNameArg === 'public') {
    scriptLogger.error(`database-name cannot be 'public'. Exiting...`);
    process.exit(1);
  }

  scriptLogger.info('Parsing seed file...');
  const seedFilePath = path.normalize(path.isAbsolute(seedFileArg) ? seedFileArg : path.join(process.cwd(), seedFileArg));
  const seedFileContents = await fs.readFile(seedFilePath, { encoding: 'utf8' });
  let seedJson;
  try {
    seedJson = JSON.parse(seedFileContents);
  } catch (err) {
    scriptLogger.error(`Error while parsing ${seedFileArg} as JSON: ${err.message}`);
    process.exit(1);
  }

  const schemaName = dbNameArg ?? ('seed-' + v4());
  scriptLogger.info(`Creating schema ${schemaName}...`);
  createDatabase(schemaName);

  scriptLogger.info(`Initializing client to point to ${schemaName}...`);
  initDbClient(
    process.env.DATABASE_USER!,
    process.env.DATABASE_PASSWORD!,
    process.env.DATABASE_HOST!,
    process.env.DATABASE_NAME!,
    schemaName,
  );
  await testDatabaseConnection();

  const db = getDbClient();
  const users = await db.user.findMany();
  if(users.length > 0) {
    scriptLogger.error(`Found existing users! Something isn't right. Exiting...`);
    process.exit(1);
  }

  scriptLogger.info(`Seeding the database...`);
  validateSeed(seedJson);
  const reqCtx = reqCtxForScript('create-test-database.ts');
  await createSeed(seedJson, reqCtx);

  scriptLogger.info(`Done!`);
}

function printUsage() {
  console.log(`
create-test-database.ts: create a test database

Usage: ./scripts/create-test-database.ts <seed-file> [<database-name>]

<seed-file> is the path to a JSON file with a seed config in it.

<database name> is the name of the test database. It cannot be 'public' or any existing database. If not passed, a random name will be supplied.
  `.trim());
}

main().catch(e => console.error(e));
