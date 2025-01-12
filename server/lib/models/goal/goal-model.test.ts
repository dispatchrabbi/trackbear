import { vi, expect, describe, it, afterEach } from 'vitest';
import { getTestReqCtx, mockObject, mockObjects, TEST_OBJECT_ID, TEST_USER_ID } from 'testing-support/util';

import _dbClient from '../../db.ts';
import { logAuditEvent as _logAuditEvent } from '../../audit-events.ts';

import { CreateGoalData, GoalModel, UpdateGoalData, type Goal } from './goal-model.ts';
import { GOAL_CADENCE_UNIT, GOAL_STATE, GOAL_TYPE } from './consts.ts';
import { type User } from '../user/user-model.ts';
import { TALLY_MEASURE, TALLY_STATE } from '../tally/consts.ts';
import { AUDIT_EVENT_TYPE } from '../audit-event/consts.ts';
import { type Tally } from '../tally/tally-model.wip.ts';
import { omit } from 'server/lib/obj.ts';
import { WORK_STATE } from '../work/consts.ts';
import { TAG_STATE } from '../tag/consts.ts';
import { ids2included } from '../helpers.ts';

vi.mock('../../tracer.ts');

vi.mock('../../db.ts');
const dbClient = vi.mocked(_dbClient, { deep: true });

vi.mock('../../audit-events.ts');
const logAuditEvent = vi.mocked(_logAuditEvent);

