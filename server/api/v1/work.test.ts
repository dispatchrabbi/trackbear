import { vi, describe, it, expect, afterEach } from 'vitest';
import { mockObject, mockObjects, TEST_SESSION_ID, TEST_USER_ID } from '../../../testing-support/util.ts';
import { getHandlerMocksWithUser } from '../../lib/__mocks__/express.ts';
import type { Work, Tally } from '@prisma/client';

vi.mock('../../lib/db.ts');
import dbClientMock from '../../lib/__mocks__/db.ts';

vi.mock('../../lib/audit-events.ts', { spy: true });
import { logAuditEventMock } from '../../lib/__mocks__/audit-events.ts';

import { handleGetWorks, handleGetWork, handleCreateWork, handleUpdateWork, handleDeleteWork } from './work.ts';
import { TALLY_MEASURE } from 'server/lib/models/tally/consts.ts';

describe('work api v1', () => {
  afterEach(() => {
    vi.resetAllMocks();
  });

  describe(handleGetWorks, () => {
    it('returns works', async () => {
      // @ts-ignore until strictNullChecks is turned on in the codebase (see tip at https://www.prisma.io/docs/orm/prisma-client/testing/unit-testing#dependency-injection)
      dbClientMock.work.findMany.mockResolvedValue(
        mockObjects<Work & { tallies: Tally[] }>(2, () => ({
          tallies: mockObjects<Tally>(3, () => ({ measure: TALLY_MEASURE.WORD, count: 10 })),
        })),
      );

      const { req, res } = getHandlerMocksWithUser();
      await handleGetWorks(req, res);

      expect(dbClientMock.work.findMany).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalled();
    });
  });

  describe(handleGetWork, () => {
    it('returns a work if it finds one', async () => {
      dbClientMock.work.findUnique.mockResolvedValue(mockObject<Work>());

      const { req, res } = getHandlerMocksWithUser();
      await handleGetWork(req, res);

      expect(dbClientMock.work.findUnique).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalled();
    });

    it(`returns a 404 if the goal doesn't exist`, async () => {
      dbClientMock.work.findUnique.mockResolvedValue(null);

      const { req, res } = getHandlerMocksWithUser();
      await handleGetWork(req, res);

      expect(dbClientMock.work.findUnique).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.send).toHaveBeenCalled();
    });
  });

  describe(handleCreateWork, () => {
    it('creates a goal', async () => {
      const WORK_ID = -10;
      // @ts-ignore until strictNullChecks is turned on in the codebase (see tip at https://www.prisma.io/docs/orm/prisma-client/testing/unit-testing#dependency-injection)
      dbClientMock.work.create.mockResolvedValue(mockObject<Work>({
        id: WORK_ID,
      }));

      const { req, res } = getHandlerMocksWithUser();
      await handleCreateWork(req, res);

      // @ts-ignore until strictNullChecks is turned on in the codebase (see tip at https://www.prisma.io/docs/orm/prisma-client/testing/unit-testing#dependency-injection)
      expect(dbClientMock.work.create).toHaveBeenCalled();
      expect(logAuditEventMock).toHaveBeenCalledWith('work:create', TEST_USER_ID, WORK_ID, null, null, TEST_SESSION_ID);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.send).toHaveBeenCalled();
    });
  });

  describe(handleUpdateWork, () => {
    it('updates a work', async () => {
      const WORK_ID = -10;
      dbClientMock.work.update.mockResolvedValue(
        mockObject<Work>({ id: WORK_ID }),
      );

      const { req, res } = getHandlerMocksWithUser();
      await handleUpdateWork(req, res);

      // @ts-ignore until strictNullChecks is turned on in the codebase (see tip at https://www.prisma.io/docs/orm/prisma-client/testing/unit-testing#dependency-injection)
      expect(dbClientMock.work.update).toHaveBeenCalled();
      expect(logAuditEventMock).toHaveBeenCalledWith('work:update', TEST_USER_ID, WORK_ID, null, null, TEST_SESSION_ID);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalled();
    });
  });

  describe(handleDeleteWork, () => {
    it('deletes a work', async () => {
      const WORK_ID = -10;
      dbClientMock.work.update.mockResolvedValue(
        mockObject<Work>({ id: WORK_ID }),
      );

      const { req, res } = getHandlerMocksWithUser();
      await handleDeleteWork(req, res);

      // @ts-ignore until strictNullChecks is turned on in the codebase (see tip at https://www.prisma.io/docs/orm/prisma-client/testing/unit-testing#dependency-injection)
      expect(dbClientMock.work.update).toHaveBeenCalled();
      expect(logAuditEventMock).toHaveBeenCalledWith('work:delete', TEST_USER_ID, WORK_ID, null, null, TEST_SESSION_ID);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalled();
    });
  });
});
