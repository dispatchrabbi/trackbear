import { vi, describe, it, expect, afterEach } from 'vitest';
import { mockObject, mockObjects, TEST_SESSION_ID } from '../../lib/__mocks__/util.ts';
import { getHandlerMocksWithUser, MOCK_USER_ID } from '../../lib/__mocks__/express.ts';
import type { Work, Tally } from "@prisma/client";

vi.mock('../../lib/db.ts');
import dbClientMock from '../../lib/__mocks__/db.ts';

vi.mock('../../lib/audit-events.ts', { spy: true });
import logAuditEventMock from '../../lib/__mocks__/audit-events.ts';

import { getWorks, getWork, createWork, updateWork, deleteWork } from './work.ts';
import { TALLY_MEASURE } from 'server/lib/models/tally.ts';

describe('work api v1', () => {
  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('getWorks', () => {
    it('returns works', async () => {
      // @ts-ignore until strictNullChecks is turned on in the codebase (see tip at https://www.prisma.io/docs/orm/prisma-client/testing/unit-testing#dependency-injection)
      dbClientMock.work.findMany.mockResolvedValue(
        mockObjects<Work & { tallies: Tally[] }>(2, () => ({
          tallies: mockObjects<Tally>(3, () => ({ measure: TALLY_MEASURE.WORD, count: 10 })),
        })),
      );

      const { req, res } = getHandlerMocksWithUser();
      await getWorks(req, res);

      expect(dbClientMock.work.findMany).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalled();
    });
  });

  describe('getWork', () => {
    it('returns a work if it finds one', async () => {
      dbClientMock.work.findUnique.mockResolvedValue(mockObject<Work>());

      const { req, res } = getHandlerMocksWithUser();
      await getWork(req, res);

      expect(dbClientMock.work.findUnique).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalled();
    });

    it(`returns a 404 if the goal doesn't exist`, async () => {
      dbClientMock.work.findUnique.mockResolvedValue(null);

      const { req, res } = getHandlerMocksWithUser();
      await getWork(req, res);

      expect(dbClientMock.work.findUnique).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.send).toHaveBeenCalled();
    });
  });

  describe('createGoal', () => {
    it('creates a goal', async() => {
      const WORK_ID = -10;
      // @ts-ignore until strictNullChecks is turned on in the codebase (see tip at https://www.prisma.io/docs/orm/prisma-client/testing/unit-testing#dependency-injection)
      dbClientMock.work.create.mockResolvedValue(mockObject<Work>({
        id: WORK_ID,
      }));

      const { req, res } = getHandlerMocksWithUser();
      await createWork(req, res);

      // @ts-ignore until strictNullChecks is turned on in the codebase (see tip at https://www.prisma.io/docs/orm/prisma-client/testing/unit-testing#dependency-injection)
      expect(dbClientMock.work.create).toHaveBeenCalled();
      expect(logAuditEventMock).toHaveBeenCalledWith('work:create', MOCK_USER_ID, WORK_ID, null, null, TEST_SESSION_ID);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.send).toHaveBeenCalled();
    });
  });

  describe('updateWork', () => {
    it('updates a work', async () => {
      const WORK_ID = -10;
      dbClientMock.work.update.mockResolvedValue(
        mockObject<Work>({ id: WORK_ID,})
      );

      const { req, res } = getHandlerMocksWithUser();
      await updateWork(req, res);

      // @ts-ignore until strictNullChecks is turned on in the codebase (see tip at https://www.prisma.io/docs/orm/prisma-client/testing/unit-testing#dependency-injection)
      expect(dbClientMock.work.update).toHaveBeenCalled();
      expect(logAuditEventMock).toHaveBeenCalledWith('work:update', MOCK_USER_ID, WORK_ID, null, null, TEST_SESSION_ID);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalled();
    });
  });

  describe('deleteWork', () => {
    it('deletes a work', async () => {
      const WORK_ID = -10;
      dbClientMock.work.update.mockResolvedValue(
        mockObject<Work>({ id: WORK_ID })
      );

      const { req, res } = getHandlerMocksWithUser();
      await deleteWork(req, res);

      // @ts-ignore until strictNullChecks is turned on in the codebase (see tip at https://www.prisma.io/docs/orm/prisma-client/testing/unit-testing#dependency-injection)
      expect(dbClientMock.work.update).toHaveBeenCalled();
      expect(logAuditEventMock).toHaveBeenCalledWith('work:delete', MOCK_USER_ID, WORK_ID, null, null, TEST_SESSION_ID);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalled();
    });
  });
});