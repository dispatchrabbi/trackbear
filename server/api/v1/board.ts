import { HTTP_METHODS, ACCESS_LEVEL, type RouteConfig } from 'server/lib/api.ts';
import { ApiResponse, success, failure } from '../../lib/api-response.ts';
import { RequestWithUser } from '../../lib/middleware/access.ts';

import winston from 'winston';

import { z } from 'zod';
import { zUuidParam, NonEmptyArray } from '../../lib/validators.ts';

import dbClient from '../../lib/db.ts';
import type { BoardParticipant } from '@prisma/client';

import { BOARD_PARTICIPANT_STATE, BOARD_STATE, getFullBoard, getExtendedBoardsForUser, getBoardParticipationForUser } from '../../lib/models/board-wip/consts.ts';
import type { Board, BoardWithParticipantBios, BoardWithParticipants, BoardGoal, ParticipantGoal, FullBoard } from '../../lib/models/board-wip/types.ts';
import { TALLY_MEASURE, TallyMeasure } from '../../lib/models/tally/consts.ts';
import { WORK_STATE } from '../../lib/models/work/consts.ts';
import { TAG_STATE } from '../../lib/models/tag/consts.ts';

import { logAuditEvent } from '../../lib/audit-events.ts';

export async function handleGetBoards(req: RequestWithUser, res: ApiResponse<BoardWithParticipantBios[]>) {
  const boards = await getExtendedBoardsForUser(req.user.id);

  return res.status(200).send(success(boards));
}

export async function handleGetBoard(req: RequestWithUser, res: ApiResponse<FullBoard>) {
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

export async function handleCreateBoard(req: RequestWithUser, res: ApiResponse<Board>) {
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

      participants: {
        create: [{
          state: BOARD_PARTICIPANT_STATE.ACTIVE,

          userId: user.id,

          isParticipant: false,
          isOwner: true,
        }],
      },
    },
  });

  await logAuditEvent('board:create', user.id, board.id, null, null, req.sessionID);
  winston.info(`BOARD: ${user.id} (${user.username}) just created Board ${board.id} (UUID ${board.uuid}: ${board.title})`);

  return res.status(201).send(success(board as Board));
}

// PATCH /:uuid - update a board
export type BoardUpdatePayload = Partial<BoardCreatePayload>;
const zBoardUpdatePayload = zBoardCreatePayload.partial();

