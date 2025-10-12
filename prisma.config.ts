import path from 'node:path';
import dotenv from 'dotenv';
import type { PrismaConfig } from 'prisma';
// import { initDbClient, getDbAdapter } from './server/lib/db.ts';

dotenv.config();

export default {
  // experimental: {
  //   adapter: true,
  // },
  schema: path.join('prisma', 'schema.prisma'),
  migrations: {
    path: path.join('prisma', 'migrations'),
  },
  // not supported for CLI yet
  // adapter: async () => {
  //   initDbClient(
  //     process.env.DATABASE_USER!,
  //     process.env.DATABASE_PASSWORD!,
  //     process.env.DATABASE_HOST!,
  //     process.env.DATABASE_NAME!,
  //     process.env.DATABASE_SCHEMA ?? undefined,
  //   );

  //   return getDbAdapter();
  // },
} satisfies PrismaConfig;
