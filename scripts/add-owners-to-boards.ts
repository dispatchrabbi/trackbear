#!/usr/bin/env -S node --import tsx

import dotenv from 'dotenv';
import { getNormalizedEnv } from '../server/lib/env.ts';

import winston from 'winston';
import { initLoggers } from '../server/lib/logger.ts';

import dbClient from '../server/lib/db.ts';
import { BOARD_PARTICIPANT_STATE } from '../server/lib/models/board-wip/consts.ts';

async function main() {
  process.env.NODE_ENV = 'development';
  dotenv.config();
  await getNormalizedEnv();

  await initLoggers();
  const scriptLogger = winston.child({ service: 'add-owners-to-boards.ts' });

  scriptLogger.info(`Script initialization complete. Starting main section...`);

  const report = {
    boardsExamined: 0,
    ownersFoundAndFlagged: 0,
    ownersMissingAndCreated: 0,
    boardsRecalled: 0,
    ownersConfirmed: 0,
    ownersNotFlagged: 0,
    ownersNotCreated: 0,
  };

  scriptLogger.info(`Getting all boards...`);
  const allBoards = await dbClient.board.findMany();

  for(const board of allBoards) {
    scriptLogger.info(`Examining board ${board.id}/${board.uuid} (${board.title}), owned by ${board.ownerId}`);
    report.boardsExamined++;

    scriptLogger.info(`  - Finding the participant record for the owner...`);
    const ownerParticipant = await dbClient.boardParticipant.findUnique({
      where: {
        userId_boardId: {
          userId: board.ownerId,
          boardId: board.id,
        },
      },
    });

    if(ownerParticipant) {
      scriptLogger.info(`  - Found! Setting the isOwner flag...`);

      await dbClient.boardParticipant.update({
        where: {
          id: ownerParticipant.id,
        },
        data: {
          isOwner: true,
        },
      });

      report.ownersFoundAndFlagged++;
    } else {
      scriptLogger.info(`  - Not found! Creating a participant with the isOwner flag but NOT the isParticipant flag...`);

      await dbClient.boardParticipant.create({
        data: {
          state: BOARD_PARTICIPANT_STATE.ACTIVE,
          userId: board.ownerId,
          boardId: board.id,
          starred: board.starred,
          isParticipant: false,
          isOwner: true,
        },
      });

      report.ownersMissingAndCreated++;
    }
  }

  scriptLogger.info(`Double-checking our work...`);
  const allBoardsAgain = await dbClient.board.findMany();

  for(const board of allBoardsAgain) {
    scriptLogger.info(`Examining board ${board.id}/${board.uuid} (${board.title}), owned by ${board.ownerId}`);
    report.boardsRecalled++;

    scriptLogger.info(`  - Finding the participant record for the owner...`);
    const ownerParticipant = await dbClient.boardParticipant.findUnique({
      where: {
        userId_boardId: {
          userId: board.ownerId,
          boardId: board.id,
        },
      },
    });

    if(ownerParticipant) {
      if(ownerParticipant.isOwner) {
        scriptLogger.info(`  - Found the record and they are marked as an owner.`);
        report.ownersConfirmed++;
      } else {
        scriptLogger.info(`  - Found the record but they are not marked as an owner!`);
        report.ownersNotFlagged++;
      }
    } else {
      scriptLogger.info(`  - Did not find a record!`);
      report.ownersNotCreated++;
    }
  }

  scriptLogger.info(`Final report:`);
  scriptLogger.info(`🔎 Boards examined: ${report.boardsExamined}`);
  scriptLogger.info(`🏁 Owners found and flagged: ${report.ownersFoundAndFlagged}`);
  scriptLogger.info(`👋 Owners missing and created: ${report.ownersMissingAndCreated}`);
  scriptLogger.info(`🔄 Boards recalled: ${report.boardsRecalled}`);
  scriptLogger.info(`✅ Owners confirmed: ${report.ownersConfirmed}`);
  scriptLogger.info(`🚩Owners not flagged: ${report.ownersNotFlagged}`);
  scriptLogger.info(`❌ Owners not created: ${report.ownersNotCreated}`);
}

main().catch(e => console.error(e));
