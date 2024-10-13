import { Router } from "express";
import { ApiResponse, success, failure, h } from '../../lib/api-response.ts';
import { requireUser, RequestWithUser } from '../../lib/auth.ts';

import winston from "winston";

import { z } from 'zod';
import { zUuidParam, NonEmptyArray } from '../../lib/validators.ts';
import { validateBody, validateParams } from "../../lib/middleware/validate.ts";

import dbClient from "../../lib/db.ts";
import type { BoardParticipant } from "@prisma/client";
import type { Board, BoardGoal, ParticipantGoal } from "../../lib/models/board.ts";

import { BOARD_PARTICIPANT_STATE, BOARD_STATE, getFullBoard, FullBoard, getExtendedBoardsForUser, ExtendedBoard, getBoardParticipationForUser, BoardWithParticipants } from "../../lib/models/board.ts";
import { TALLY_MEASURE, TallyMeasure } from "../../lib/models/tally.ts";
import { WORK_STATE } from '../../lib/models/work.ts';
import { TAG_STATE } from "../../lib/models/tag.ts";

import { logAuditEvent } from '../../lib/audit-events.ts';

const boardRouter = Router();
export default boardRouter;

// GET / - get boards you have access to, either as an owner or a participant
boardRouter.get('/',
  requireUser,
  h(getBoards)
);
export async function getBoards(req: RequestWithUser, res: ApiResponse<ExtendedBoard[]>) {
  const boards = await getExtendedBoardsForUser(req.user.id);

  return res.status(200).send(success(boards));
}

// GET /:uuid - get all the info about a board, including participant info
boardRouter.get('/:uuid',
  requireUser,
  validateParams(zUuidParam()),
  h(getBoard)
);
export async function getBoard(req: RequestWithUser, res: ApiResponse<FullBoard>) {
  const board = await getFullBoard(req.params.uuid);

  if(!board) {
    return res.status(404).send(failure('NOT_FOUND', `Could not find a board with UUID ${req.params.uuid}`));
  }

  if((board.ownerId !== req.user.id) && !(board.isPublic || board.participants.some(p => p.uuid === req.user.uuid))) {
    if(board.isJoinable) {
      return res.status(428).send(failure('MUST_JOIN', `User must join the board with UUID ${req.params.uuid} before accessing its data`));
    } else {
      return res.status(404).send(failure('NOT_FOUND', `Could not find a board with UUID ${req.params.uuid}`));
    }
  }

  return res.status(200).send(success(board));
}

// POST / - create a new board
export type BoardCreatePayload = {
  title: string;
  description: string;
  measures: TallyMeasure[];
  startDate?: string;
  endDate?: string;
  goal: BoardGoal;
  fundraiserMode: boolean;
  individualGoalMode: boolean;
  isJoinable?: boolean;
  isPublic?: boolean;
};
const zBoardCreatePayload = z.object({
  title: z.string().min(1),
  description: z.string(),
  measures: z.array(z.enum(Object.values(TALLY_MEASURE) as NonEmptyArray<string>)),
  startDate: z.string().nullable(),
  endDate: z.string().nullable(),
  goal: z.record(z.enum(Object.values(TALLY_MEASURE) as NonEmptyArray<string>), z.number().int()).nullable(),
  individualGoalMode: z.boolean().nullable().default(false),
  fundraiserMode: z.boolean().nullable().default(false),
  isJoinable: z.boolean().nullable().default(false),
  isPublic: z.boolean().nullable().default(false),
}).strict();

boardRouter.post('/',
  requireUser,
  validateBody(zBoardCreatePayload),
  h(createBoard)
);
export async function createBoard(req: RequestWithUser, res: ApiResponse<Board>) {
  const user = req.user;
  const payload = req.body as BoardCreatePayload;

  // normalizing the input
  if(payload.individualGoalMode) {
    payload.goal = {};
    payload.measures = [];
    payload.fundraiserMode = false;
  }

  const board = await dbClient.board.create({
    data: {
      state: BOARD_STATE.ACTIVE,
      ownerId: user.id,

      ...payload,
    },
  });

  await logAuditEvent('board:create', user.id, board.id, null, null, req.sessionID);
  winston.info(`BOARD: ${user.id} (${user.username}) just created Board ${board.id} (UUID ${board.uuid}: ${board.title})`);

  return res.status(200).send(success(board as Board));
}

