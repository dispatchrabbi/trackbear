import { vi, describe, it, expect, afterEach } from 'vitest';
import { mockObject, NIL_UUID, TEST_SESSION_ID } from '../../../testing-support/util.ts';
import { getHandlerMocksWithUser, MOCK_USER_ID } from '../../lib/__mocks__/express.ts';
import { type User, type Board, BoardParticipant } from "@prisma/client";

vi.mock('../../lib/db.ts');
import dbClientMock from '../../lib/__mocks__/db.ts';

vi.mock('../../lib/audit-events.ts', { spy: true });
import { logAuditEventMock } from '../../lib/__mocks__/audit-events.ts';

import * as boardModel from "../../lib/models/board.ts";

import { handleGetBoards, handleGetBoard, handleCreateBoard, handleUpdateBoard, handleStarBoard, handleDeleteBoard, handleGetBoardParticipation, handleUpdateBoardParticipation, handleDeleteBoardParticipation } from './board';

describe('board api v1', () => {
  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('getBoards', () => {
    it('returns boards', async () => {
      vi.spyOn(boardModel, 'getExtendedBoardsForUser').mockResolvedValue([
        mockObject<boardModel.ExtendedBoard>(),
        mockObject<boardModel.ExtendedBoard>(),
      ]);
  
      const { req, res } = getHandlerMocksWithUser();
      await handleGetBoards(req, res);

      expect(boardModel.getExtendedBoardsForUser).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalled();
    });
  });

  describe('getBoard', () => {
    it('returns a private board you own', async () => {
      vi.spyOn(boardModel, 'getFullBoard').mockResolvedValue(mockObject<boardModel.FullBoard>({
        ownerId: MOCK_USER_ID,
        isPublic: false,
      }));
  
      const { req, res } = getHandlerMocksWithUser({ params: { uuid: NIL_UUID } });
      await handleGetBoard(req, res);

      expect(boardModel.getFullBoard).toHaveBeenCalledWith(NIL_UUID);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalled();
    });

    it('returns a private board you are part of', async () => {
      vi.spyOn(boardModel, 'getFullBoard').mockResolvedValue(mockObject<boardModel.FullBoard>({
        ownerId: MOCK_USER_ID + 1,
        isPublic: false,
        participants: [mockObject<boardModel.ParticipantWithTallies>({ uuid: NIL_UUID })],
      }));

      const { req, res } = getHandlerMocksWithUser({
        user: mockObject<User>({ id: MOCK_USER_ID, uuid: NIL_UUID }),
        params: { uuid: NIL_UUID }
      });
      await handleGetBoard(req, res);

      expect(boardModel.getFullBoard).toHaveBeenCalledWith(NIL_UUID);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalled();
    });

    it(`returns a public board you don't own`, async () => {
      vi.spyOn(boardModel, 'getFullBoard').mockResolvedValue(mockObject<boardModel.FullBoard>({
        ownerId: MOCK_USER_ID + 1,
        isPublic: true,
      }));

      const { req, res } = getHandlerMocksWithUser({ params: { uuid: NIL_UUID } });
      await handleGetBoard(req, res);

      expect(boardModel.getFullBoard).toHaveBeenCalledWith(NIL_UUID);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalled();
    });

    it(`will not return a private board you aren't in and can't join`, async () => {
      vi.spyOn(boardModel, 'getFullBoard').mockResolvedValue(mockObject<boardModel.FullBoard>({
        ownerId: MOCK_USER_ID + 1,
        isPublic: false,
        isJoinable: false,
        participants: [],
      }));

      const { req, res } = getHandlerMocksWithUser({ params: { uuid: NIL_UUID } });
      await handleGetBoard(req, res);

      expect(boardModel.getFullBoard).toHaveBeenCalledWith(NIL_UUID);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.send).toHaveBeenCalled();
    });

    it(`will tell you to join a private board you aren't in but can join`, async () => {
      vi.spyOn(boardModel, 'getFullBoard').mockResolvedValue(mockObject<boardModel.FullBoard>({
        ownerId: MOCK_USER_ID + 1,
        isPublic: false,
        isJoinable: true,
        participants: [],
      }));

      const { req, res } = getHandlerMocksWithUser({ params: { uuid: NIL_UUID } });
      await handleGetBoard(req, res);

      expect(boardModel.getFullBoard).toHaveBeenCalledWith(NIL_UUID);
      expect(res.status).toHaveBeenCalledWith(428);
      expect(res.send).toHaveBeenCalled();
    });
  });

  describe('createBoard', () => {
    it('creates a board', async () => {
      const BOARD_ID = -10;
      // @ts-ignore until strictNullChecks is turned on in the codebase (see tip at https://www.prisma.io/docs/orm/prisma-client/testing/unit-testing#dependency-injection)
      dbClientMock.board.create.mockResolvedValue(mockObject<Board>({
        id: BOARD_ID,
      }));

      const { req, res } = getHandlerMocksWithUser();
      await handleCreateBoard(req, res);

      // @ts-ignore until strictNullChecks is turned on in the codebase (see tip at https://www.prisma.io/docs/orm/prisma-client/testing/unit-testing#dependency-injection)
      expect(dbClientMock.board.create).toHaveBeenCalled();
      expect(logAuditEventMock).toHaveBeenCalledWith('board:create', MOCK_USER_ID, BOARD_ID, null, null, TEST_SESSION_ID);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.send).toHaveBeenCalled();
    });
  });

  describe('updateBoard', () => {
    it('updates a board', async () => {
      const BOARD_ID = -10;
      dbClientMock.board.update.mockResolvedValue(mockObject<Board>({
        id: BOARD_ID,
      }));

      const { req, res } = getHandlerMocksWithUser();
      await handleUpdateBoard(req, res);

      // @ts-ignore until strictNullChecks is turned on in the codebase (see tip at https://www.prisma.io/docs/orm/prisma-client/testing/unit-testing#dependency-injection)
      expect(dbClientMock.board.update).toHaveBeenCalled();
      expect(logAuditEventMock).toHaveBeenCalledWith('board:update', MOCK_USER_ID, BOARD_ID, null, null, TEST_SESSION_ID);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalled();
    });
  });

  describe('starBoard', () => {
    it('stars a board you own', async () => {
      const BOARD_ID = -10;
      dbClientMock.board.findUnique.mockResolvedValue(mockObject<Board>({
        id: BOARD_ID,
      }));
      dbClientMock.$transaction.mockResolvedValue([
        { count: 1 },
        { count: 1 },
      ]);
      const summary = {
        starred: true,
        board: true,
        participant: true,
      };

      const { req, res } = await getHandlerMocksWithUser({ body: { starred: true } });
      await handleStarBoard(req, res);

      // @ts-ignore until strictNullChecks is turned on in the codebase (see tip at https://www.prisma.io/docs/orm/prisma-client/testing/unit-testing#dependency-injection)
      expect(dbClientMock.board.updateMany).toHaveBeenCalled();
      // @ts-ignore until strictNullChecks is turned on in the codebase (see tip at https://www.prisma.io/docs/orm/prisma-client/testing/unit-testing#dependency-injection)
      expect(dbClientMock.boardParticipant.updateMany).toHaveBeenCalled();
      expect(logAuditEventMock).toHaveBeenCalledWith('board:star', MOCK_USER_ID, BOARD_ID, null, summary, TEST_SESSION_ID);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalled();
    });
  });

  describe('deleteBoard', () => {
    it('deletes a board', async () => {
      const BOARD_ID = -10;
      dbClientMock.board.update.mockResolvedValue(mockObject<Board>({
        id: BOARD_ID,
      }));

      const { req, res } = getHandlerMocksWithUser();
      await handleDeleteBoard(req, res);

      // @ts-ignore until strictNullChecks is turned on in the codebase (see tip at https://www.prisma.io/docs/orm/prisma-client/testing/unit-testing#dependency-injection)
      expect(dbClientMock.board.update).toHaveBeenCalled();
      expect(logAuditEventMock).toHaveBeenCalledWith('board:delete', MOCK_USER_ID, BOARD_ID, null, null, TEST_SESSION_ID);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalled();
    });
  });

  describe('getBoardParticipation', () => {
    it('gets information about a board', async () => {
      vi.spyOn(boardModel, 'getBoardParticipationForUser').mockResolvedValue(mockObject<boardModel.BoardWithParticipants>());
  
      const { req, res } = getHandlerMocksWithUser();
      await handleGetBoardParticipation(req, res);

      expect(boardModel.getBoardParticipationForUser).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalled();
    });
  });

  describe('updateBoardParticipation', () => {
    it(`adds you to the board if you aren't already a member`, async () => {
      dbClientMock.board.findUnique.mockResolvedValue(mockObject<Board>({
        individualGoalMode: true,
      }));
      dbClientMock.boardParticipant.findFirst.mockResolvedValue(null);
  
      const { req, res } = getHandlerMocksWithUser();
      await handleUpdateBoardParticipation(req, res);

      expect(dbClientMock.boardParticipant.create).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.send).toHaveBeenCalled();
    });

    it(`updates your record if you are already a member`, async () => {
      dbClientMock.board.findUnique.mockResolvedValue(mockObject<Board>({
        individualGoalMode: true,
      }));
      dbClientMock.boardParticipant.findFirst.mockResolvedValue(mockObject<BoardParticipant>());
  
      const { req, res } = getHandlerMocksWithUser();
      await handleUpdateBoardParticipation(req, res);

      expect(dbClientMock.boardParticipant.update).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalled();
    });
  });

  describe('deleteBoardParticipation', () => {
    it('removes you from the list of participants', async () => {
      dbClientMock.boardParticipant.findFirst.mockResolvedValue(mockObject<BoardParticipant>({
        id: -10
      }));
      
      const { req, res } = getHandlerMocksWithUser();
      await handleDeleteBoardParticipation(req, res);

      expect(dbClientMock.boardParticipant.findFirst).toHaveBeenCalled();
      expect(dbClientMock.boardParticipant.delete).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalled();
    });
  });
});