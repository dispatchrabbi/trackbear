import { vi, expect, describe, it, beforeEach } from 'vitest';

import { getHandlerMocks } from 'server/lib/__mocks__/express.ts';
import { success } from '../../lib/api-response.ts';

import { handleGetPing } from './ping.ts';

describe('ping api v1', () => {
  describe(handleGetPing, () => {
    beforeEach(() => {
      vi.resetAllMocks();
    });

    it('sends back pong', async () => {
      const { req, res } = getHandlerMocks();

      await handleGetPing(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith(success('pong'));
    });
  });
});
