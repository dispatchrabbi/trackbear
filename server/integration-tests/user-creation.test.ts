import { vi, expect, describe, it, beforeAll } from 'vitest';

import { disableEmail } from 'testing-support/env.ts';
import _testDbClient from '../../testing-support/test-db.ts';
vi.mock('../lib/db.ts', () => ({
  default: _testDbClient,
}));

import { reqCtxForScript } from 'server/lib/request-context.ts';

import { createSeed } from 'testing-support/user-creation/create-test-user.ts';
import seedConfig from './user-creation.seed.json' with { type: 'json' };

describe('user seeding', () => {
  beforeAll(async () => {
    await disableEmail();
  });

  it('successfully creates seed accounts as configured', async () => {
    const reqCtx = reqCtxForScript('integration-tests/user-creation.test.ts');

    const results = await createSeed(seedConfig, reqCtx);

    expect(results.length).toBe(2);
  });
});
