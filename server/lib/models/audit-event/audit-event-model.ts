import { getDbClient, type TransactionClient } from 'server/lib/db.ts';
import { type AuditEvent } from 'generated/prisma/client';
import { type AuditEventWhereInput } from 'generated/prisma/models/AuditEvent.ts';

import { traced } from '../../metrics/tracer.ts';

import { type AuditEventEntity, type AuditEventType, AUDIT_EVENT_TYPE_ARGUMENTS } from './consts.ts';
import { type Create } from '../types.ts';
import { type Expand } from 'server/lib/obj.ts';

export type { AuditEvent };
export type CreateAuditEventData = Expand<Omit<Create<AuditEvent>, 'auxInfo' | 'eventType'> & {
  eventType: AuditEventType;
  auxInfo: Record<string, unknown> | null;
}>;

type InvolvedPartyId = 'agentId' | 'patientId' | 'goalId';

export class AuditEventModel {
  @traced
  static async getAuditEvents(ids: number | number[], entity: AuditEventEntity): Promise<AuditEvent[]> {
    const tuples = this.buildAuditEventTypeTuples(entity);
    if(tuples.length === 0) {
      return [];
    }

    ids = Array.isArray(ids) ? ids : [ids];

    const db = getDbClient();
    const events = db.auditEvent.findMany({
      where: {
        OR: tuples.map(([eventType, field]) => ({
          eventType,
          [field]: { in: ids },
        } satisfies AuditEventWhereInput)),
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return events;
  }

  private static buildAuditEventTypeTuples(entity: AuditEventEntity): [AuditEventType, InvolvedPartyId][] {
    const query: [AuditEventType, InvolvedPartyId][] = [];
    for(const eventType of Object.keys(AUDIT_EVENT_TYPE_ARGUMENTS)) {
      if(AUDIT_EVENT_TYPE_ARGUMENTS[eventType].agent === entity) {
        query.push([eventType, 'agentId']);
      }

      if(AUDIT_EVENT_TYPE_ARGUMENTS[eventType].patient === entity) {
        query.push([eventType, 'patientId']);
      }

      if(AUDIT_EVENT_TYPE_ARGUMENTS[eventType].goal === entity) {
        query.push([eventType, 'goalId']);
      }
    }

    return query;
  }

  @traced
  static async createAuditEvent(
    eventType: AuditEventType,
    agentId: number, patientId: number | null = null, goalId: number | null = null,
    auxInfo: Record<string, unknown> | null = null, sessionId: string | null = null,
    // this lets you pass in a tx to do audit events within a transaction
    db: TransactionClient | null = null,
  ): Promise<AuditEvent> {
    const stringifiedAuxInfo = JSON.stringify(auxInfo ?? {});

    db = db ?? getDbClient();
    const created = await db.auditEvent.create({
      data: {
        eventType,
        agentId, patientId, goalId,
        auxInfo: stringifiedAuxInfo,
        sessionId,
      },
    });

    return created;
  }

  @traced
  static async batchCreateAuditEvent(
    events: CreateAuditEventData[],
    // this lets you pass in a tx to do audit events within a transaction
    db: TransactionClient | null = null,
  ): Promise<AuditEvent[]> {
    const normalized = events.map(event => ({
      ...event,
      auxInfo: JSON.stringify(event.auxInfo ?? {}),
    }));

    db = db ?? getDbClient();
    const created = await db.auditEvent.createManyAndReturn({
      data: normalized,
    });

    return created;
  }
}
