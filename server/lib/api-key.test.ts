import { describe, it, expect } from 'vitest';
import { mockObject } from 'testing-support/util';

import { generateApiToken, censorApiKey } from './api-key';
import { type ApiKey } from './models/api-key/api-key-model.ts';

describe('api-key', async () => {
  describe(generateApiToken, async () => {
    it('generates a well-formed API token', async () => {
      const token = await generateApiToken();

      expect(token).toMatch(/^tb\.[a-z0-9]+$/);
      expect(token).toHaveLength(40);
    });
  });

  describe(censorApiKey, async () => {
    it('censors an API token', async () => {
      const token = await generateApiToken();
      const key = mockObject<ApiKey>({ token });
      const censored = censorApiKey(key);

      expect(censored.token).toMatch(/^t0\.[0]+$/);
      expect(censored.token).toHaveLength(40);
    });
  });
});
