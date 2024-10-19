import { vi, describe, it, expect, afterEach } from 'vitest';
import { mockObject, TEST_SESSION_ID } from '../../../testing-support/util.ts';
import { getHandlerMocksWithUser, MOCK_USER_ID } from '../../lib/__mocks__/express.ts';
import type { Goal } from "@prisma/client";
import type { TallyWithWorkAndTags } from './tally.ts';

vi.mock('../../lib/db.ts');
import dbClientMock from '../../lib/__mocks__/db.ts';

vi.mock('../../lib/audit-events.ts', { spy: true });
import logAuditEventMock from '../../lib/__mocks__/audit-events.ts';

import * as goalModel from "../../lib/models/goal.ts";

import { handleGetGoals, handleGetGoal, handleCreateGoal, handleCreateGoals, handleUpdateGoal, handleDeleteGoal } from './goal';

describe('goal api v1', () => {
  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('getGoals', () => {
    it('returns goals', async () => {
      // @ts-ignore until strictNullChecks is turned on in the codebase (see tip at https://www.prisma.io/docs/orm/prisma-client/testing/unit-testing#dependency-injection)
      dbClientMock.goal.findMany.mockResolvedValue([
        mockObject<Goal>(),
        mockObject<Goal>(),
      ]);

      const { req, res } = getHandlerMocksWithUser();
      await handleGetGoals(req, res);

      expect(dbClientMock.goal.findMany).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalled();
    });
  });

  describe('getGoal', () => {
    it('returns a goal if it finds one', async () => {
      dbClientMock.goal.findUnique.mockResolvedValue(mockObject<Goal>());
      vi.spyOn(goalModel, 'getTalliesForGoal').mockResolvedValue([mockObject<TallyWithWorkAndTags>()]);

      const { req, res } = getHandlerMocksWithUser();
      await handleGetGoal(req, res);

      expect(dbClientMock.goal.findUnique).toHaveBeenCalled();
      expect(goalModel.getTalliesForGoal).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalled();
    });

    it(`returns a 404 if the goal doesn't exist`, async () => {
      dbClientMock.goal.findUnique.mockResolvedValue(null);
      const getTalliesForGoalMock = vi.spyOn(goalModel, 'getTalliesForGoal');

      const { req, res } = getHandlerMocksWithUser();
      await handleGetGoal(req, res);

      expect(dbClientMock.goal.findUnique).toHaveBeenCalled();
      expect(getTalliesForGoalMock).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.send).toHaveBeenCalled();
    });
  });

  describe('createGoal', () => {
    it('creates a goal', async() => {
      const GOAL_ID = -10;
      // @ts-ignore until strictNullChecks is turned on in the codebase (see tip at https://www.prisma.io/docs/orm/prisma-client/testing/unit-testing#dependency-injection)
      dbClientMock.goal.create.mockResolvedValue(mockObject<Goal>({
        id: GOAL_ID,
      }));
      vi.spyOn(goalModel, 'getTalliesForGoal').mockResolvedValue([mockObject<TallyWithWorkAndTags>()]);

      const { req, res } = getHandlerMocksWithUser({
        body: {
          works: [],
          tags: [],
        },
      });
      await handleCreateGoal(req, res);

      // @ts-ignore until strictNullChecks is turned on in the codebase (see tip at https://www.prisma.io/docs/orm/prisma-client/testing/unit-testing#dependency-injection)
      expect(dbClientMock.goal.create).toHaveBeenCalled();
      expect(goalModel.getTalliesForGoal).toHaveBeenCalled();
      expect(logAuditEventMock).toHaveBeenCalledWith('goal:create', MOCK_USER_ID, GOAL_ID, null, null, TEST_SESSION_ID);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.send).toHaveBeenCalled();
    });
  });

  describe('createGoals', () => {
    it('creates multiple goals', async() => {
      const GOAL_IDS = [-10, -11, -12];
      // @ts-ignore until strictNullChecks is turned on in the codebase (see tip at https://www.prisma.io/docs/orm/prisma-client/testing/unit-testing#dependency-injection)
      dbClientMock.goal.createManyAndReturn.mockResolvedValue(
        GOAL_IDS.map(id => mockObject<Goal>({ id }))
      );
      


      const { req, res } = getHandlerMocksWithUser({
        body: [
          { works: [], tags: [] },
          { works: [], tags: [] },
          { works: [], tags: [] },
        ],
      });
      await handleCreateGoals(req, res);

      // @ts-ignore until strictNullChecks is turned on in the codebase (see tip at https://www.prisma.io/docs/orm/prisma-client/testing/unit-testing#dependency-injection)
      expect(dbClientMock.goal.createManyAndReturn).toHaveBeenCalled();
      expect(logAuditEventMock).toHaveBeenCalledTimes(3);
      expect(logAuditEventMock).toHaveBeenCalledWith('goal:create', MOCK_USER_ID, GOAL_IDS[0], null, null, TEST_SESSION_ID);
      expect(logAuditEventMock).toHaveBeenCalledWith('goal:create', MOCK_USER_ID, GOAL_IDS[1], null, null, TEST_SESSION_ID);
      expect(logAuditEventMock).toHaveBeenCalledWith('goal:create', MOCK_USER_ID, GOAL_IDS[2], null, null, TEST_SESSION_ID);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.send).toHaveBeenCalled();
    });
  });

  describe('updateGoal', () => {
    it('updates a goal', async () => {
      const GOAL_ID = -10;
      dbClientMock.goal.update.mockResolvedValue(
        mockObject<Goal>({ id: GOAL_ID,})
      );
      vi.spyOn(goalModel, 'getTalliesForGoal').mockResolvedValue(
        [mockObject<TallyWithWorkAndTags>()]
      );

      const { req, res } = getHandlerMocksWithUser();
      await handleUpdateGoal(req, res);

      // @ts-ignore until strictNullChecks is turned on in the codebase (see tip at https://www.prisma.io/docs/orm/prisma-client/testing/unit-testing#dependency-injection)
      expect(dbClientMock.goal.update).toHaveBeenCalled();
      expect(goalModel.getTalliesForGoal).toHaveBeenCalled();
      expect(logAuditEventMock).toHaveBeenCalledWith('goal:update', MOCK_USER_ID, GOAL_ID, null, null, TEST_SESSION_ID);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalled();
    });
  });

  describe('deleteGoal', () => {
    it('deletes a goal', async () => {
      const GOAL_ID = -10;
      dbClientMock.goal.update.mockResolvedValue(
        mockObject<Goal>({ id: GOAL_ID })
      );

      const { req, res } = getHandlerMocksWithUser();
      await handleDeleteGoal(req, res);

      // @ts-ignore until strictNullChecks is turned on in the codebase (see tip at https://www.prisma.io/docs/orm/prisma-client/testing/unit-testing#dependency-injection)
      expect(dbClientMock.goal.update).toHaveBeenCalled();
      expect(logAuditEventMock).toHaveBeenCalledWith('goal:delete', MOCK_USER_ID, GOAL_ID, null, null, TEST_SESSION_ID);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalled();
    });
  });
});