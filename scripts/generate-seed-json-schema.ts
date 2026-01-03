#!/usr/bin/env -S node --import tsx

import path from 'node:path';
import fs from 'node:fs/promises';
import dotenv from 'dotenv';

import { initLoggers, getLogger } from '../server/lib/logger.ts';
import { seedSchema } from 'testing-support/seed/config-validator.ts';
import * as z from 'zod';

async function main() {
  if(process.argv.includes('-h') || process.argv.includes('--help')) {
    printUsage();
    return;
  }

  process.env.NODE_ENV = 'development';
  dotenv.config();
  process.env.LOG_LEVEL = 'info'; // setting this higher than debug prevents a flood of audit event messages
  await initLoggers();
  const scriptLogger = getLogger('default').child({ service: 'generate-seed-json-schema.ts' });

  scriptLogger.info(`Script initialization complete. Starting main section...`);

  const ROOT_DIR = path.resolve(path.join(import.meta.dirname, '..'));
  const JSON_SCHEMA_PATH = path.join(ROOT_DIR, 'generated', 'seed-schema.json');
  const schema = z.toJSONSchema(seedSchema, {
    'io': 'input',
  });
  await fs.writeFile(JSON_SCHEMA_PATH, JSON.stringify(schema, null, 2), { encoding: 'utf8' });

  scriptLogger.info(`Done!`);
}

function printUsage() {
  console.log(`
generate-seed-json-schema.ts: generate the seed JSON Schema

Usage: ./scripts/generate-seed-json-schema.ts
  `.trim());
}

main().catch(e => console.error(e));
