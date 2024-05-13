import type { Board as PrismaBoard, BoardParticipant, User, Tally } from "@prisma/client";
import { TALLY_STATE, TallyMeasure } from "./tally.ts";
import { USER_STATE } from "./user.ts";

import dbClient from "../db.ts";

import { omit } from "../obj.ts";

export const BOARD_STATE = {
  ACTIVE:   'active',
  DELETED:  'deleted',
};

export const BOARD_PARTICIPANT_STATE = {
  ACTIVE: 'active',
  // I anticipate that we'll eventually want a BANNED or KICKED state of some kind
};

export type BoardGoal = Record<TallyMeasure, number>;
export type Board = PrismaBoard & { goal: BoardGoal };

export type FullBoard = Board & {
  participants: (BoardParticipant & {
    user: User;
    tallies: Tally[];
  })[];
};
export async function getFullBoard(uuid: string) {
  const board = await dbClient.board.findUnique({
    where: {
      state: BOARD_STATE.ACTIVE,
      uuid: uuid,
    },
    include: {
      participants: {
        where: {
          state: BOARD_PARTICIPANT_STATE.ACTIVE,
          user: { is: { state: USER_STATE.ACTIVE } }
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
      // only include tallies within the time range (if one exists)
      date: {
        gte: board.startDate || undefined,
        lte: board.endDate || undefined,
      },
      // forgive me for what I do here
      OR: board.participants.map(participant => ({
        ownerId: participant.userId,
        // only include tallies from works specified in the participant's config (if any were)
        workId: participant.worksIncluded.length > 0 ? { in: participant.worksIncluded.map(work => work.id ) } : undefined,
        // only include tallies with at least one tag specified in the participant's config (if any were)
        tags: participant.tagsIncluded.length > 0 ? { some: { id: { in: participant.tagsIncluded.map(tag => tag.id ) } } } : undefined,
      }))
    }
  });

  const fullBoard = {
    ...board as Board,
    participants: board.participants.map(participant => ({
      ...omit(participant, ['worksIncluded', 'tagsIncluded']),
      tallies: tallies.filter(tally => tally.ownerId === participant.userId),
    })),
  };

  return fullBoard;
}
