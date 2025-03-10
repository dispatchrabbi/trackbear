import { TALLY_STATE } from "../tally/consts.ts";
import { USER_STATE } from "../user/consts.ts";

import dbClient from "../../db.ts";

import { pick } from "../../obj.ts";
import type { Board, BoardWithParticipantBios, BoardWithParticipants, FullBoard, ParticipantGoal } from "./types.ts";

export const BOARD_STATE = {
  ACTIVE:   'active',
  DELETED:  'deleted',
};

export const BOARD_PARTICIPANT_STATE = {
  ACTIVE: 'active',
  // I anticipate that we'll eventually want a BANNED or KICKED state of some kind
};

export async function getExtendedBoardsForUser(userId: number): Promise<BoardWithParticipantBios[]> {
  const boards = await dbClient.board.findMany({
    where: {
      state: BOARD_STATE.ACTIVE,
      participants: {
        some: {
          userId: userId,
          state: BOARD_PARTICIPANT_STATE.ACTIVE,
        }
      },
    },
    include: {
      participants: {
        where: {
          state: BOARD_PARTICIPANT_STATE.ACTIVE,
          user: { is: { state: USER_STATE.ACTIVE } },
          isParticipant: true,
        },
        include: {
          user: true,
        },
      },
    }
  });

  const extendedBoards = boards.map(board => ({
    ...board as Board,
    // say the board is starred if it's starred and owned by the user or if the user's participant record has it starred
    starred: (board.ownerId === userId && board.starred) || board.participants.filter(p => p.userId === userId).some(p => p.starred),
    participants: board.participants.map(participant => pick(participant.user, ['uuid', 'displayName', 'avatar'])),
  }));

  return extendedBoards;
}

export async function getFullBoard(uuid: string): Promise<FullBoard | null> {
  const board = await dbClient.board.findUnique({
    where: {
      state: BOARD_STATE.ACTIVE,
      uuid: uuid,
    },
    include: {
      participants: {
        where: {
          state: BOARD_PARTICIPANT_STATE.ACTIVE,
          user: { is: { state: USER_STATE.ACTIVE } },
          isParticipant: true,
        },
        include: {
          user: true,
          worksIncluded: true,
          tagsIncluded: true,
        },
      },
    }
  });

  if(!board) {
    return null;
  }

  const tallies = await dbClient.tally.findMany({
    where: {
      state: TALLY_STATE.ACTIVE,
      // if there's an overall board goal, only include tallies with the board's measures
      measure: board.individualGoalMode ? undefined : { in: board.measures },
      // only include tallies within the time range (if one exists)
      date: {
        gte: board.startDate || undefined,
        lte: board.endDate || undefined,
      },
      // forgive me for what I do here
      OR: board.participants.map(participant => ({
        // the tally should be owned by the participant
        ownerId: participant.userId,
        // only include tallies with the measure from the individual goal, if there are individual goals
        measure: board.individualGoalMode ? ((participant.goal as ParticipantGoal)?.measure ?? 'do-not-return-tallies') : undefined,
        // only include tallies from works specified in the participant's config (if any were)
        workId: participant.worksIncluded.length > 0 ? { in: participant.worksIncluded.map(work => work.id ) } : undefined,
        // only include tallies with at least one tag specified in the participant's config (if any were)
        tags: participant.tagsIncluded.length > 0 ? { some: { id: { in: participant.tagsIncluded.map(tag => tag.id ) } } } : undefined,
      }))
    }
  });

  const fullBoard: FullBoard = {
    ...board as Board,
    participants: board.participants.map(participant => ({
      ...pick(participant.user, ['uuid', 'displayName', 'avatar']),
      goal: participant.goal as ParticipantGoal,
      tallies: tallies.filter(tally => tally.ownerId === participant.userId).map(tally => ({
        uuid: tally.uuid,
        date: tally.date,
        count: tally.count,
        measure: tally.measure,
      })),
    })),
  };

  return fullBoard;
}

export async function getBoardParticipationForUser(uuid: string, userId: number): Promise<BoardWithParticipants> {
  const board = await dbClient.board.findUnique({
    where: {
      state: BOARD_STATE.ACTIVE,
      uuid: uuid,
      isJoinable: true,
    },
    include: {
      participants: {
        where: {
          userId: userId,
          isParticipant: true,
        },
        include: {
          worksIncluded: true,
          tagsIncluded: true,
        }
      },
    },
  }) as BoardWithParticipants;

  return board;
}
