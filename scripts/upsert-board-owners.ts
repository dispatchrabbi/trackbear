#!/usr/bin/env -S node --import tsx

import dotenv from 'dotenv';
import { getNormalizedEnv } from '../server/lib/env.ts';

import winston from 'winston';
import { initLoggers } from '../server/lib/logger.ts';

import dbClient, { testDatabaseConnection } from '../server/lib/db.ts';

import { BOARD_PARTICIPANT_STATE, BOARD_PARTICIPANT_ROLE } from '../server/lib/models/board-wip/consts.ts';

async function main() {
  process.env.NODE_ENV = 'development';
  dotenv.config();
  await getNormalizedEnv();

  await initLoggers({ forceConsoles: true });
  const scriptLogger = winston.child({ service: 'upsert-board-owners.ts' });

  // test the database connection
  try {
    await testDatabaseConnection();
    scriptLogger.info('Database connection established');
  } catch(err) {
    console.error(`Could not connect to the database: ${err.message}`);
    scriptLogger.error(`${err.message}`, {
      message: err.message,
      stack: err.stack.split('\n'),
    });

    process.exit(2);
  }

  scriptLogger.info(`Script initialization complete. Starting main section...`);

  const report = {
    totalLeaderboardsExamined: 0,
    ownersAlreadyOwners: 0,
    ownersAdded: 0,
    ownerRolesUpdated: 0,
    ownerRolesNotUpdated: 0,
    ownersMissed: 0,
  };

  scriptLogger.info('Getting all leaderboards...');
  const allLeaderboards = await dbClient.board.findMany({
    include: {
      participants: true,
    },
  });
  
  for(const leaderboard of allLeaderboards) {
    scriptLogger.info(`Examining leaderboard id ${leaderboard.id} (${leaderboard.title})`);
    scriptLogger.info(`Owner ID is ${leaderboard.ownerId}`);
    report.totalLeaderboardsExamined++;
    
    const participantOwner = leaderboard.participants.find(p => p.userId === leaderboard.ownerId);

    if(participantOwner && participantOwner.role === BOARD_PARTICIPANT_ROLE.OWNER) {
      scriptLogger.info(`Found participant owner (pcpt id ${participantOwner.id}) and they are already an owner!`);
      report.ownersAlreadyOwners++;
    } else if(participantOwner && participantOwner.role !== BOARD_PARTICIPANT_ROLE.OWNER) {
      scriptLogger.info(`Found participant owner (pcpt id ${participantOwner.id}). Upgrading them...`);
      // update their role and starred status
      await dbClient.boardParticipant.update({
        where: {
          id: participantOwner.id,
        },
        data: {
          role: BOARD_PARTICIPANT_ROLE.OWNER,
          // we're moving starred to participant-only
          starred: leaderboard.starred,
        }
      });
      
      report.ownerRolesUpdated++;
    } else {
      scriptLogger.info(`Did not find a participant owner. Creating them a participant...`);
      // make a participant record for the owner
      await dbClient.boardParticipant.create({
        data: {
          state: BOARD_PARTICIPANT_STATE.ACTIVE,
          user: { connect: { id: leaderboard.ownerId }},
          board: { connect: { id: leaderboard.id }},
          role: BOARD_PARTICIPANT_ROLE.OWNER,
          // we're moving starred to participant-only
          starred: leaderboard.starred,
        },
      });
      
      report.ownersAdded++;
    }
  }

  scriptLogger.info('Checking our work...');
  const allLeaderboardsAgain = await dbClient.board.findMany({
    include: {
      participants: true,
    },
  });

  for(const leaderboard of allLeaderboardsAgain) {
    const participantOwner = leaderboard.participants.find(
      p => p.userId === leaderboard.ownerId && p.role === BOARD_PARTICIPANT_ROLE.OWNER
    );

    if(!participantOwner) {
      scriptLogger.info(`Issue detected on leaderboard id ${leaderboard.id} (${leaderboard.title})`);
      scriptLogger.info(`Owner ID is ${leaderboard.ownerId}`);
      
      const participantNonOwner = leaderboard.participants.find(
        p => p.userId === leaderboard.ownerId
      );

      if(participantNonOwner) {
        report.ownerRolesNotUpdated++;
        scriptLogger.error(`Found a participant with the owner's id but participant role: ${participantNonOwner.id}!`);
      }  else {
        report.ownersMissed++;
        scriptLogger.error(`Found no participant with the owner's id!`);
      }
    }
  }

  scriptLogger.info(`Upsert is over. Here's the report:`)
  scriptLogger.info(`- Leaderboards examined: ${report.totalLeaderboardsExamined}`);
  scriptLogger.info(`- 👍 Owners aready owners: ${report.ownersAlreadyOwners}`);
  scriptLogger.info(`- ✅ Owners added: ${report.ownersAdded}`);
  scriptLogger.info(`- ✅ Owner roles updated: ${report.ownerRolesUpdated}`);
  scriptLogger.info(`- ❌ Owner roles not updated: ${report.ownerRolesNotUpdated}`);
  scriptLogger.info(`- ❌ Owners missed: ${report.ownersMissed}`);
}

main().catch(e => console.error(e));