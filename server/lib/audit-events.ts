import { getLogger } from 'server/lib/logger.ts';
const logger = getLogger();

import { AuditEventModel, type CreateAuditEventData } from './models/audit-event/audit-event-model.ts';
import type { TransactionClient } from './db.ts';

export const UNKNOWN_ACTOR_ID = 0;
export const TRACKBEAR_SYSTEM_ID = -1;

type LogAuditEventOptions = {
  db: TransactionClient | null;
  throwOnError: boolean;
};

export async function logAuditEvent(
  eventType: string,
  agentId: number, patientId?: number | null, goalId?: number | null,
  auxInfo: Record<string, unknown> | null = {}, sessionId?: string | null,
  options: Partial<LogAuditEventOptions> = {},
) {
  options = {
    db: null, // use this to pass transaction clients through
    throwOnError: false, // by default, failure to register an audit event shouldn't tank a request
    ...options,
  };

  if(auxInfo === null) {
    auxInfo = {};
  }

  logger.debug(`${eventType}`, {
    agentId,
    patientId,
    goalId,
    auxInfo: JSON.stringify(auxInfo),
  });

  try {
    await AuditEventModel.createAuditEvent(
      eventType,
      agentId, patientId, goalId,
      auxInfo, sessionId,
      options.db,
    );
  } catch (err) {
    // always log an error, even if we aren't going to throw
    logger.error(err);

    if(options.throwOnError) {
      throw new Error('Could not create audit event', {
        cause: err,
      });
    }
  }
}

export async function logManyAuditEvents(
  auditEvents: CreateAuditEventData[],
  options: Partial<LogAuditEventOptions> = {},
) {
  options = {
    db: null, // use this to pass transaction clients through
    throwOnError: false, // by default, failure to register an audit event shouldn't tank a request
    ...options,
  };

  for(const ae of auditEvents) {
    logger.debug(`${ae.eventType}`, {
      agentId: ae.agentId,
      patientId: ae.patientId,
      goalId: ae.goalId,
      auxInfo: JSON.stringify(ae.auxInfo),
    });
  }

  try {
    await AuditEventModel.batchCreateAuditEvent(
      auditEvents,
      options.db,
    );
  } catch (err) {
    // always log an error, even if we aren't going to throw
    logger.error(err);

    if(options.throwOnError) {
      throw new Error('Could not batch create audit events', {
        cause: err,
      });
    }
  }
}

type ChangeRecordField<F> = {
  from: F | null;
  to: F | null;
};
export type ChangeRecord<T> = Record<keyof T, ChangeRecordField<T[keyof T]>>;

export function buildChangeRecord<T extends object>(from: Partial<T>, to: Partial<T>): ChangeRecord<T> {
  const changes = {} as Record<keyof T, ChangeRecordField<T[keyof T]>>;

  const fields = [...new Set([...Object.keys(from), ...Object.keys(to)])];
  for(const field of fields) {
    // intentional double-equals to capture undefined as well
    const fromVal = from[field] == null ? null : from[field];
    const toVal = to[field] == null ? null : to[field];

    if(fromVal === toVal) {
      continue;
    }

    changes[field] = {
      from: fromVal,
      to: toVal,
    };
  }

  return changes;
}
