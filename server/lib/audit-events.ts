import winston from 'winston';
import dbClient from "../lib/db.ts";

async function logAuditEvent(eventType: string, agentId: number, patientId?: number, goalId?: number, auxInfo: Record<string, unknown> = {}) {
  try {
    await dbClient.auditEvent.create({
      data: { eventType, agentId, patientId, goalId, auxInfo: JSON.stringify(auxInfo) },
    });
  } catch(err) {
    // log an error but don't do anything. failure to record and audit event shouldn't tank a request
    winston.error(err);
  }
}

export {
  logAuditEvent,
};
