import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../generated/prisma/client';

let adapter: PrismaPg | null = null;
let client: PrismaClient | null = null;

export function initDbClient(overrides: Partial<DbClientConnectionParams> = {}): PrismaClient {
  if(client) {
    throw new Error('Cannot initialize database client because it is already initialized!');
  }

  const connectionParams = validateConnectionParams(Object.assign({
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    host: process.env.DATABASE_HOST,
    name: process.env.DATABASE_NAME,
    schema: process.env.DATABASE_SCHEMA,
  }, overrides));

  const connectionString = makeConnectionString(connectionParams);
  adapter = new PrismaPg({ connectionString }, { schema: connectionParams.schema });
  client = new PrismaClient({ adapter });

  return client;
}

export async function disconnectDbClient() {
  await client?.$disconnect();
  client = null;
}

export function getDbAdapter(): PrismaPg {
  if(adapter === null) {
    throw new Error('Cannot get database adapter because it has not yet been initialized!');
  }

  return adapter;
}

export function getDbClient(): PrismaClient {
  if(client === null) {
    throw new Error('Cannot get database client because it has not yet been initialized!');
  }

  return client;
}

export async function testDatabaseConnection(db: PrismaClient) {
  await db.$queryRaw`SELECT 1 + 1 AS two;`;
}
export async function testDatabaseConnectionSafe(db: PrismaClient) {
  try {
    await testDatabaseConnection(db);
    return true;
  } catch {
    return false;
  }
}

type DbClientConnectionParams = {
  user: string;
  password: string;
  host: string;
  name: string;
  schema: string;
};
export function validateConnectionParams(params: Partial<DbClientConnectionParams>): DbClientConnectionParams {
  for(const key of ['user', 'password', 'host', 'name', 'schema']) {
    if(!params[key]) {
      throw new Error(`${key} was not set in db connection params`);
    }
  }

  return params as DbClientConnectionParams;
}

export function makeConnectionString(params: DbClientConnectionParams) {
  return `postgresql://${params.user}:${params.password}@${params.host}/${params.name}?schema=${params.schema}`;
}
