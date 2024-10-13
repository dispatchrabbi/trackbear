import { vi, expect, describe, it, beforeEach } from 'vitest';

vi.mock('../lib/db.ts');
import dbClientMock from '../lib/__mocks__/db.ts';

import { getHandlerMocks } from 'server/lib/__mocks__/express.ts';

import { handleGetBanners } from "./banners.ts";

describe('/api/banners', () => {
  describe('GET /', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('returns banners', async () => {
      const { req, res, next } = getHandlerMocks();

      await handleGetBanners(req, res, next);

      // @ts-ignore until strictNullChecks is turned on in the codebase (see tip at https://www.prisma.io/docs/orm/prisma-client/testing/unit-testing#dependency-injection)
      expect(dbClientMock.banner.findMany).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalled();
    });

    it('sends errors to next', async () => {
      const err = new Error('test error');
      dbClientMock.banner.findMany.mockRejectedValue(err)
      const { req, res, next } = getHandlerMocks();

      await handleGetBanners(req, res, next);

      expect(dbClientMock.banner.findMany).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled()
      expect(res.send).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(err);
    });
  });
});