// PATCH /:uuid - update a board
export type BoardUpdatePayload = Partial<BoardCreatePayload>;
const zBoardUpdatePayload = zBoardCreatePayload.partial();

boardRouter.patch('/:uuid',
  requireUser,
  validateParams(zUuidParam()),
  validateBody(zBoardUpdatePayload),
  h(updateBoard)
);
export async function updateBoard(req: RequestWithUser, res: ApiResponse<Board>) {
  const user = req.user;
  const payload = req.body as BoardUpdatePayload;

  // normalizing the input
  if(payload.individualGoalMode) {
    payload.goal = {};
    payload.measures = [];
    payload.fundraiserMode = false;
  }

  const board = await dbClient.board.update({
    where: {
      uuid: req.params.uuid,
      ownerId: req.user.id,
      state: BOARD_STATE.ACTIVE,
    },
    data: {
      ...payload,
    },
  });

  await logAuditEvent('board:update', user.id, board.id, null, null, req.sessionID);

  return res.status(200).send(success(board as Board));
}

// PATCH /:uuid/star - update a board's star status
export type BoardStarUpdatePayload = {
  starred: boolean;
};
const zBoardStarUpdatePayload = z.object({
  starred: z.boolean(),
}).strict();

export type BoardStarUpdateResponse = {
  starred: boolean;
  board: boolean;
  participant: boolean;
};

boardRouter.patch('/:uuid/star',
  requireUser,
  validateParams(zUuidParam()),
  validateBody(zBoardStarUpdatePayload),
  h(starBoard)
);
export async function starBoard(req: RequestWithUser, res: ApiResponse<BoardStarUpdateResponse>) {
  const user = req.user;
  const payload = req.body as BoardStarUpdatePayload;

  const targetBoard = await dbClient.board.findUnique({
    where: {
      uuid: req.params.uuid,
      state: BOARD_STATE.ACTIVE,
      OR: [
        { ownerId: user.id },
        { participants: { some: { userId: user.id, state: BOARD_PARTICIPANT_STATE.ACTIVE } } },
      ]
    },
  });

  if(!targetBoard) {
    return res.status(404).send(failure('NOT_FOUND', `Could not find a board with UUID ${req.params.uuid}`));
  }

  const [ board, participant ] = await dbClient.$transaction([
    // update the board (if one exists)
    dbClient.board.updateMany({
      where: {
        ownerId: user.id,
        id: targetBoard.id,
        state: BOARD_STATE.ACTIVE,
      },
      data: {
        starred: payload.starred,
      },
    }),
    // update the participant (if one exists)
    dbClient.boardParticipant.updateMany({
      where: {
        userId: user.id,
        boardId: targetBoard.id,
        state: BOARD_PARTICIPANT_STATE.ACTIVE,
      },
      data: {
        starred: payload.starred,
      },
    }),
  ]);

  const summary: BoardStarUpdateResponse = {
    starred: payload.starred,
    board: board.count > 0,
    participant: participant.count > 0,
  };

  await logAuditEvent('board:star', user.id, targetBoard.id, null, summary, req.sessionID);

  return res.status(200).send(success(summary));
}

// DELETE /:uuid - delete a board
boardRouter.delete('/:uuid',
  requireUser,
  validateParams(zUuidParam()),
  h(deleteBoard)
);
export async function deleteBoard(req: RequestWithUser, res: ApiResponse<Board>) {
  const user = req.user;

  // Don't actually delete the board; set the status instead
  const board = await dbClient.board.update({
    data: {
      state: BOARD_STATE.DELETED,
    },
    where: {
      uuid: req.params.uuid,
      ownerId: req.user.id,
      state: BOARD_STATE.ACTIVE,
    },
  });

  await logAuditEvent('board:delete', user.id, board.id, null, null, req.sessionID);

  return res.status(200).send(success(board as Board));
};

// GET /:uuid/participation - get basic info about a board, to check if you can join it
boardRouter.get('/:uuid/participation',
  requireUser,
  validateParams(zUuidParam()),
  h(getBoardParticipation)
);
export async function getBoardParticipation(req: RequestWithUser, res: ApiResponse<BoardWithParticipants>) {
  // TODO: if invites or bans are implemented, this will need to be changed
  const board = await getBoardParticipationForUser(req.params.uuid, req.user.id);

  if(!board) {
    return res.status(404).send(failure('NOT_FOUND', `Could not find a board with UUID ${req.params.uuid}`));
  }

  return res.status(200).send(success(board as BoardWithParticipants));
}

