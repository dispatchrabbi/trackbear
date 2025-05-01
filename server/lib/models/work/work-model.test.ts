import { vi, expect, describe, it, afterEach } from 'vitest';
import { getTestReqCtx, mockObject, mockObjects, TEST_OBJECT_ID, TEST_USER_ID } from 'testing-support/util';

import _dbClient from '../../db.ts';
import { logAuditEvent as _logAuditEvent } from '../../audit-events.ts';

import { CreateWorkData, SummarizedWork, UpdateWorkData, WorkModel, WorkWithTallies, type Work } from './work-model.ts';
import { WORK_PHASE, WORK_STATE } from './consts.ts';
import { type User } from '../user/user-model.ts';
import { type Tally } from '../tally/tally-model.wip.ts';
import { TALLY_MEASURE, TALLY_STATE } from '../tally/consts.ts';
import { AUDIT_EVENT_TYPE } from '../audit-event/consts.ts';

vi.mock('../../tracer.ts');

vi.mock('../../db.ts');
const dbClient = vi.mocked(_dbClient, { deep: true });

vi.mock('../../audit-events.ts');
const logAuditEvent = vi.mocked(_logAuditEvent);

describe(WorkModel, () => {
  const testOwner = mockObject<User>({ id: TEST_USER_ID });
  const testReqCtx = getTestReqCtx();

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe(WorkModel.getWorks, () => {
    it('gets a list of works', async () => {
      const testWorks = mockObjects<Work>(3);
      dbClient.work.findMany.mockResolvedValue(testWorks);

      const works = await WorkModel.getWorks(testOwner);

      expect(works).toBe(testWorks);
      expect(dbClient.work.findMany).toBeCalledWith({
        where: {
          ownerId: testOwner.id,
          state: WORK_STATE.ACTIVE,
        },
      });
    });
  });

  describe(WorkModel.getSummarizedWorks, () => {
    it('gets a list of summarized works', async () => {
      const testWorksWithTallies = mockObjects<WorkWithTallies>(3, () => ({
        tallies: mockObjects<Tally>(4, () => ({
          date: '2024-01-01',
          measure: TALLY_MEASURE.WORD,
          count: 1000,
        })),
      }));
      dbClient.work.findMany.mockResolvedValue(testWorksWithTallies);

      const expectedSummarizedWorks = mockObjects<SummarizedWork>(3, () => ({
        totals: { [TALLY_MEASURE.WORD]: 4000 },
        lastUpdated: '2024-01-01',
      }));

      const works = await WorkModel.getSummarizedWorks(testOwner);

      expect(works).toEqual(expectedSummarizedWorks);
      expect(dbClient.work.findMany).toBeCalledWith({
        where: {
          ownerId: testOwner.id,
          state: WORK_STATE.ACTIVE,
        },
        include: {
          tallies: { where: { state: TALLY_STATE.ACTIVE } },
        },
      });
    });

    it('works with multiple measures in the tallies', async () => {
      const testWorksWithTallies = mockObjects<WorkWithTallies>(1, () => ({
        tallies: mockObjects<Tally>(6, ix => ({
          date: `2024-01-${10 + ix}`,
          measure: ix % 2 ? TALLY_MEASURE.SCENE : TALLY_MEASURE.LINE,
          count: ix % 2 ? 5 : 100,
        })),
      }));
      dbClient.work.findMany.mockResolvedValue(testWorksWithTallies);

      const expectedSummarizedWorks = mockObjects<SummarizedWork>(1, () => ({
        totals: {
          [TALLY_MEASURE.SCENE]: 15,
          [TALLY_MEASURE.LINE]: 300,
        },
        lastUpdated: '2024-01-15',
      }));

      const works = await WorkModel.getSummarizedWorks(testOwner);

      expect(works).toEqual(expectedSummarizedWorks);
    });

    it('returns reasonable info when there are no tallies for a work', async () => {
      const testWorksWithTallies = mockObjects<WorkWithTallies>(1, () => ({
        tallies: [],
      }));
      dbClient.work.findMany.mockResolvedValue(testWorksWithTallies);

      const expectedSummarizedWorks = mockObjects<SummarizedWork>(1, () => ({
        totals: {},
        lastUpdated: null,
      }));

      const works = await WorkModel.getSummarizedWorks(testOwner);

      expect(works).toEqual(expectedSummarizedWorks);
    });
  });

  describe(WorkModel.getWork, () => {
    it('gets a work', async () => {
      const testWork = mockObject<Work>({ id: TEST_OBJECT_ID });
      dbClient.work.findUnique.mockResolvedValue(testWork);

      const work = await WorkModel.getWork(testOwner, TEST_OBJECT_ID);

      expect(work).toBe(testWork);
      expect(dbClient.work.findUnique).toBeCalledWith({
        where: {
          id: TEST_OBJECT_ID,
          ownerId: testOwner.id,
          state: WORK_STATE.ACTIVE,
        },
      });
    });

    it('returns null if the work is not found', async () => {
      dbClient.work.findUnique.mockResolvedValue(null);

      const work = await WorkModel.getWork(testOwner, TEST_OBJECT_ID);

      expect(work).toBe(null);
    });
  });

  describe(WorkModel.createWork, () => {
    it('creates a work', async () => {
      const testData: CreateWorkData = {
        title: 'fake work',
        description: 'fake description',
        phase: WORK_PHASE.DRAFTING,
        startingBalance: { [TALLY_MEASURE.LINE]: 8 },
        cover: 'fake-cover-path.png',
        starred: true,
        displayOnProfile: true,
      };
      const testWork = mockObject<Work>({ id: TEST_OBJECT_ID });
      dbClient.work.create.mockResolvedValue(testWork);

      const created = await WorkModel.createWork(testOwner, testData, testReqCtx);

      expect(created).toBe(testWork);
      expect(dbClient.work.create).toBeCalledWith({
        data: {
          ...testData,
          state: WORK_STATE.ACTIVE,
          ownerId: testOwner.id,
        },
      });
      expect(logAuditEvent).toBeCalledWith(
        AUDIT_EVENT_TYPE.WORK_CREATE,
        testReqCtx.userId, TEST_OBJECT_ID, null,
        expect.any(Object), testReqCtx.sessionId,
      );
    });

    it('creates a work with defaults supplied as needed', async () => {
      const testData: CreateWorkData = {
        title: 'barebones work',
      };
      const testWork = mockObject<Work>({ id: TEST_OBJECT_ID });
      dbClient.work.create.mockResolvedValue(testWork);

      await WorkModel.createWork(testOwner, testData, testReqCtx);

      expect(dbClient.work.create).toBeCalledWith({
        data: {
          title: testData.title,
          description: '',
          phase: WORK_PHASE.PLANNING,
          startingBalance: {},
          cover: null,
          starred: false,
          displayOnProfile: false,
          state: WORK_STATE.ACTIVE,
          ownerId: testOwner.id,
        },
      });
    });
  });

  describe(WorkModel.updateWork, () => {
    it('updates a work', async () => {
      const testData: UpdateWorkData = {
        description: 'a more flowery description',
        phase: WORK_PHASE.FINISHED,
      };
      const testWork = mockObject<Work>({ id: TEST_OBJECT_ID });
      dbClient.work.update.mockResolvedValue(testWork);

      const updated = await WorkModel.updateWork(testOwner, testWork, testData, testReqCtx);

      expect(updated).toBe(testWork);
      expect(dbClient.work.update).toBeCalledWith({
        where: {
          id: testWork.id,
          ownerId: testOwner.id,
          state: WORK_STATE.ACTIVE,
        },
        data: {
          ...testData,
        },
      });
      expect(logAuditEvent).toBeCalledWith(
        AUDIT_EVENT_TYPE.WORK_UPDATE,
        testReqCtx.userId, TEST_OBJECT_ID, null,
        expect.any(Object), testReqCtx.sessionId,
      );
    });
  });

  describe(WorkModel.deleteWork, () => {
    it('deletes a work', async () => {
      const testWork = mockObject<Work>({ id: TEST_OBJECT_ID });
      dbClient.work.update.mockResolvedValue(testWork);

      const deleted = await WorkModel.deleteWork(testOwner, testWork, testReqCtx);

      expect(deleted).toBe(testWork);
      expect(dbClient.work.update).toBeCalledWith({
        where: {
          id: testWork.id,
          ownerId: testOwner.id,
          state: WORK_STATE.ACTIVE,
        },
        data: {
          state: WORK_STATE.DELETED,
          tallies: {
            updateMany: {
              where: { state: TALLY_STATE.ACTIVE },
              data: { state: TALLY_STATE.DELETED },
            },
          },
        },
      });
      expect(logAuditEvent).toBeCalledWith(
        AUDIT_EVENT_TYPE.WORK_DELETE,
        testReqCtx.userId, TEST_OBJECT_ID, null,
        expect.any(Object), testReqCtx.sessionId,
      );
    });
  });

  describe(WorkModel.undeleteWork, () => {
    it('undeletes a work', async () => {
      const testWork = mockObject<Work>({ id: TEST_OBJECT_ID });
      dbClient.work.update.mockResolvedValue(testWork);

      const deleted = await WorkModel.undeleteWork(testOwner, testWork, testReqCtx);
      expect(deleted).toBe(testWork);
      expect(dbClient.work.update).toBeCalledWith({
        where: {
          id: testWork.id,
          ownerId: testOwner.id,
          state: WORK_STATE.DELETED,
        },
        data: {
          state: WORK_STATE.ACTIVE,
          tallies: {
            updateMany: {
              where: { state: TALLY_STATE.DELETED },
              data: { state: TALLY_STATE.ACTIVE },
            },
          },
        },
      });
      expect(logAuditEvent).toBeCalledWith(
        AUDIT_EVENT_TYPE.WORK_UNDELETE,
        testReqCtx.userId, TEST_OBJECT_ID, null,
        expect.any(Object), testReqCtx.sessionId,
      );
    });
  });
});
