import process from 'node:process';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from 'generated/prisma/client';
import { v4 } from 'uuid';
import { beforeEach, afterEach } from 'vitest';
import { loadDotEnv } from './env.ts';

loadDotEnv();

// create a test database name for this run
const testSchemaName = `test-${v4()}`;

// create a client pointed at the test database
const connectionString = makeTestDatabaseConnectionString();
const connectionStringWithSchema = connectionString + '?schema=' + testSchemaName;

console.log(`Creating client for database ${connectionString}...`);
const adapter = new PrismaPg({ connectionString }, { schema: testSchemaName });
const dbClient = new PrismaClient({
  adapter,
});

export default dbClient;

// create the database
const prismaBinary = path.join(import.meta.dirname, '../node_modules/.bin/prisma');
beforeEach(() => {
  console.log(`Creating database ${connectionString}...`);
  execSync(`${prismaBinary} db push`, {
    env: {
      ...process.env,
      DATABASE_URL: connectionStringWithSchema,
    },
  });
});

// remove the database
afterEach(async () => {
  console.log(`Dropping database ${testSchemaName}...`);
  await dbClient.$executeRawUnsafe(
    `DROP SCHEMA IF EXISTS "${testSchemaName}" CASCADE;`,
  );
  await dbClient.$disconnect();
});

function makeTestDatabaseConnectionString() {
  for(const envVar of [
    'DATABASE_USER',
    'DATABASE_PASSWORD',
    'DATABASE_HOST',
    'DATABASE_NAME',
  ]) {
    if(!process.env[envVar]) {
      throw new Error(`${envVar} is not set; cannot create testing database`);
    }
  }

  const connectionString = `postgresql://${process.env.DATABASE_USER}:${process.env.DATABASE_PASSWORD}@${process.env.DATABASE_HOST}/${process.env.DATABASE_NAME}`;
  return connectionString;
}