// POST /:uuid/participation - add or modify your own participation
export type BoardParticipantPayload = {
  goal: ParticipantGoal;
  works: number[];
  tags: number[];
};
const zBoardParticipantPayload = z.object({
  goal: z.object({
    measure: z.enum(Object.values(TALLY_MEASURE) as NonEmptyArray<string>),
    count: z.number().int(),
  }).nullable(),
  works: z.array(z.number().int()),
  tags: z.array(z.number().int()),
}).strict();

boardRouter.post('/:uuid/participation',
  requireUser,
  validateParams(zUuidParam()),
  validateBody(zBoardParticipantPayload),
  h(updateBoardParticipation)
);
export async function updateBoardParticipation(req: RequestWithUser, res: ApiResponse<BoardParticipant>) {
  const user = req.user;
  const payload = req.body as BoardParticipantPayload;

  // first, look up the board we're dealing with
  const board = await dbClient.board.findUnique({
    where: {
      state: BOARD_STATE.ACTIVE,
      uuid: req.params.uuid,
      isJoinable: true,
    },
  });
  if(!board) {
    return res.status(404).send(failure('NOT_FOUND', `Could not find a board with UUID ${req.params.uuid}`));
  }

  // normalize the data - we never store a goal unless there are individual goals
  if(!board.individualGoalMode) {
    payload.goal = null;
  }

  // we can't do an upsert because the combination of user and board isn't actually unique
  // this is on purpose: we may want someone in the future to be able to join a board multiple times
  // of course, that would probably mean we need a new set of endpoints but... baby steps
  const existingParticipantRecord = await dbClient.boardParticipant.findFirst({
    where: {
      state: BOARD_PARTICIPANT_STATE.ACTIVE,
      userId: user.id,
      board: { uuid: req.params.uuid },
    },
  });

  let participant;
  if(existingParticipantRecord) {
    participant = await dbClient.boardParticipant.update({
      where: {
        state: BOARD_PARTICIPANT_STATE.ACTIVE,
        id: existingParticipantRecord.id,
      },
      data: {
        goal: payload.goal,
        worksIncluded: payload.works ? { set: payload.works.map(workId => ({
          id: workId,
          ownerId: user.id,
          state: WORK_STATE.ACTIVE,
        })) } : undefined,
        tagsIncluded: payload.tags ? { set: payload.tags.map(workId => ({
          id: workId,
          ownerId: user.id,
          state: TAG_STATE.ACTIVE,
        })) } : undefined,
      },
    });
  } else {
    participant = await dbClient.boardParticipant.create({
      data: {
        state: BOARD_PARTICIPANT_STATE.ACTIVE,
        user: { connect: { id: user.id }},
        board: { connect: { uuid: req.params.uuid } },

        goal: payload.goal,
        worksIncluded: payload.works ? { connect: payload.works.map(workId => ({
          id: workId,
          ownerId: user.id,
          state: WORK_STATE.ACTIVE,
        })) } : undefined,
        tagsIncluded: payload.tags ? { connect: payload.tags.map(workId => ({
          id: workId,
          ownerId: user.id,
          state: TAG_STATE.ACTIVE,
        })) } : undefined,
      }
    });
  }

  return res.status(200).send(success(participant));
}

// DELETE /:uuid/participation - leave a board
boardRouter.delete('/:uuid/participation',
  requireUser,
  validateParams(zUuidParam()),
  h(deleteBoardParticipation)
);
export async function deleteBoardParticipation(req: RequestWithUser, res: ApiResponse<BoardParticipant>) {
  const user = req.user;

  // we can't do a delete because the combination of user and board isn't actually unique
  // this is on purpose: we may want someone in the future to be able to join a board multiple times
  // of course, that would probably mean we need a new set of endpoints but... baby steps
  const existingParticipantRecord = await dbClient.boardParticipant.findFirst({
    where: {
      state: BOARD_PARTICIPANT_STATE.ACTIVE,
      userId: user.id,
      board: { uuid: req.params.uuid },
    },
  });

  const participant = await dbClient.boardParticipant.delete({
    where: {
      state: BOARD_PARTICIPANT_STATE.ACTIVE,
      id: existingParticipantRecord.id,
    },
  });

  return res.status(200).send(success(participant));
}
