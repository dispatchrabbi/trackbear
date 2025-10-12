import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mockObject } from '../../testing-support/util.ts';
import { getHandlerMocks } from '../lib/__mocks__/express.ts';
import * as env from '../lib/env';

import { type EnvInfo, handleGetEnv } from './info';

describe('/api/info', () => {
  describe.todo('GET /changelog', () => {

  });

  describe('GET /env', () => {
    let getNormalizedEnvSpy;
    beforeEach(() => {
      getNormalizedEnvSpy = vi.spyOn(env, 'getNormalizedEnv');
    });
    afterEach(() => {
      vi.restoreAllMocks();
    });

    it.skip('gets a slice of the env', async () => {
      getNormalizedEnvSpy.mockImplementation(async () => {
        return mockObject<env.TrackbearEnv>({
          EMAIL_URL_PREFIX: 'https://trackbear.test',
          ENABLE_METRICS: true,
          PLAUSIBLE_HOST: 'http://plausible.trackbear.test',
          PLAUSIBLE_DOMAIN: 'trackbear.test',
        });
      });

      const expected: EnvInfo = {
        URL_PREFIX: 'https://trackbear.test',
        ENABLE_METRICS: true,
        PLAUSIBLE_HOST: 'http://plausible.trackbear.test',
        PLAUSIBLE_DOMAIN: 'trackbear.test',
      };

      const { req, res } = getHandlerMocks();
      await handleGetEnv(req, res);

      expect(env.getNormalizedEnv).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith(expected);
    });
  });
});
