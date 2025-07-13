import process from 'node:process';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from 'generated/prisma/client';

// using getNormalizedEnv here inserts the need for an env into a _lot_ of places it doesn't otherwise need to be
// and in particular screws up testing. We'll be fine for now just accessing the DB like this...
// but in the future, we should probably make a function to get a dbClient or make it a Proxy or something so that we
// can in fact use the type safety of getNormalizedEnv.
const connectionString = `postgresql://${process.env.DATABASE_USER}:${process.env.DATABASE_PASSWORD}@${process.env.DATABASE_HOST}/${process.env.DATABASE_NAME}`;

const adapter = new PrismaPg({ connectionString });
const dbClient = new PrismaClient({ adapter });

export default dbClient;

export async function testDatabaseConnection() {
  await dbClient.$queryRaw`SELECT 1 + 1 AS two;`;
}
