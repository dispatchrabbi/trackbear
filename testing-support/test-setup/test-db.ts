import { beforeEach } from 'vitest';
import { v4 } from 'uuid';

import { loadDotEnv } from '../env.ts';
import { createTestDatabase, dropTestDatabase } from '../db-setup/db-setup.ts';
import { initDbClient, getDbClient } from 'server/lib/db.ts';

loadDotEnv();

beforeEach(() => {
  // create a test database name for this run
  const testSchemaName = `test-${v4()}`;

  // create the database
  console.log(`Creating database ${testSchemaName}...`);
  createTestDatabase(testSchemaName);

  console.log(`Initializing the db client for ${testSchemaName}...`);
  initDbClient({
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    host: process.env.DATABASE_HOST,
    name: process.env.DATABASE_NAME,
    schema: testSchemaName,
  });

  const db = getDbClient();

  // return an afterEach function
  return async () => {
    // remove the database
    console.log(`Dropping database ${testSchemaName}...`);
    await dropTestDatabase(testSchemaName, db);
  };
});
