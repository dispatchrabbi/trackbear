import { expect, describe, it, beforeAll } from 'vitest';

import { disableEmail } from 'testing-support/env.ts';

import { reqCtxForScript } from 'server/lib/request-context.ts';

import { validateSeed, createSeed } from 'testing-support/seed/seed.ts';
import seedJson from '../../testing-support/seed/reference-seed.json' with { type: 'json' };

describe('user seeding', () => {
  beforeAll(async () => {
    await disableEmail();
  });

  it('successfully creates seed accounts as configured', async () => {
    const reqCtx = reqCtxForScript('integration-tests/user-creation.test.ts');

    const seedConfig = validateSeed(seedJson);
    const results = await createSeed(seedConfig, reqCtx);

    expect(Object.keys(results)).toEqual(['grizzly', 'polar']);
  });
});