export async function handleUpdateBoard(req: RequestWithUser, res: ApiResponse<Board>) {
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

export async function handleStarBoard(req: RequestWithUser, res: ApiResponse<BoardStarUpdateResponse>) {
  const user = req.user;
  const payload = req.body as BoardStarUpdatePayload;

  const targetBoard = await dbClient.board.findUnique({
    where: {
      uuid: req.params.uuid,
      state: BOARD_STATE.ACTIVE,
      OR: [
        { ownerId: user.id },
        { participants: { some: { userId: user.id, state: BOARD_PARTICIPANT_STATE.ACTIVE } } },
      ],
    },
  });

  if(!targetBoard) {
    return res.status(404).send(failure('NOT_FOUND', `Could not find a board with UUID ${req.params.uuid}`));
  }

  const [board, participant] = await dbClient.$transaction([
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
export async function handleDeleteBoard(req: RequestWithUser, res: ApiResponse<Board>) {
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
export async function handleGetBoardParticipation(req: RequestWithUser, res: ApiResponse<BoardWithParticipants>) {
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

export async function handleUpdateBoardParticipation(req: RequestWithUser, res: ApiResponse<BoardParticipant>) {
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

  // TODO: turn this into an upsert now that the combo of board and user are unique
  const existingParticipantRecord = await dbClient.boardParticipant.findFirst({
    where: {
      state: BOARD_PARTICIPANT_STATE.ACTIVE,
      userId: user.id,
      board: { uuid: req.params.uuid },
    },
  });

  const isUpdate = !!existingParticipantRecord;
  let participant;
  if(isUpdate) {
    participant = await dbClient.boardParticipant.update({
      where: {
        state: BOARD_PARTICIPANT_STATE.ACTIVE,
        id: existingParticipantRecord.id,
      },
      data: {
        isParticipant: true,

        goal: payload.goal,
        worksIncluded: payload.works ?
            { set: payload.works.map(workId => ({
              id: workId,
              ownerId: user.id,
              state: WORK_STATE.ACTIVE,
            })) } :
          undefined,
        tagsIncluded: payload.tags ?
            { set: payload.tags.map(workId => ({
              id: workId,
              ownerId: user.id,
              state: TAG_STATE.ACTIVE,
            })) } :
          undefined,
      },
    });
  } else {
    participant = await dbClient.boardParticipant.create({
      data: {
        state: BOARD_PARTICIPANT_STATE.ACTIVE,
        user: { connect: { id: user.id } },
        board: { connect: { uuid: req.params.uuid } },
        isParticipant: true,

        goal: payload.goal,
        worksIncluded: payload.works ?
            { connect: payload.works.map(workId => ({
              id: workId,
              ownerId: user.id,
              state: WORK_STATE.ACTIVE,
            })) } :
          undefined,
        tagsIncluded: payload.tags ?
            { connect: payload.tags.map(workId => ({
              id: workId,
              ownerId: user.id,
              state: TAG_STATE.ACTIVE,
            })) } :
          undefined,
      },
    });
  }

  return res.status(isUpdate ? 200 : 201).send(success(participant));
}

// DELETE /:uuid/participation - leave a board
export async function handleDeleteBoardParticipation(req: RequestWithUser, res: ApiResponse<BoardParticipant>) {
  const user = req.user;

  // Only delete if they aren't an owner; otherwise, just remove the participant flag
  // TODO: redo this whole situation so it's less awkward
  const existingParticipantRecord = await dbClient.boardParticipant.findFirst({
    where: {
      state: BOARD_PARTICIPANT_STATE.ACTIVE,
      userId: user.id,
      board: { uuid: req.params.uuid },
    },
  });

  let participant;
  if(existingParticipantRecord.isOwner) {
    participant = await dbClient.boardParticipant.update({
      where: {
        state: BOARD_PARTICIPANT_STATE.ACTIVE,
        id: existingParticipantRecord.id,
      },
      data: {
        isParticipant: false,
      },
    });
  } else {
    participant = await dbClient.boardParticipant.delete({
      where: {
        state: BOARD_PARTICIPANT_STATE.ACTIVE,
        id: existingParticipantRecord.id,
      },
    });
  }

  return res.status(200).send(success(participant));
}

const routes: RouteConfig[] = [
  {
    path: '/',
    method: HTTP_METHODS.GET,
    handler: handleGetBoards,
    accessLevel: ACCESS_LEVEL.USER,
  },
  {
    path: '/:uuid',
    method: HTTP_METHODS.GET,
    handler: handleGetBoard,
    accessLevel: ACCESS_LEVEL.USER,
    paramsSchema: zUuidParam(),
  },
  {
    path: '/',
    method: HTTP_METHODS.POST,
    handler: handleCreateBoard,
    accessLevel: ACCESS_LEVEL.USER,
    bodySchema: zBoardCreatePayload,
  },
  {
    path: '/:uuid',
    method: HTTP_METHODS.PATCH,
    handler: handleUpdateBoard,
    accessLevel: ACCESS_LEVEL.USER,
    paramsSchema: zUuidParam(),
    bodySchema: zBoardUpdatePayload,
  },
  {
    path: '/:uuid/star',
    method: HTTP_METHODS.PATCH,
    handler: handleStarBoard,
    accessLevel: ACCESS_LEVEL.USER,
    paramsSchema: zUuidParam(),
    bodySchema: zBoardStarUpdatePayload,
  },
  {
    path: '/:uuid',
    method: HTTP_METHODS.DELETE,
    handler: handleDeleteBoard,
    accessLevel: ACCESS_LEVEL.USER,
    paramsSchema: zUuidParam(),
  },
  {
    path: '/:uuid/participation',
    method: HTTP_METHODS.GET,
    handler: handleGetBoardParticipation,
    accessLevel: ACCESS_LEVEL.USER,
    paramsSchema: zUuidParam(),
  },
  {
    path: '/:uuid/participation',
    method: HTTP_METHODS.POST,
    handler: handleUpdateBoardParticipation,
    accessLevel: ACCESS_LEVEL.USER,
    paramsSchema: zUuidParam(),
    bodySchema: zBoardParticipantPayload,
  },
  {
    path: '/:uuid/participation',
    method: HTTP_METHODS.DELETE,
    handler: handleDeleteBoardParticipation,
    accessLevel: ACCESS_LEVEL.USER,
    paramsSchema: zUuidParam(),
  },
];

export default routes;
