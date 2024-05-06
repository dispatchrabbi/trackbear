import { Router } from "express";
import { ApiResponse, success, failure, h } from '../../lib/api-response.ts';

import { requireUser, RequestWithUser } from '../../lib/auth.ts';

import { z } from 'zod';
import { zUuidParam, NonEmptyArray } from '../../lib/validators.ts';
import { validateBody, validateParams } from "../../lib/middleware/validate.ts";

import dbClient from "../../lib/db.ts";
import type { Board as PrismaBoard, BoardParticipant, User, Tally } from "@prisma/client";
import type { BoardGoal } from "../../lib/models/board.ts"
export type Board = PrismaBoard & { goal: BoardGoal };

import { BOARD_PARTICIPANT_STATE, BOARD_STATE } from "../../lib/models/board.ts";
import { USER_STATE } from "server/lib/models/user.ts";
import { TALLY_STATE } from "server/lib/models/tally.ts";

import { logAuditEvent } from '../../lib/audit-events.ts';
import { omit } from "server/lib/obj.ts";

const boardRouter = Router();
export default boardRouter;

// GET / - get boards you have access to, either as an owner or a participant
boardRouter.get('/',
  requireUser,
  h(async (req: RequestWithUser, res: ApiResponse<Board[]>) =>
{
  const boards = await dbClient.board.findMany({
    where: {
      state: BOARD_STATE.ACTIVE,
      OR: [
        { ownerId: req.user.id },
        { participants: { some: { userId: req.user.id } } },
      ]
    }
  });

  return res.status(200).send(success(boards as Board[]));
}));

// GET /:uuid - get all the info about a board, including participant info
export type FullBoardResponse = Board & {
  participants: (BoardParticipant & {
    user: User;
    tallies: Tally[];
  })[];
}
boardRouter.get('/:uuid',
  requireUser,
  validateParams(zUuidParam()),
  h(async (req: RequestWithUser, res: ApiResponse<FullBoardResponse>) =>
{
  const board = await dbClient.board.findUnique({
    where: {
      state: BOARD_STATE.ACTIVE,
      uuid: req.params.uuid,
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
    return res.status(404).send(failure('NOT_FOUND', `Could not find a board with UUID ${req.params.uuid}`));
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

  res.status(200).send(success(fullBoard));
}));

// POST / - create a new board

// PATCH /:uuid - update a board

// DELETE /:uuid - delete a board

// GET /:uuid/participation - get a small amount of info about a board, to check if you can join it

// POST /:uuid/participation - add or modify your own participation

// DELETE /:uuid/participation - leave a board
