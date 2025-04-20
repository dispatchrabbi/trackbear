import { vi, describe, it, expect, afterEach } from 'vitest';
import { mockObject, mockObjects, TEST_OBJECT_ID, TEST_SESSION_ID, TEST_USER_ID } from '../../../testing-support/util.ts';
import { getHandlerMocksWithUser } from '../../lib/__mocks__/express.ts';

import { success } from 'server/lib/api-response.ts';

vi.mock('../../lib/db.ts');
import dbClientMock from '../../lib/__mocks__/db.ts';

vi.mock('../../lib/audit-events.ts', { spy: true });
import { logAuditEventMock } from '../../lib/__mocks__/audit-events.ts';

vi.mock('../../lib/models/goal/goal-model.ts');
import { GoalModel as _GoalModel, type Goal } from "../../lib/models/goal/goal-model.ts";
const GoalModel = vi.mocked(_GoalModel);

import { handleGetGoals, handleGetGoal, handleCreateGoal, handleCreateGoals, handleUpdateGoal, handleDeleteGoal } from './goal';

describe('goal api v1', () => {
  afterEach(() => {
    vi.resetAllMocks();
  });

  describe(handleGetGoals, () => {
    it('returns goals', async () => {
      const testGoals = mockObjects<Goal>(3);
      GoalModel.getGoals.mockResolvedValue(testGoals);

      const { req, res } = getHandlerMocksWithUser();
      await handleGetGoals(req, res);

      expect(GoalModel.getGoals).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith(success(testGoals));
    });
  });

  describe(handleGetGoal, () => {
    it('returns a goal if it finds one', async () => {
      const testGoal = mockObject<Goal>();
      GoalModel.getGoal.mockResolvedValue(testGoal);

      const { req, res } = getHandlerMocksWithUser();
      await handleGetGoal(req, res);

      expect(GoalModel.getGoal).toHaveBeenCalled();
      
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith(success(testGoal));
    });

    it(`returns a 404 if the goal doesn't exist`, async () => {
      GoalModel.getGoal.mockResolvedValue(null);

      const { req, res } = getHandlerMocksWithUser();
      await handleGetGoal(req, res);

      expect(GoalModel.getGoal).toHaveBeenCalled();
      
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.send).toHaveBeenCalled();
    });
  });

  describe(handleCreateGoal, () => {
    it('creates a goal', async() => {
      const testGoal = mockObject<Goal>({ id: TEST_OBJECT_ID });
      GoalModel.createGoal.mockResolvedValue(testGoal);

      const { req, res } = getHandlerMocksWithUser({
        body: {
          works: [],
          tags: [],
        },
      });
      await handleCreateGoal(req, res);

      expect(GoalModel.createGoal).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.send).toHaveBeenCalled();
    });
  });

  describe(handleCreateGoals, () => {
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
      expect(logAuditEventMock).toHaveBeenCalledWith('goal:create', TEST_USER_ID, GOAL_IDS[0], null, null, TEST_SESSION_ID);
      expect(logAuditEventMock).toHaveBeenCalledWith('goal:create', TEST_USER_ID, GOAL_IDS[1], null, null, TEST_SESSION_ID);
      expect(logAuditEventMock).toHaveBeenCalledWith('goal:create', TEST_USER_ID, GOAL_IDS[2], null, null, TEST_SESSION_ID);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.send).toHaveBeenCalled();
    });
  });

  describe(handleUpdateGoal, () => {
    it(`updates a goal if it exists`, async () => {
      const testGoal = mockObject<Goal>({ id: TEST_OBJECT_ID });
      GoalModel.getGoal.mockResolvedValue(testGoal);
      GoalModel.updateGoal.mockResolvedValue(testGoal);

      const { req, res } = getHandlerMocksWithUser({
        params: { id: String(TEST_OBJECT_ID) },
      });
      await handleUpdateGoal(req, res);

      expect(GoalModel.getGoal).toHaveBeenCalledWith(req.user, +req.params.id);
      expect(GoalModel.updateGoal).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalled();
    });

    it(`returns 404 when updating a goal that doesn't exist`, async () => {
      GoalModel.getGoal.mockResolvedValue(null);

      const { req, res } = getHandlerMocksWithUser({
        params: { id: String(TEST_OBJECT_ID) },
      });
      await handleUpdateGoal(req, res);

      expect(GoalModel.getGoal).toHaveBeenCalledWith(req.user, +req.params.id);
      expect(GoalModel.updateGoal).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.send).toHaveBeenCalled();
    });
  });

  describe(handleDeleteGoal, () => {
    it(`deletes a goal if it exists`, async () => {
      const testGoal = mockObject<Goal>({ id: TEST_OBJECT_ID });
      GoalModel.getGoal.mockResolvedValue(testGoal);
      GoalModel.deleteGoal.mockResolvedValue(testGoal);

      const { req, res } = getHandlerMocksWithUser({
        params: { id: String(TEST_OBJECT_ID) },
      });
      await handleDeleteGoal(req, res);

      expect(GoalModel.getGoal).toHaveBeenCalledWith(req.user, +req.params.id);
      expect(GoalModel.deleteGoal).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalled();
    });

    it(`returns 404 when deleting a goal that doesn't exist`, async () => {
      GoalModel.getGoal.mockResolvedValue(null);

      const { req, res } = getHandlerMocksWithUser({
        params: { id: String(TEST_OBJECT_ID) },
      });
      await handleDeleteGoal(req, res);

      expect(GoalModel.getGoal).toHaveBeenCalledWith(req.user, +req.params.id);
      expect(GoalModel.deleteGoal).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.send).toHaveBeenCalled();
    });
  });
});