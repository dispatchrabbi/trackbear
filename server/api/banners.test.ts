import { vi, expect, describe, it, beforeEach } from 'vitest';

vi.mock('server/lib/db.ts');
import { getDbClient } from 'server/lib/db.ts';
const db = vi.mocked(getDbClient(), { deep: true });

import { getHandlerMocks } from 'server/lib/__mocks__/express.ts';

import { handleGetBanners } from './banners.ts';

describe('/api/banners', () => {
  describe('GET /', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('returns banners', async () => {
      const { req, res } = getHandlerMocks();

      await handleGetBanners(req, res);

      // @ts-ignore until strictNullChecks is turned on in the codebase (see tip at https://www.prisma.io/docs/orm/prisma-client/testing/unit-testing#dependency-injection)
      expect(db.banner.findMany).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalled();
    });
  });
});
