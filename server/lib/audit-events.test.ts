import { expect, describe, it, vi } from 'vitest';
import { logAuditEvent, buildChangeRecord } from './audit-events.ts';

vi.mock('server/lib/db.ts');
import { getDbClient } from 'server/lib/db.ts';
const db = vi.mocked(getDbClient(), { deep: true });

describe('logAuditEvent', () => {
  it('creates an audit event in the database', async () => {
    await logAuditEvent('test:event', 12, 34, null, { extra: 'info' }, 'some-fake-session-id');

    // @ts-ignore until strictNullChecks is turned on in the codebase (see tip at https://www.prisma.io/docs/orm/prisma-client/testing/unit-testing#dependency-injection)
    expect(db.auditEvent.create).toBeCalled();
  });

  it('does not complain if creating the audit event fails', async () => {
    db.auditEvent.create.mockRejectedValue(new Error('test error'));

    const result = await logAuditEvent('test:event', 12, 34, null, { extra: 'info' }, 'some-fake-session-id');

    // @ts-ignore until strictNullChecks is turned on in the codebase (see tip at https://www.prisma.io/docs/orm/prisma-client/testing/unit-testing#dependency-injection)
    expect(db.auditEvent.create).toBeCalled();
    expect(result).toBe(undefined);
  });
});

describe('buildChangeRecord', () => {
  it('shows changed fields', () => {
    const expected = {
      changed: { from: 'old', to: 'new' },
    };

    const from = {
      changed: 'old',
      same: 'constant',
    };
    const to = {
      changed: 'new',
      same: 'constant',
    };
    const actual = buildChangeRecord(from, to);

    expect(actual).toStrictEqual(expected);
  });

  it('shows added fields', () => {
    const expected = {
      added: { from: null, to: 'here' },
    };

    const from = {
      same: 'constant',
    };
    const to = {
      added: 'here',
      same: 'constant',
    };
    const actual = buildChangeRecord(from, to);

    expect(actual).toStrictEqual(expected);
  });

  it('shows removed fields', () => {
    const expected = {
      removed: { from: 'here', to: null },
    };

    const from = {
      removed: 'here',
      same: 'constant',
    };
    const to = {
      same: 'constant',
    };
    const actual = buildChangeRecord(from, to);

    expect(actual).toStrictEqual(expected);
  });

  it('returns an empty object if nothing changed', () => {
    const expected = {};

    const from = {
      same: 'constant',
    };
    const to = {
      same: 'constant',
    };
    const actual = buildChangeRecord(from, to);

    expect(actual).toStrictEqual(expected);
  });
});
