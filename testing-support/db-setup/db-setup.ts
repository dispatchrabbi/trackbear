import process from 'node:process';
import { execSync } from 'node:child_process';
import { type PrismaClient } from 'generated/prisma/client';

import { makeConnectionString, validateConnectionParams } from 'server/lib/db-connection.ts';

export function createTestDatabase(schemaName: string) {
  process.env.DATABASE_SCHEMA = schemaName;
  const connectionString = makeConnectionStringFromEnv();

  execSync(`npx prisma validate`, {
    env: {
      ...process.env,
      DATABASE_URL: connectionString,
    },
  });

  execSync(`npx prisma db push`, {
    env: {
      ...process.env,
      DATABASE_URL: connectionString,
    },
  });
}

export async function dropTestDatabase(schemaName: string, db: PrismaClient) {
  await db.$executeRawUnsafe(
    `DROP SCHEMA IF EXISTS "${schemaName}" CASCADE;`,
  );
  await db.$disconnect();
}

function makeConnectionStringFromEnv() {
  const connectionParams = validateConnectionParams({
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    host: process.env.DATABASE_HOST,
    name: process.env.DATABASE_NAME,
    schema: process.env.DATABASE_SCHEMA,
  });

  const connectionString = makeConnectionString(connectionParams);
  return connectionString;
}
