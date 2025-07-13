import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../generated/prisma/client';

import { getNormalizedEnv } from './env';

const env = await getNormalizedEnv();
const connectionString = `postgresql://${env.DATABASE_USER}:${env.DATABASE_PASSWORD}@${env.DATABASE_HOST}/${env.DATABASE_NAME}`;

const adapter = new PrismaPg({ connectionString });
const dbClient = new PrismaClient({ adapter });

export default dbClient;

export async function testDatabaseConnection() {
  await dbClient.$queryRaw`SELECT 1 + 1 AS two;`;
}
