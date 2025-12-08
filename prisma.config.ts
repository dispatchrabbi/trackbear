import path from 'node:path';
import process from 'node:process';

import dotenv from 'dotenv';
import type { PrismaConfig } from 'prisma';

import { makeConnectionString, validateConnectionParams } from './server/lib/db-connection.ts';

dotenv.config();
const datasourceUrl = process.env.PRISMA_GENERATE_DATABASE_URL || makeConnectionString(validateConnectionParams({
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  host: process.env.DATABASE_HOST,
  name: process.env.DATABASE_NAME,
  schema: process.env.DATABASE_SCHEMA,
}));

export default {
  schema: path.join('prisma', 'schema.prisma'),
  migrations: {
    path: path.join('prisma', 'migrations'),
  },
  datasource: {
    url: datasourceUrl,
  },
} satisfies PrismaConfig;
