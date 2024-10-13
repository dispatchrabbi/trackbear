import * as auditEvents from '../audit-events';
import { vi, beforeEach } from 'vitest';
import { mockReset } from 'vitest-mock-extended';

const mockLogAuditEvent = vi.spyOn(auditEvents, 'logAuditEvent');
export default mockLogAuditEvent;

beforeEach(() => {
  mockReset(mockLogAuditEvent);
});
