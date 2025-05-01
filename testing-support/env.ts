import path from 'node:path';
import dotenv from 'dotenv';
import { getNormalizedEnv } from '../server/lib/env.ts';

export async function loadDotEnv() {
  dotenv.config({
    path: path.join(import.meta.dirname, '../.env'),
  });
}

export async function disableEmail() {
  process.env.ENABLE_EMAIL = '0';
  await getNormalizedEnv(true);
}
