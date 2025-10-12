import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../generated/prisma/client';

let adapter: PrismaPg | null = null;
let client: PrismaClient | null = null;

export function initDbClient(
  dbUser: string,
  dbPassword: string,
  dbHost: string,
  dbName: string,
  dbSchema: string = 'public',
) {
  const connectionString = makeConnectionString(
    dbUser,
    dbPassword,
    dbHost,
    dbName,
    dbSchema,
  );
  adapter = new PrismaPg({ connectionString }, { schema: dbSchema });
  client = new PrismaClient({ adapter });
}

export async function disconnectDbClient() {
  await client?.$disconnect();
  client = null;
}

export function getDbAdapter(): PrismaPg {
  if(adapter === null) {
    throw new Error('Cannot get adapter client because it has not yet been initialized!');
  }

  return adapter;
}

export function getDbClient(): PrismaClient {
  if(client === null) {
    throw new Error('Cannot get database client because it has not yet been initialized!');
  }

  return client;
}

export async function testDatabaseConnection() {
  const db = getDbClient();
  await db.$queryRaw`SELECT 1 + 1 AS two;`;
}
export async function testDatabaseConnectionSafe() {
  try {
    await testDatabaseConnection();
    return true;
  } catch {
    return false;
  }
}

export function makeConnectionString(
  dbUser: string,
  dbPassword: string,
  dbHost: string,
  dbName: string,
  dbSchema: string = 'public',
) {
  if(dbUser.length === 0) {
    throw new Error('Database user was not set');
  }

  if(dbPassword.length === 0) {
    throw new Error('Database password was not set');
  }

  if(dbHost.length === 0) {
    throw new Error('Database host was not set');
  }

  if(dbName.length === 0) {
    throw new Error('Database name was not set');
  }

  if(dbSchema.length === 0) {
    throw new Error('Database schema was not set');
  }

  return `postgresql://${dbUser}:${dbPassword}@${dbHost}/${dbName}?schema=${dbSchema}`;
}