describe(GoalModel, () => {
  const testOwner = mockObject<User>({ id: TEST_USER_ID });
  const testReqCtx = getTestReqCtx();

  const includeWorkAndTagIds = {
    worksIncluded: {
      where: {
        ownerId: testOwner.id,
        state: WORK_STATE.ACTIVE,
      },
      select: { id: true },
    },
    tagsIncluded: {
      where: {
        ownerId: testOwner.id,
        state: TAG_STATE.ACTIVE,
      },
      select: { id: true },
    }
  };

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe(GoalModel.getGoals, () => {
    it('gets a list of goals', async () => {
      const testGoals = mockObjects<Goal>(4, () => ({
        workIds: [],
        tagIds: []
      }));
      dbClient.goal.findMany.mockResolvedValue(testGoals.map(ids2included));

      const goals = await GoalModel.getGoals(testOwner);

      expect(goals).toEqual(testGoals);
      expect(dbClient.goal.findMany).toBeCalledWith({
        where: {
          ownerId: testOwner.id,
          state: GOAL_STATE.ACTIVE,
        },
        include: includeWorkAndTagIds
      });
    });
  });

  describe(GoalModel.getGoal, () => {
    it('gets a goal', async () => {
      const testGoal = mockObject<Goal>({
        id: TEST_OBJECT_ID,
        workIds: [],
        tagIds: [],
      });
      dbClient.goal.findUnique.mockResolvedValue(ids2included(testGoal));

      const goal = await GoalModel.getGoal(testOwner, TEST_OBJECT_ID);

      expect(goal).toEqual(testGoal);
      expect(dbClient.goal.findUnique).toBeCalledWith({
        where: {
          id: TEST_OBJECT_ID,
          ownerId: testOwner.id,
          state: GOAL_STATE.ACTIVE,
        },
        include: includeWorkAndTagIds
      });
    });

    it('returns null if the goal is not found', async () => {
      dbClient.goal.findUnique.mockResolvedValue(null);

      const work = await GoalModel.getGoal(testOwner, TEST_OBJECT_ID);

      expect(work).toBe(null);
    });
  });

  describe(GoalModel.createGoal, () => {
    it('creates a goal', async () => {
      const testData: CreateGoalData = {
        title: 'fake goal',
        description: 'fake description',
        type: GOAL_TYPE.TARGET,
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        parameters: {
          threshold: {
            measure: TALLY_MEASURE.WORD,
            count: 50000,
          },
        },
        starred: true,
        displayOnProfile: true,
        workIds: [-20, -21, -22],
        tagIds: [-23, -24, -25],
      };
      const testGoal = mockObject<Goal>({
        id: TEST_OBJECT_ID,
        workIds: [-20, -21, -22],
        tagIds: [-23, -24, -25],
      });
      dbClient.goal.create.mockResolvedValue(ids2included(testGoal));

      const created = await GoalModel.createGoal(testOwner, testData, testReqCtx);

      expect(created).toEqual(testGoal);
      expect(dbClient.goal.create).toBeCalledWith({
        data: {
          state: GOAL_STATE.ACTIVE,
          ownerId: testOwner.id,

          ...omit(testData, ['workIds', 'tagIds']),
          worksIncluded: { connect: [
            { id: -20, ownerId: testOwner.id, state: WORK_STATE.ACTIVE },
            { id: -21, ownerId: testOwner.id, state: WORK_STATE.ACTIVE },
            { id: -22, ownerId: testOwner.id, state: WORK_STATE.ACTIVE },
          ]},
          tagsIncluded: { connect: [
            { id: -23, ownerId: testOwner.id, state: TAG_STATE.ACTIVE },
            { id: -24, ownerId: testOwner.id, state: TAG_STATE.ACTIVE },
            { id: -25, ownerId: testOwner.id, state: TAG_STATE.ACTIVE },
          ]},
        },
        include: includeWorkAndTagIds,
      });
      expect(logAuditEvent).toBeCalledWith(
        AUDIT_EVENT_TYPE.GOAL_CREATE,
        testReqCtx.userId, TEST_OBJECT_ID, null,
        expect.any(Object), testReqCtx.sessionId
      );
    });

    it('creates a goal with defaults as needed', async () => {
      const testData: CreateGoalData = {
        title: 'goal with missing props',
        type: GOAL_TYPE.HABIT,
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        parameters: {
          cadence: {
            period: 1,
            unit: GOAL_CADENCE_UNIT.WEEK,
          },
          threshold: null,
        },
        workIds: [],
        tagIds: [],
      };
      const testGoal = mockObject<Goal>({
        id: TEST_OBJECT_ID,
        workIds: [],
        tagIds: [],
      });
      dbClient.goal.create.mockResolvedValue(ids2included(testGoal));

      await GoalModel.createGoal(testOwner, testData, testReqCtx);

      expect(dbClient.goal.create).toBeCalledWith({
        data: {
          title: testData.title,
          description: '',
          type: testData.type,
          startDate: testData.startDate,
          endDate: testData.endDate,
          parameters: testData.parameters,
          starred: false,
          displayOnProfile: false,
          state: GOAL_STATE.ACTIVE,
          ownerId: testOwner.id,
          worksIncluded: { connect: [] },
          tagsIncluded: { connect: [] },
        },
        include: includeWorkAndTagIds,
      });
    });
  });

  describe(GoalModel.updateGoal, () => {
    it('updates a goal', async () => {
      const testData: UpdateGoalData = {
        description: 'a more accurate description',
        endDate: null,
        workIds: [-27, -28, -29],
        tagIds: [-30, -31, -32],
      };
      const testGoal = mockObject<Goal>({
        id: TEST_OBJECT_ID,
        workIds: [-27, -28, -29],
        tagIds: [-30, -31, -32],
      });
      dbClient.goal.update.mockResolvedValue(ids2included(testGoal));

      const updated = await GoalModel.updateGoal(testOwner, testGoal, testData, testReqCtx);

      expect(updated).toEqual(testGoal);
      expect(dbClient.goal.update).toBeCalledWith({
        where: {
          id: testGoal.id,
          ownerId: testOwner.id,
          state: GOAL_STATE.ACTIVE,
        },
        data: {
          description: 'a more accurate description',
          endDate: null,
          worksIncluded: { set: [
            { id: -27, ownerId: testOwner.id, state: WORK_STATE.ACTIVE },
            { id: -28, ownerId: testOwner.id, state: WORK_STATE.ACTIVE },
            { id: -29, ownerId: testOwner.id, state: WORK_STATE.ACTIVE },
          ]},
          tagsIncluded: { set: [
            { id: -30, ownerId: testOwner.id, state: TAG_STATE.ACTIVE },
            { id: -31, ownerId: testOwner.id, state: TAG_STATE.ACTIVE },
            { id: -32, ownerId: testOwner.id, state: TAG_STATE.ACTIVE },
          ]},
        },
        include: includeWorkAndTagIds,
      });
      expect(logAuditEvent).toBeCalledWith(
        AUDIT_EVENT_TYPE.GOAL_UPDATE,
        testReqCtx.userId, TEST_OBJECT_ID, null,
        expect.any(Object), testReqCtx.sessionId
      );
    });

    it('does not pass works or tags if they are not updated', async () => {
      const testData: UpdateGoalData = {
        description: 'an even more accurate description',
        endDate: '2025-01-02',
      };
      const testGoal = mockObject<Goal>({
        id: TEST_OBJECT_ID,
        workIds: [-27, -28, -29],
        tagIds: [-30, -31, -32],
      });
      dbClient.goal.update.mockResolvedValue(ids2included(testGoal));

      await GoalModel.updateGoal(testOwner, testGoal, testData, testReqCtx);

      expect(dbClient.goal.update).toBeCalledWith({
        where: {
          id: testGoal.id,
          ownerId: testOwner.id,
          state: GOAL_STATE.ACTIVE,
        },
        data: {
          description: 'an even more accurate description',
          endDate: '2025-01-02',
        },
        include: includeWorkAndTagIds,
      });
    });
  });

  describe(GoalModel.deleteGoal, () => {
    it('deletes a goal', async () => {
      const testGoal = mockObject<Goal>({ id: TEST_OBJECT_ID, workIds: [], tagIds: [] });
      dbClient.goal.update.mockResolvedValue(ids2included(testGoal));

      const deleted = await GoalModel.deleteGoal(testOwner, testGoal, testReqCtx);

      expect(deleted).toEqual(testGoal);
      expect(dbClient.goal.update).toBeCalledWith({
        where: {
          id: testGoal.id,
          ownerId: testOwner.id,
          state: GOAL_STATE.ACTIVE,
        },
        data: {
          state: GOAL_STATE.DELETED,
        },
        include: includeWorkAndTagIds,
      });
      expect(logAuditEvent).toBeCalledWith(
        AUDIT_EVENT_TYPE.GOAL_DELETE,
        testReqCtx.userId, TEST_OBJECT_ID, null,
        expect.any(Object), testReqCtx.sessionId
      );
    });
  });

  describe(GoalModel.undeleteGoal, () => {
    it('undeletes a goal', async () => {
      const testGoal = mockObject<Goal>({ id: TEST_OBJECT_ID, workIds: [], tagIds: [] });
      dbClient.goal.update.mockResolvedValue(ids2included(testGoal));

      const deleted = await GoalModel.undeleteGoal(testOwner, testGoal, testReqCtx);

      expect(deleted).toEqual(testGoal);
      expect(dbClient.goal.update).toBeCalledWith({
        where: {
          id: testGoal.id,
          ownerId: testOwner.id,
          state: GOAL_STATE.DELETED,
        },
        data: {
          state: GOAL_STATE.ACTIVE,
        },
        include: includeWorkAndTagIds,
      });
      expect(logAuditEvent).toBeCalledWith(
        AUDIT_EVENT_TYPE.GOAL_UNDELETE,
        testReqCtx.userId, TEST_OBJECT_ID, null,
        expect.any(Object), testReqCtx.sessionId
      );
    });
  });

  describe(GoalModel.getTargetTotals, () => {
    it('gets totals for all the targets belonging to a user', async () => {
      dbClient.$queryRawUnsafe.mockResolvedValue([
        { goalId: TEST_OBJECT_ID, total: 1000 },
        { goalId: TEST_OBJECT_ID - 1, total: 2000 },
        { goalId: TEST_OBJECT_ID - 2, total: 3000 },
      ]);

      const totals = await GoalModel.getTargetTotals(testOwner);

      expect(totals).toBeInstanceOf(Map);
      expect(totals.size).toBe(3);

      expect(totals.get(TEST_OBJECT_ID)).toBe(1000);
      expect(totals.get(TEST_OBJECT_ID - 1)).toBe(2000);
      expect(totals.get(TEST_OBJECT_ID - 2)).toBe(3000);
    });
  });

  describe(GoalModel.DEPRECATED_getTalliesForGoal, () => {
    it('gets some tallies with a narrow goal', async () => {
      const testGoal = mockObject<Goal>({
        ownerId: TEST_USER_ID,
        type: GOAL_TYPE.TARGET,
        parameters: {
          threshold: { count: 100, measure: TALLY_MEASURE.CHAPTER }
        },
        workIds: [-10, -11, -12, -13],
        tagIds: [-20, -21, -22, -23],
        startDate: '2024-06-15',
        endDate: '2024-07-15',
      });
      const testTallies = mockObjects<Tally>(10);
      dbClient.tally.findMany.mockResolvedValue(testTallies);

      const tallies = await GoalModel.DEPRECATED_getTalliesForGoal(testGoal);

      expect(tallies).toBe(testTallies);
      expect(dbClient.tally.findMany).toBeCalledWith({
        where: {
          ownerId: testGoal.ownerId,
          state: TALLY_STATE.ACTIVE,
    
          workId: { in: [ -10, -11, -12, -13 ] },
          tags: { some: { id: { in: [ -20, -21, -22, -23 ] } } },
          date: {
            gte: '2024-06-15',
            lte: '2024-07-15',
          },
          measure: TALLY_MEASURE.CHAPTER,
        }
      });
    });

    it('gets some tallies with a broad goal', async () => {
      const testGoal = mockObject<Goal>({
        ownerId: TEST_USER_ID,
        type: GOAL_TYPE.HABIT,
        parameters: {
          cadence: { unit: GOAL_CADENCE_UNIT.DAY, period: 1 },
          threshold: null,
        },
        workIds: [],
        tagIds: [],
        startDate: null,
        endDate: null,
      });
      const testTallies = mockObjects<Tally>(11);
      dbClient.tally.findMany.mockResolvedValue(testTallies);
  
      const tallies = await GoalModel.DEPRECATED_getTalliesForGoal(testGoal);
  
      expect(tallies).toBe(testTallies);
      expect(dbClient.tally.findMany).toBeCalledWith({
        where: {
          ownerId: testGoal.ownerId,
          state: TALLY_STATE.ACTIVE,
    
          workId: undefined,
          tags: undefined,
          date: {
            gte: undefined,
            lte: undefined,
          },
          measure: undefined,
        }
      });
    });

    it('gets some tallies with a habit goal that has a measure', async () => {
      const testGoal = mockObject<Goal>({
        ownerId: TEST_USER_ID,
        type: GOAL_TYPE.HABIT,
        parameters: {
          cadence: { unit: GOAL_CADENCE_UNIT.DAY, period: 1 },
          threshold: { measure: TALLY_MEASURE.SCENE, count: 5 },
        },
        workIds: [],
        tagIds: [],
        startDate: null,
        endDate: null,
      });
      const testTallies = mockObjects<Tally>(11);
      dbClient.tally.findMany.mockResolvedValue(testTallies);
  
      const tallies = await GoalModel.DEPRECATED_getTalliesForGoal(testGoal);
  
      expect(tallies).toBe(testTallies);
      expect(dbClient.tally.findMany).toBeCalledWith({
        where: {
          ownerId: testGoal.ownerId,
          state: TALLY_STATE.ACTIVE,
    
          workId: undefined,
          tags: undefined,
          date: {
            gte: undefined,
            lte: undefined,
          },
          measure: TALLY_MEASURE.SCENE,
        }
      });
    });
  });
});