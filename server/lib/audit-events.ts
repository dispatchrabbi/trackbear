import winston from 'winston';
import dbClient from "../lib/db.ts";

const TRACKBEAR_SYSTEM_ID = -1;
async function logAuditEvent(eventType: string, agentId: number, patientId?: number, goalId?: number, auxInfo: Record<string, unknown> = {}, sessionId?: string) {
  try {
    await dbClient.auditEvent.create({
      data: {
        eventType,
        agentId, patientId, goalId,
        auxInfo: JSON.stringify(auxInfo ?? {}),
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
function buildChangeRecord<T extends object>(fields: Array<keyof T> , from: Partial<T>, to: Partial<T>)  {
  const changes = {} as Record<keyof T, ChangeRecord<T[keyof T]>>;
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

export {
  TRACKBEAR_SYSTEM_ID,
  logAuditEvent,
  buildChangeRecord,
};
