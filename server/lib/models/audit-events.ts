import dbClient from "../db.ts";
import { type AuditEvent } from "@prisma/client";

import { traced } from "../tracer.ts";

export type { AuditEvent };

export const AUDIT_EVENT_TYPE = {
  BANNER_CREATE: 'banner:create',
  BANNER_UPDATE: 'banner:update',
  BANNER_DELETE: 'banner:delete',
  USER_SIGNUP: 'user:signup',
  USER_CREATE: 'user:create',
  USER_UPDATE: 'user:update',
  USER_ACTIVATE: 'user:activate',
  USER_SUSPEND: 'user:suspend',
  USER_DELETE: 'user:delete',
  USER_VERIFY_EMAIL: 'user:verifyemail',
  USER_PASSWORD_RESET: 'user:pwreset',
  USER_PASSWORD_CHANGE: 'user:pwchange',
  USER_REQUEST_EMAIL_VERIFICATION: 'user:verifyemailreq',
  USER_REQUEST_PASSWORD_RESET: 'user:pwresetreq',
  USER_LOGIN: 'user:login',
  USER_FAILED_LOGIN: 'user:failedlogin',
};
export type AuditEventType = typeof AUDIT_EVENT_TYPE[keyof typeof AUDIT_EVENT_TYPE];

export const AUDIT_EVENT_ENTITIES = {
  BANNER: 'banner',
  USER: 'user',
} as const;
export type AuditEventEntity = typeof AUDIT_EVENT_ENTITIES[keyof typeof AUDIT_EVENT_ENTITIES];

const AUDIT_EVENT_TYPE_ARGUMENTS: Record<AuditEventType, {
  agent: AuditEventEntity;
  patient: AuditEventEntity;
  goal: AuditEventEntity;
}> = {
  [AUDIT_EVENT_TYPE.BANNER_CREATE]: {
    agent: AUDIT_EVENT_ENTITIES.USER,
    patient: AUDIT_EVENT_ENTITIES.BANNER,
    goal: null
  },
  [AUDIT_EVENT_TYPE.BANNER_UPDATE]: {
    agent: AUDIT_EVENT_ENTITIES.USER,
    patient: AUDIT_EVENT_ENTITIES.BANNER,
    goal: null
  },
  [AUDIT_EVENT_TYPE.BANNER_DELETE]: {
    agent: AUDIT_EVENT_ENTITIES.USER,
    patient: AUDIT_EVENT_ENTITIES.BANNER,
    goal: null
  },
  [AUDIT_EVENT_TYPE.USER_SIGNUP]: {
    agent: AUDIT_EVENT_ENTITIES.USER,
    patient: AUDIT_EVENT_ENTITIES.USER,
    goal: null
  },
  [AUDIT_EVENT_TYPE.USER_CREATE]: {
    agent: AUDIT_EVENT_ENTITIES.USER,
    patient: AUDIT_EVENT_ENTITIES.USER,
    goal: null
  },
  [AUDIT_EVENT_TYPE.USER_UPDATE]: {
    agent: AUDIT_EVENT_ENTITIES.USER,
    patient: AUDIT_EVENT_ENTITIES.USER,
    goal: null
  },
  [AUDIT_EVENT_TYPE.USER_ACTIVATE]: {
    agent: AUDIT_EVENT_ENTITIES.USER,
    patient: AUDIT_EVENT_ENTITIES.USER,
    goal: null
  },
  [AUDIT_EVENT_TYPE.USER_SUSPEND]: {
    agent: AUDIT_EVENT_ENTITIES.USER,
    patient: AUDIT_EVENT_ENTITIES.USER,
    goal: null
  },
  [AUDIT_EVENT_TYPE.USER_DELETE]: {
    agent: AUDIT_EVENT_ENTITIES.USER,
    patient: AUDIT_EVENT_ENTITIES.USER,
    goal: null
  },
  [AUDIT_EVENT_TYPE.USER_REQUEST_EMAIL_VERIFICATION]: {
    agent: AUDIT_EVENT_ENTITIES.USER,
    patient: AUDIT_EVENT_ENTITIES.USER,
    goal: null
  },
  [AUDIT_EVENT_TYPE.USER_REQUEST_PASSWORD_RESET]: {
    agent: AUDIT_EVENT_ENTITIES.USER,
    patient: AUDIT_EVENT_ENTITIES.USER,
    goal: null
  },
};

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
    agentId: number | null, patientId: number | null, goalId: number | null,
    auxInfo: Record<string, unknown> = {}, sessionId: string | null
  ) {
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