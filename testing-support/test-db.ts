import path from 'node:path';
import { URL } from "node:url";
import { execSync } from "child_process";
import { PrismaClient } from "@prisma/client";
import { v4 } from "uuid";
import { beforeEach, afterEach } from 'vitest';
import { loadDotEnv } from './env.ts';

loadDotEnv();

// create a test database name for this run
const testSchemaName = `test-${v4()}`;

// create a client pointed at the test database
const testDatabaseUrl = makeTestDatabaseUrl(testSchemaName);
process.env.DATABASE_URL = testDatabaseUrl;
console.log(`Creating client for database ${testDatabaseUrl}...`);
const dbClient = new PrismaClient({
  datasources: { db: { url: testDatabaseUrl } },
  
});

export default dbClient;

// create the database
const prismaBinary = path.join(import.meta.dirname, '../node_modules/.bin/prisma');
beforeEach(() => {
  console.log(`Creating database ${testDatabaseUrl}...`);
  execSync(`${prismaBinary} db push`, {
    env: {
      ...process.env,
      DATABASE_URL: testDatabaseUrl,
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

function makeTestDatabaseUrl(testSchemaName) {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set; cannot create testing database");
  }

  console.log(process.env.DATABASE_URL);
  const databaseUrl = new URL(process.env.DATABASE_URL);
  databaseUrl.searchParams.append('schema', testSchemaName);

  return decodeURI(databaseUrl.toString());
}