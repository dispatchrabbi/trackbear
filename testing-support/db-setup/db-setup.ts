import process from 'node:process';
import { execSync } from 'node:child_process';
import { PrismaClient } from 'generated/prisma/client';

import { makeConnectionString } from 'server/lib/db.ts';

export function createDatabase(schemaName: string) {
  const connectionString = makeConnectionStringFromEnv(schemaName);

  execSync(`npx prisma db push`, {
    env: {
      ...process.env,
      DATABASE_URL: connectionString,
    },
  });
}

export async function dropDatabase(schemaName: string, db: PrismaClient) {
  await db.$executeRawUnsafe(
    `DROP SCHEMA IF EXISTS "${schemaName}" CASCADE;`,
  );
  await db.$disconnect();
}

export function makeConnectionStringFromEnv(schemaName: string) {
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

  const connectionString = makeConnectionString(
    process.env.DATABASE_USER!,
    process.env.DATABASE_PASSWORD!,
    process.env.DATABASE_HOST!,
    process.env.DATABASE_NAME!,
    schemaName,
  );
  return connectionString;
}
