import { vi, describe, it, expect, afterEach } from 'vitest';
import { mockObject, mockObjects, TEST_SESSION_ID, TEST_USER_ID } from '../../../testing-support/util.ts';
import { getHandlerMocksWithUser } from '../../lib/__mocks__/express.ts';
import { Work, type Tally } from 'generated/prisma/client';
import type { TallyWithWorkAndTags } from './tally.ts';
import { TALLY_MEASURE } from 'server/lib/models/tally/consts.ts';

vi.mock('../../lib/db.ts');
import dbClientMock from '../../lib/__mocks__/db.ts';

vi.mock('../../lib/audit-events.ts', { spy: true });
import { logAuditEventMock } from 'server/lib/__mocks__/audit-events.ts';

import { handleGetTallies, handleGetTally, handleCreateTally, handleCreateTallies, handleUpdateTally, handleDeleteTally } from './tally';

describe('tally api v1', () => {
  afterEach(() => {
    vi.resetAllMocks();
  });

  describe(handleGetTallies, () => {
    it('returns tallies', async () => {
      // @ts-ignore until strictNullChecks is turned on in the codebase (see tip at https://www.prisma.io/docs/orm/prisma-client/testing/unit-testing#dependency-injection)
      dbClientMock.tally.findMany.mockResolvedValue(mockObjects<TallyWithWorkAndTags>(2));

      const { req, res } = getHandlerMocksWithUser();
      await handleGetTallies(req, res);

      expect(dbClientMock.tally.findMany).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalled();
    });
  });

  describe(handleGetTally, () => {
    it('returns a tally if it finds one', async () => {
      dbClientMock.tally.findUnique.mockResolvedValue(mockObject<TallyWithWorkAndTags>());

      const { req, res } = getHandlerMocksWithUser();
      await handleGetTally(req, res);

      expect(dbClientMock.tally.findUnique).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalled();
    });

    it(`returns a 404 if the tally doesn't exist`, async () => {
      dbClientMock.tally.findUnique.mockResolvedValue(null);

      const { req, res } = getHandlerMocksWithUser();
      await handleGetTally(req, res);

      expect(dbClientMock.tally.findUnique).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.send).toHaveBeenCalled();
    });
  });

  describe(handleCreateTally, () => {
    it('creates a tally that increments the total', async () => {
      const TALLY_ID = -10;
      const WORK_ID = -20;
      // @ts-ignore until strictNullChecks is turned on in the codebase (see tip at https://www.prisma.io/docs/orm/prisma-client/testing/unit-testing#dependency-injection)
      dbClientMock.tally.create.mockResolvedValue(mockObject<TallyWithWorkAndTags>({
        id: TALLY_ID,
      }));

      const { req, res } = getHandlerMocksWithUser({
        body: {
          setTotal: false,
          workId: WORK_ID,
          tags: [],
        },
      });
      await handleCreateTally(req, res);

      // @ts-ignore until strictNullChecks is turned on in the codebase (see tip at https://www.prisma.io/docs/orm/prisma-client/testing/unit-testing#dependency-injection)
      expect(dbClientMock.work.findUnique).not.toHaveBeenCalled();
      expect(dbClientMock.tally.findMany).not.toHaveBeenCalled();
      expect(dbClientMock.tally.create).toHaveBeenCalled();
      expect(logAuditEventMock).toHaveBeenCalledWith('tally:create', TEST_USER_ID, TALLY_ID, null, null, TEST_SESSION_ID);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.send).toHaveBeenCalled();
    });

    it('creates a tally that sets the total', async () => {
      const TALLY_ID = -10;
      const WORK_ID = -20;
      // @ts-ignore until strictNullChecks is turned on in the codebase (see tip at https://www.prisma.io/docs/orm/prisma-client/testing/unit-testing#dependency-injection)
      dbClientMock.work.findUnique.mockResolvedValue(mockObject<Work>({
        id: WORK_ID,
        startingBalance: { [TALLY_MEASURE.WORD]: 100 },
      }));
      dbClientMock.tally.findMany.mockResolvedValue(mockObjects<Tally>(3, () => ({
        measure: TALLY_MEASURE.WORD,
        count: 250,
      })));
      dbClientMock.tally.create.mockResolvedValue(mockObject<TallyWithWorkAndTags>({ id: TALLY_ID }));

      const { req, res } = getHandlerMocksWithUser({
        body: {
          setTotal: true,
          measure: TALLY_MEASURE.WORD,
          count: 1000,
          workId: WORK_ID,
          tags: [],
        },
      });
      await handleCreateTally(req, res);

      // @ts-ignore until strictNullChecks is turned on in the codebase (see tip at https://www.prisma.io/docs/orm/prisma-client/testing/unit-testing#dependency-injection)
      expect(dbClientMock.work.findUnique).toHaveBeenCalled();
      expect(dbClientMock.tally.findMany).toHaveBeenCalled();
      expect(dbClientMock.tally.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ count: 150 }),
      }));
      expect(logAuditEventMock).toHaveBeenCalledWith('tally:create', TEST_USER_ID, TALLY_ID, null, null, TEST_SESSION_ID);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.send).toHaveBeenCalled();
    });

    it.todo('sends 400 if there is no work specified setting the total');

    it.todo('sends 400 if it cannot find the work when setting the total');
  });

  describe(handleCreateTallies, () => {
    it('creates multiple tallies', async () => {
      const TALLY_IDS = [-10, -11, -12];
      const WORK_ID = -20;
      // @ts-ignore until strictNullChecks is turned on in the codebase (see tip at https://www.prisma.io/docs/orm/prisma-client/testing/unit-testing#dependency-injection)
      dbClientMock.tally.createManyAndReturn.mockResolvedValue(
        TALLY_IDS.map(id => mockObject<Tally>({ id })),
      );

      const { req, res } = getHandlerMocksWithUser({
        body: [
          { workId: WORK_ID, tags: [] },
          { workId: WORK_ID, tags: [] },
          { workId: WORK_ID, tags: [] },
        ],
      });
      await handleCreateTallies(req, res);

      // @ts-ignore until strictNullChecks is turned on in the codebase (see tip at https://www.prisma.io/docs/orm/prisma-client/testing/unit-testing#dependency-injection)
      expect(dbClientMock.tally.createManyAndReturn).toHaveBeenCalled();
      expect(logAuditEventMock).toHaveBeenCalledTimes(3);
      expect(logAuditEventMock).toHaveBeenCalledWith('tally:create', TEST_USER_ID, TALLY_IDS[0], null, null, TEST_SESSION_ID);
      expect(logAuditEventMock).toHaveBeenCalledWith('tally:create', TEST_USER_ID, TALLY_IDS[1], null, null, TEST_SESSION_ID);
      expect(logAuditEventMock).toHaveBeenCalledWith('tally:create', TEST_USER_ID, TALLY_IDS[2], null, null, TEST_SESSION_ID);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.send).toHaveBeenCalled();
    });
  });

  describe(handleUpdateTally, () => {
    it('updates a tally that increments the total', async () => {
      const TALLY_ID = -10;
      const WORK_ID = -20;
      // @ts-ignore until strictNullChecks is turned on in the codebase (see tip at https://www.prisma.io/docs/orm/prisma-client/testing/unit-testing#dependency-injection)
      dbClientMock.tally.findUnique.mockResolvedValue(mockObject<TallyWithTags>({
        id: TALLY_ID,
        tags: [],
      }));
      dbClientMock.tally.update.mockResolvedValue(mockObject<TallyWithWorkAndTags>({
        id: TALLY_ID,
      }));

      const { req, res } = getHandlerMocksWithUser({
        body: {
          setTotal: false,
          workId: WORK_ID,
          tags: [],
        },
      });
      await handleUpdateTally(req, res);

      // @ts-ignore until strictNullChecks is turned on in the codebase (see tip at https://www.prisma.io/docs/orm/prisma-client/testing/unit-testing#dependency-injection)
      expect(dbClientMock.tally.findUnique).toHaveBeenCalled();
      expect(dbClientMock.work.findUnique).not.toHaveBeenCalled();
      expect(dbClientMock.tally.findMany).not.toHaveBeenCalled();
      expect(dbClientMock.tally.update).toHaveBeenCalled();
      expect(logAuditEventMock).toHaveBeenCalledWith('tally:update', TEST_USER_ID, TALLY_ID, null, expect.anything(), TEST_SESSION_ID);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalled();
    });

    it('creates a tally that sets the total', async () => {
      const TALLY_ID = -10;
      const WORK_ID = -20;
      // @ts-ignore until strictNullChecks is turned on in the codebase (see tip at https://www.prisma.io/docs/orm/prisma-client/testing/unit-testing#dependency-injection)
      dbClientMock.tally.findUnique.mockResolvedValue(mockObject<TallyWithTags>({
        id: TALLY_ID,
        tags: [],
      }));

      dbClientMock.work.findUnique.mockResolvedValue(mockObject<Work>({
        id: WORK_ID,
        startingBalance: { [TALLY_MEASURE.WORD]: 100 },
      }));
      dbClientMock.tally.findMany.mockResolvedValue(mockObjects<Tally>(3, () => ({
        measure: TALLY_MEASURE.WORD,
        count: 250,
      })));
      dbClientMock.tally.update.mockResolvedValue(mockObject<TallyWithWorkAndTags>({ id: TALLY_ID }));

      const { req, res } = getHandlerMocksWithUser({
        body: {
          setTotal: true,
          measure: TALLY_MEASURE.WORD,
          count: 1000,
          workId: WORK_ID,
          tags: [],
        },
      });
      await handleUpdateTally(req, res);

      // @ts-ignore until strictNullChecks is turned on in the codebase (see tip at https://www.prisma.io/docs/orm/prisma-client/testing/unit-testing#dependency-injection)
      expect(dbClientMock.tally.findUnique).toHaveBeenCalled();
      expect(dbClientMock.work.findUnique).toHaveBeenCalled();
      expect(dbClientMock.tally.findMany).toHaveBeenCalled();
      expect(dbClientMock.tally.update).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ count: 150 }),
      }));
      expect(logAuditEventMock).toHaveBeenCalledWith('tally:update', TEST_USER_ID, TALLY_ID, null, expect.anything(), TEST_SESSION_ID);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalled();
    });

    it.todo('sends 404 if there is no tally with the given id');

    it.todo('sends 400 if there is no work specified setting the total');

    it.todo('sends 400 if it cannot find the work when setting the total');
  });

  describe(handleDeleteTally, () => {
    it('deletes a tally', async () => {
      const TALLY_ID = -10;
      dbClientMock.tally.delete.mockResolvedValue(
        mockObject<Tally>({ id: TALLY_ID }),
      );

      const { req, res } = getHandlerMocksWithUser();
      await handleDeleteTally(req, res);

      // @ts-ignore until strictNullChecks is turned on in the codebase (see tip at https://www.prisma.io/docs/orm/prisma-client/testing/unit-testing#dependency-injection)
      expect(dbClientMock.tally.delete).toHaveBeenCalled();
      expect(logAuditEventMock).toHaveBeenCalledWith('tally:delete', TEST_USER_ID, TALLY_ID, null, null, TEST_SESSION_ID);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalled();
    });
  });
});
