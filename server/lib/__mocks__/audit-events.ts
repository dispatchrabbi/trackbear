import * as auditEvents from '../audit-events';
import { vi, beforeEach, afterEach } from 'vitest';
import { mockReset } from 'vitest-mock-extended';

const logAuditEventMock = vi.spyOn(auditEvents, 'logAuditEvent');
const buildChangeRecordMock = vi.spyOn(auditEvents, 'buildChangeRecord');

beforeEach(() => {
  buildChangeRecordMock.mockImplementation(() => ({}))
});

afterEach(() => {
  mockReset(logAuditEventMock);
  mockReset(buildChangeRecordMock);
});

export {
  logAuditEventMock,
  buildChangeRecordMock,
};