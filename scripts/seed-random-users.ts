#!/usr/bin/env -S node --import tsx

import dotenv from 'dotenv';

import { initLoggers, getLogger } from '../server/lib/logger.ts';

import { UserModel } from '../server/lib/models/user/user-model.ts';
import { reqCtxForScript } from '../server/lib/request-context.ts';

async function main() {
  if(process.argv.includes('-h') || process.argv.includes('--help') || process.argv.length !== 4) {
    printUsage();
    return;
  }

  process.env.NODE_ENV = 'production';
  dotenv.config();
  await initLoggers();
  const scriptLogger = getLogger('default').child({ service: 'seed-random-users.ts' });

  scriptLogger.info(`Script initialization complete. Starting main section...`);

  const [numStr, emailBase] = process.argv.slice(2);
  const numberToSeed = +numStr;
  if(numberToSeed.toString() !== numStr) {
    scriptLogger.error(`Invalid number of users to seed given (${numStr}). Aborting...`);
    process.exit(1);
  }

  if(numberToSeed > 100) {
    scriptLogger.error(`Cowardly refusing to seed more than 100 users (you asked for ${numberToSeed}). Aborting...`);
    process.exit(1);
  }

  if(!emailBase.includes('@')) {
    scriptLogger.error(`The given email base (${emailBase}) does not appear to be a valid email address. Aborting...`);
    process.exit(1);
  }
  const emailParts = emailBase.split('@');

  for(let i = 0; i < numberToSeed; ++i) {
    const tag = getRandomTag();
    const created = await UserModel.createUser({
      username: `seeded${tag}`,
      password: `password${tag}`,
      email: `${emailParts[0]}+tb_seeded${tag}@${emailParts[1]}`,
    }, reqCtxForScript('seed-random-users'));

    scriptLogger.info(`Created user ${created.username} (${created.id})`);
  }
}

function printUsage() {
  console.log(`
seed-random-users.ts: seed a number of basic users

Usage: ./scripts/seed-random-users.ts <number> <email-base>

<number> is the number of users to seed.

<email-base> is a base email address to use as the seeded users' emails; they will be assigned using the plus trick.
  `.trim());
}

function getRandomTag() {
  return Math.floor(Math.random() * 10000).toString().padStart(4, '0');
}

main().catch(e => console.error(e));
