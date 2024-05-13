import { Router } from "express";
import { ApiResponse, success, failure, h } from '../../lib/api-response.ts';
import { requireUser, RequestWithUser } from '../../lib/auth.ts';

import winston from "winston";

import { z } from 'zod';
import { zUuidParam, NonEmptyArray } from '../../lib/validators.ts';
import { validateBody, validateParams } from "../../lib/middleware/validate.ts";

import dbClient from "../../lib/db.ts";
import type { BoardParticipant } from "@prisma/client";
import type { Board, BoardGoal } from "../../lib/models/board.ts"

import { BOARD_PARTICIPANT_STATE, BOARD_STATE, getFullBoard, FullBoard } from "../../lib/models/board.ts";
import { TALLY_MEASURE } from "../../lib/models/tally.ts";
import { WORK_STATE } from '../../lib/models/work.ts';
import { TAG_STATE } from "../../lib/models/tag.ts";

import { logAuditEvent } from '../../lib/audit-events.ts';

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
boardRouter.get('/:uuid',
  requireUser,
  validateParams(zUuidParam()),
  h(async (req: RequestWithUser, res: ApiResponse<FullBoard>) =>
{
  const board = await getFullBoard(req.params.uuid);

  if(!board) {
    return res.status(404).send(failure('NOT_FOUND', `Could not find a board with UUID ${req.params.uuid}`));
  }

  res.status(200).send(success(board));
}));

// POST / - create a new board
type BoardCreatePayload = {
  title: string;
  description: string;
  startDate?: string;
  endDate?: string;
  goal: BoardGoal;
  starred?: boolean;
  isJoinable?: boolean;
};
const zBoardCreatePayload = z.object({
  title: z.string().min(1),
  description: z.string(),
  startDate: z.string().nullable(),
  endDate: z.string().nullable(),
  goal: z.record(z.enum(Object.values(TALLY_MEASURE) as NonEmptyArray<string>), z.number().int()),
  starred: z.boolean().nullable().default(false),
  isJoinable: z.boolean().nullable().default(false),
}).strict();

boardRouter.post('/',
  requireUser,
  validateParams(zUuidParam()),
  validateBody(zBoardCreatePayload),
  h(async (req: RequestWithUser, res: ApiResponse<FullBoard>) =>
{
  const user = req.user;
  const payload = req.body as BoardCreatePayload;

  const board = await dbClient.board.create({
    data: {
      state: BOARD_STATE.ACTIVE,
      ownerId: user.id,

      ...payload,
    },
  });

  await logAuditEvent('board:create', user.id, board.id, null, null, req.sessionID);
  winston.info(`BOARD: ${user.id} (${user.username}) just created Board ${board.id} (UUID ${board.uuid}: ${board.title})`);

  const fullBoard = await getFullBoard(board.uuid);

  return res.status(200).send(success(fullBoard));
}));

// PATCH /:uuid - update a board
export type BoardUpdatePayload = Partial<BoardCreatePayload>;
const zBoardUpdatePayload = zBoardCreatePayload.partial();

boardRouter.patch('/:uuid',
  requireUser,
  validateParams(zUuidParam()),
  validateBody(zBoardUpdatePayload),
  h(async (req: RequestWithUser, res: ApiResponse<FullBoard>) =>
{
  const user = req.user;
  const payload = req.body as BoardUpdatePayload;

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

  const fullBoard = await getFullBoard(board.uuid);
  return res.status(200).send(success(fullBoard));
}));

// DELETE /:uuid - delete a board
boardRouter.delete('/:uuid',
  requireUser,
  validateParams(zUuidParam()),
  h(async (req: RequestWithUser, res: ApiResponse<Board>) =>
{
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
}));

// GET /:uuid/participation - get basic info about a board, to check if you can join it
boardRouter.get('/:uuid',
  requireUser,
  validateParams(zUuidParam()),
  h(async (req: RequestWithUser, res: ApiResponse<Board>) =>
{
  // TODO: if invites or bans are implemented, this will need to be changed
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

  res.status(200).send(success(board as Board));
}));

// POST /:uuid/participation - add or modify your own participation
export type BoardParticipantPayload = {
  works: number[];
  tags: number[];
};
const zBoardParticipantPayload = z.object({
  works: z.array(z.number().int()),
  tags: z.array(z.number().int()),
}).strict();

boardRouter.post('/:uuid/participation',
  requireUser,
  validateParams(zUuidParam()),
  validateBody(zBoardParticipantPayload),
  h(async (req: RequestWithUser, res: ApiResponse<BoardParticipant>) =>
{
  const user = req.user;
  const payload = req.body as BoardParticipantPayload;

  const participant = await dbClient.boardParticipant.upsert({
    where: {
      state: BOARD_PARTICIPANT_STATE.ACTIVE,
      userId: user.id,
      board: { uuid: req.params.uuid },
    },
    update: {
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

    create: {
      state: BOARD_PARTICIPANT_STATE.ACTIVE,
      user: { connect: { id: user.id }},
      board: { connect: { uuid: req.params.uuid } },

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
    },
  });

  return res.status(200).send(success(participant));
}))

// DELETE /:uuid/participation - leave a board
boardRouter.delete('/:uuid/participation',
  requireUser,
  validateParams(zUuidParam()),
  h(async (req: RequestWithUser, res: ApiResponse<BoardParticipant>) =>
{
  const user = req.user;

  const participant = await dbClient.boardParticipant.delete({
    where: {
      state: BOARD_PARTICIPANT_STATE.ACTIVE,
      userId: user.id,
      board: { uuid: req.params.uuid },
    },
  });

  return res.status(200).send(success(participant));
}));
