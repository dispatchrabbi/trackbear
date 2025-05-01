import { vi, expect, describe, it, afterEach } from 'vitest';
import { mockObject, mockObjects, TEST_SESSION_ID, TEST_USER_ID } from 'testing-support/util';

import { AuditEvent, AuditEventModel } from './audit-event-model.ts';
import { AUDIT_EVENT_ENTITIES, AUDIT_EVENT_TYPE, AuditEventEntity } from './consts.ts';

vi.mock('../../tracer.ts');

import _dbClient from '../../db.ts';
vi.mock('../../db.ts');
const dbClient = vi.mocked(_dbClient, { deep: true });

describe(AuditEventModel, () => {
  afterEach(() => {
    vi.resetAllMocks();
  });

  describe(AuditEventModel.getAuditEvents, () => {
    it('gets audit events based on the given entity', async () => {
      const testAuditEvents = mockObjects<AuditEvent>(10);
      dbClient.auditEvent.findMany.mockResolvedValue(testAuditEvents);

      const results = await AuditEventModel.getAuditEvents(TEST_USER_ID, AUDIT_EVENT_ENTITIES.USER);

      expect(results).toBe(testAuditEvents);
      expect(dbClient.auditEvent.findMany).toBeCalledWith({
        where: {
          OR: expect.any(Array),
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    });

    it(`shortcuts to an empty array if there are no valid audit events to get`, async () => {
      const results = await AuditEventModel.getAuditEvents(TEST_USER_ID, 'unused-entity' as AuditEventEntity);

      expect(results.length).toBe(0);
      expect(dbClient.auditEvent.findMany).not.toBeCalled();
    });
  });

  describe(AuditEventModel.createAuditEvent, () => {
    it(`creates an audit event`, async () => {
      const testAgentId = TEST_USER_ID;
      const testPatientId = TEST_USER_ID - 1;
      const testGoalId = TEST_USER_ID - 2;
      const testAuxInfo = { 'test': true };
      const testSessionId = TEST_SESSION_ID;

      const testAuditEvent = mockObject<AuditEvent>();
      dbClient.auditEvent.create.mockResolvedValue(testAuditEvent);

      const created = await AuditEventModel.createAuditEvent(
        AUDIT_EVENT_TYPE.SYSTEM_NOOP,
        testAgentId, testPatientId, testGoalId,
        testAuxInfo, testSessionId,
      );

      expect(created).toBe(testAuditEvent);
      expect(dbClient.auditEvent.create).toHaveBeenCalledWith({
        data: {
          eventType: AUDIT_EVENT_TYPE.SYSTEM_NOOP,
          agentId: testAgentId,
          patientId: testPatientId,
          goalId: testGoalId,
          auxInfo: '{"test":true}',
          sessionId: testSessionId,
        },
      });
    });

    it(`passes null for missing IDs and {} for missing auxInfo`, async () => {
      const testAgentId = TEST_USER_ID;

      const testAuditEvent = mockObject<AuditEvent>();
      dbClient.auditEvent.create.mockResolvedValue(testAuditEvent);

      const created = await AuditEventModel.createAuditEvent(
        AUDIT_EVENT_TYPE.SYSTEM_NOOP,
        testAgentId,
      );

      expect(created).toBe(testAuditEvent);
      expect(dbClient.auditEvent.create).toHaveBeenCalledWith({
        data: {
          eventType: AUDIT_EVENT_TYPE.SYSTEM_NOOP,
          agentId: testAgentId,
          patientId: null,
          goalId: null,
          auxInfo: '{}',
          sessionId: null,
        },
      });
    });
  });
});
