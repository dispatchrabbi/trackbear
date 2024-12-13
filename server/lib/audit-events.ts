import winston from 'winston';
import dbClient from "./db.ts";

export const AUDIT_EVENT = {
  BANNER_CREATE: 'banner:create',
  BANNER_UPDATE: 'banner:update',
  BANNER_DELETE: 'banner:delete',
};

export const TRACKBEAR_SYSTEM_ID = -1;
export async function logAuditEvent(eventType: string, agentId: number, patientId?: number | null, goalId?: number | null, auxInfo: Record<string, unknown> = {}, sessionId?: string | null) {
  winston.debug(`${eventType}`, {
    agentId,
    patientId,
    goalId,
    auxInfo: JSON.stringify(auxInfo),
  });
  
  try {
    await dbClient.auditEvent.create({
      data: {
        eventType,
        agentId, patientId, goalId,
        auxInfo: JSON.stringify(auxInfo),
        sessionId,
      },
    });
  } catch(err) {
    // log an error but don't do anything. failure to record an audit event shouldn't tank a request
    winston.error(err);
  }
}

type ChangeRecord<F> = {
  from: F | null;
  to: F | null;
};
export function buildChangeRecord<T extends object>(from: Partial<T>, to: Partial<T>)  {
  const changes = {} as Record<keyof T, ChangeRecord<T[keyof T]>>;

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
