#!/usr/bin/env -S node --import tsx

import dotenv from 'dotenv';
import { initLoggers, getLogger } from '../../server/lib/logger.ts';
import dbClient, { testDatabaseConnection } from '../../server/lib/db.ts';

import { UserModel } from 'server/lib/models/user/user-model';
import { WorkModel } from 'server/lib/models/work/work-model';
import { TallyModel } from 'server/lib/models/tally/tally-model.wip';
import { GoalModel } from 'server/lib/models/goal/goal-model';
import { LeaderboardModel } from 'server/lib/models/leaderboard/leaderboard-model';

async function main() {
  process.env.NODE_ENV = 'development';
  dotenv.config();

  await initLoggers();
  const logger = getLogger('default').child({ service: 'seed' });

  await testDatabaseConnection();
}

main().catch(e => console.error(e));
