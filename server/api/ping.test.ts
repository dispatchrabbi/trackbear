import { vi, expect, describe, it, beforeEach } from 'vitest';

import { getHandlerMocks } from 'server/lib/__mocks__/express.ts';
import { success } from '../lib/api-response.ts';

import { handleGetPing, handleGetError } from "./ping.ts";

describe('/api/ping', () => {
  describe('GET /', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('sends back pong', async () => {
      const { req, res, next } = getHandlerMocks();

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
      const { req, res, next } = getHandlerMocks();

      let expectedErr: Error;

      try {
        await handleGetError(req, res);
      } catch(err) {
        expectedErr = err;
      }

      expect(expectedErr).toBeInstanceOf(Error);
      expect(expectedErr.message).toEqual('pong');
      expect(res.status).not.toHaveBeenCalled();
      expect(res.send).not.toHaveBeenCalled();
    });
  });
});