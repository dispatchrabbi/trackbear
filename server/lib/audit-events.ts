import { getLogger } from 'server/lib/logger.ts';
const logger = getLogger();

import { AuditEventModel } from './models/audit-event/audit-event-model.ts';

export const UNKNOWN_ACTOR_ID = 0;
export const TRACKBEAR_SYSTEM_ID = -1;

export async function logAuditEvent(eventType: string, agentId: number, patientId?: number | null, goalId?: number | null, auxInfo: Record<string, unknown> | null = {}, sessionId?: string | null) {
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
    await AuditEventModel.createAuditEvent(eventType, agentId, patientId, goalId, auxInfo, sessionId);
  } catch (err) {
    // log an error but don't do anything. failure to record an audit event shouldn't tank a request
    logger.error(err);
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
