import dbClient from "../../db.ts";
import { type AuditEvent } from "@prisma/client";

import { traced } from "../../tracer.ts";

import { type AuditEventEntity, type AuditEventType, AUDIT_EVENT_TYPE_ARGUMENTS } from "./consts.ts";

export type { AuditEvent };

export class AuditEventModel {

  @traced
  static async getAuditEvents(id: number, entity: AuditEventEntity): Promise<AuditEvent[]> {
    const tuples = this.buildAuditEventTypeTuples(entity);
    if(tuples.length === 0) {
      return [];
    }

    const events = dbClient.auditEvent.findMany({
      where: {
        OR: tuples.map(([eventType, field]) => ({
          eventType,
          [field]: id,
        })),
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return events;
  }

  private static buildAuditEventTypeTuples(entity: AuditEventEntity) {
    const query = [];
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
    auxInfo: Record<string, unknown> = null, sessionId: string | null = null
  ): Promise<AuditEvent> {
    const stringifiedAuxInfo = JSON.stringify(auxInfo ?? {});

    const created = await dbClient.auditEvent.create({
      data: {
        eventType,
        agentId, patientId, goalId,
        auxInfo: stringifiedAuxInfo,
        sessionId,
      }
    });

    return created;
  }
}