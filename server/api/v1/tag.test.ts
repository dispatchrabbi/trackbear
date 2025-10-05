import { vi, describe, it, expect, afterEach } from 'vitest';
import { mockObject, mockObjects, TEST_SESSION_ID, TEST_USER_ID } from '../../../testing-support/util.ts';
import { getHandlerMocksWithUser } from '../../lib/__mocks__/express.ts';
import type { Tag } from 'generated/prisma/client';

vi.mock('server/lib/db.ts');
import { getDbClient } from 'server/lib/db.ts';
const db = vi.mocked(getDbClient(), { deep: true });

vi.mock('../../lib/audit-events.ts', { spy: true });
import { logAuditEventMock } from '../../lib/__mocks__/audit-events.ts';

import { handleGetTags, handleGetTag, handleCreateTag, handleUpdateTag, handleDeleteTag } from './tag.ts';

describe('tag api v1', () => {
  afterEach(() => {
    vi.resetAllMocks();
  });

  describe(handleGetTags, () => {
    it('returns tags', async () => {
      // @ts-ignore until strictNullChecks is turned on in the codebase (see tip at https://www.prisma.io/docs/orm/prisma-client/testing/unit-testing#dependency-injection)
      db.tag.findMany.mockResolvedValue(
        mockObjects<Tag>(2),
      );

      const { req, res } = getHandlerMocksWithUser();
      await handleGetTags(req, res);

      expect(db.tag.findMany).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalled();
    });
  });

  describe(handleGetTag, () => {
    it('returns a tag if it finds one', async () => {
      db.tag.findUnique.mockResolvedValue(mockObject<Tag>());

      const { req, res } = getHandlerMocksWithUser();
      await handleGetTag(req, res);

      expect(db.tag.findUnique).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalled();
    });

    it(`returns a 404 if the goal doesn't exist`, async () => {
      db.tag.findUnique.mockResolvedValue(null);

      const { req, res } = getHandlerMocksWithUser();
      await handleGetTag(req, res);

      expect(db.tag.findUnique).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.send).toHaveBeenCalled();
    });
  });

  describe(handleCreateTag, () => {
    it('creates a tag', async () => {
      db.tag.findMany.mockResolvedValue([]);
      const TAG_ID = -10;
      // @ts-ignore until strictNullChecks is turned on in the codebase (see tip at https://www.prisma.io/docs/orm/prisma-client/testing/unit-testing#dependency-injection)
      db.tag.create.mockResolvedValue(mockObject<Tag>({ id: TAG_ID }));

      const { req, res } = getHandlerMocksWithUser();
      await handleCreateTag(req, res);

      // @ts-ignore until strictNullChecks is turned on in the codebase (see tip at https://www.prisma.io/docs/orm/prisma-client/testing/unit-testing#dependency-injection)
      expect(db.tag.create).toHaveBeenCalled();
      expect(logAuditEventMock).toHaveBeenCalledWith('tag:create', TEST_USER_ID, TAG_ID, null, expect.any(Object), TEST_SESSION_ID);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.send).toHaveBeenCalled();
    });

    it('returns 400 if the proposed tag name already exists', async () => {
      db.tag.findMany.mockResolvedValue([mockObject<Tag>()]);

      const TAG_ID = -10;
      db.tag.create.mockResolvedValue(mockObject<Tag>({ id: TAG_ID }));

      const { req, res } = getHandlerMocksWithUser();
      await handleCreateTag(req, res);

      // @ts-ignore until strictNullChecks is turned on in the codebase (see tip at https://www.prisma.io/docs/orm/prisma-client/testing/unit-testing#dependency-injection)
      expect(db.tag.create).not.toHaveBeenCalled();
      expect(logAuditEventMock).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalled();
    });
  });

  describe(handleUpdateTag, () => {
    it('updates a tag', async () => {
      const TAG_ID = -10;
      db.tag.findUnique.mockResolvedValue(mockObject<Tag>({ id: TAG_ID }));
      db.tag.findMany.mockResolvedValue([]);
      db.tag.update.mockResolvedValue(mockObject<Tag>({ id: TAG_ID }));

      const { req, res } = getHandlerMocksWithUser({ params: { id: String(TAG_ID) } });
      await handleUpdateTag(req, res);

      // @ts-ignore until strictNullChecks is turned on in the codebase (see tip at https://www.prisma.io/docs/orm/prisma-client/testing/unit-testing#dependency-injection)
      expect(db.tag.update).toHaveBeenCalled();
      expect(logAuditEventMock).toHaveBeenCalledWith('tag:update', TEST_USER_ID, TAG_ID, null, expect.any(Object), TEST_SESSION_ID);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalled();
    });

    it('returns 400 if the proposed tag name already exists', async () => {
      const TAG_ID = -10;
      db.tag.findUnique.mockResolvedValue(mockObject<Tag>({ id: TAG_ID }));
      db.tag.findMany.mockResolvedValue([mockObject<Tag>({ id: TAG_ID - 1 })]);
      db.tag.update.mockResolvedValue(mockObject<Tag>({ id: TAG_ID }));

      const { req, res } = getHandlerMocksWithUser({
        params: { id: String(TAG_ID) },
        body: { name: 'already exists' },
      });
      await handleUpdateTag(req, res);

      // @ts-ignore until strictNullChecks is turned on in the codebase (see tip at https://www.prisma.io/docs/orm/prisma-client/testing/unit-testing#dependency-injection)
      expect(db.tag.update).not.toHaveBeenCalled();
      expect(logAuditEventMock).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalled();
    });
  });

  describe(handleDeleteTag, () => {
    it('deletes a tag', async () => {
      const TAG_ID = -10;
      db.tag.findUnique.mockResolvedValue(mockObject<Tag>({ id: TAG_ID }));
      db.tag.delete.mockResolvedValue(mockObject<Tag>({ id: TAG_ID }));

      const { req, res } = getHandlerMocksWithUser({
        params: { id: String(TAG_ID) },
      });
      await handleDeleteTag(req, res);

      // @ts-ignore until strictNullChecks is turned on in the codebase (see tip at https://www.prisma.io/docs/orm/prisma-client/testing/unit-testing#dependency-injection)
      expect(db.tag.delete).toHaveBeenCalled();
      expect(logAuditEventMock).toHaveBeenCalledWith('tag:delete', TEST_USER_ID, TAG_ID, null, expect.any(Object), TEST_SESSION_ID);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalled();
    });
  });
});
