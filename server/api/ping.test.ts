import { vi, expect, describe, it, beforeEach } from 'vitest';

import { getHandlerMocks } from 'server/lib/__mocks__/express.ts';
import { success } from '../lib/api-response.ts';

import { handleGetPing, handleGetError } from './ping.ts';

describe('/api/ping', () => {
  describe('GET /', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('sends back pong', async () => {
      const { req, res } = getHandlerMocks();

      await handleGetPing(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith(success('pong'));
    });
  });

  describe('GET /error', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('errors out and does not respond', async () => {
      const { req, res } = getHandlerMocks();

      let expectedErr: Error;

      try {
        await handleGetError(req, res);
      } catch (err) {
        expectedErr = err;
      }

      // @ts-expect-error -- ironic, no? (TODO: fix this test so it doesn't need this)
      expect(expectedErr).toBeInstanceOf(Error);
      // @ts-expect-error -- ironic, no? (TODO: fix this test so it doesn't need this)
      expect(expectedErr.message).toEqual('pong');

      expect(res.status).not.toHaveBeenCalled();
      expect(res.send).not.toHaveBeenCalled();
    });
  });
});
