import { beforeEach } from 'vitest';
import { v4 } from 'uuid';

import { loadDotEnv } from '../env.ts';
import { createDatabase, dropDatabase } from '../db-setup/db-setup.ts';
import { initDbClient, getDbClient } from 'server/lib/db.ts';

loadDotEnv();

// export function setupDb(): [ReturnType<typeof getDbClient>, () => Promise<void>] {
//   // create a test database name for this run
//   const testSchemaName = `test-${v4()}`;

//   // create the database
//   console.log(`Creating database ${testSchemaName}...`);
//   createDatabase(testSchemaName);

//   console.log(`Initializing the db client for ${testSchemaName}...`);
//   initDbClient(
//     process.env.DATABASE_USER!,
//     process.env.DATABASE_PASSWORD!,
//     process.env.DATABASE_HOST!,
//     process.env.DATABASE_NAME!,
//     testSchemaName,
//   );

//   const db = getDbClient();
//   const after = async () => {
//     await dropDatabase(testSchemaName, db);
//   };

//   return [db, after];
// }

beforeEach(() => {
  // create a test database name for this run
  const testSchemaName = `test-${v4()}`;

  // create the database
  console.log(`Creating database ${testSchemaName}...`);
  createDatabase(testSchemaName);

  console.log(`Initializing the db client for ${testSchemaName}...`);
  initDbClient(
    process.env.DATABASE_USER!,
    process.env.DATABASE_PASSWORD!,
    process.env.DATABASE_HOST!,
    process.env.DATABASE_NAME!,
    testSchemaName,
  );

  const db = getDbClient();

  // return an afterEach function
  return async () => {
    // remove the database
    console.log(`Dropping database ${testSchemaName}...`);
    await dropDatabase(testSchemaName, db);
  };
});
