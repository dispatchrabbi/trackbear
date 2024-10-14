import { vi, describe, it, expect, afterEach } from 'vitest';
import { mockObject, NIL_UUID, TEST_SESSION_ID } from '../../lib/__mocks__/util.ts';
import { getHandlerMocksWithUser, MOCK_USER_ID } from '../../lib/__mocks__/express.ts';
import { type User, type Goal } from "@prisma/client";
import type { TallyWithWorkAndTags } from './tally.ts';

vi.mock('../../lib/db.ts');
import dbClientMock from '../../lib/__mocks__/db.ts';

vi.mock('../../lib/audit-events.ts', { spy: true });
import logAuditEventMock from '../../lib/__mocks__/audit-events.ts';

import * as goalModel from "../../lib/models/goal.ts";

import { getGoals, getGoal, createGoal, createGoals, updateGoal, deleteGoal } from './goal';

describe('goal api v1', () => {
  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('getGoals', () => {
    it('returns goals', async () => {
      dbClientMock.goal.findMany.mockResolvedValue([
        mockObject<Goal>(),
        mockObject<Goal>(),
      ]);

      const { req, res } = getHandlerMocksWithUser();
      await getGoals(req, res);

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
      await getGoal(req, res);

      expect(dbClientMock.goal.findUnique).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalled();
    });

    it(`returns a 404 if the goal doesn't exist`, async () => {
      dbClientMock.goal.findUnique.mockResolvedValue(null);
      const getTalliesForGoalMock = vi.spyOn(goalModel, 'getTalliesForGoal');

      const { req, res } = getHandlerMocksWithUser();
      await getGoal(req, res);

      expect(dbClientMock.goal.findUnique).toHaveBeenCalled();
      expect(getTalliesForGoalMock).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.send).toHaveBeenCalled();
    });
  });

  describe.todo('createGoal');

  describe.todo('createGoals');

  describe.todo('updateGoal');

  describe.todo('deleteGoal');
});