import { ValueEnum } from "../../obj";

export const AUDIT_EVENT_ENTITIES = {
  BANNER: 'banner',
  TAG: 'tag',
  TALLY: 'tally',
  USER: 'user',
} as const;
export type AuditEventEntity = ValueEnum<typeof AUDIT_EVENT_ENTITIES>;

// TODO: extract CUD events and base them off the entities enum
export const AUDIT_EVENT_TYPE = {
  BANNER_CREATE: 'banner:create',
  BANNER_UPDATE: 'banner:update',
  BANNER_DELETE: 'banner:delete',
  
  TAG_CREATE: 'tag:create',
  TAG_UPDATE: 'tag:update',
  TAG_DELETE: 'tag:delete',
  
  TALLY_CREATE: 'tally:create',
  TALLY_UPDATE: 'tally:update',
  TALLY_DELETE: 'tally:delete',
  
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
  
  WORK_CREATE: 'work:create',
  WORK_UPDATE: 'work:update',
  WORK_DELETE: 'work:delete',
  WORK_UNDELETE: 'work:undelete',
  
  SYSTEM_NOOP: 'system:noop',
};
export type AuditEventType = ValueEnum<typeof AUDIT_EVENT_TYPE>;

export const AUDIT_EVENT_TYPE_ARGUMENTS: Record<AuditEventType, {
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
  [AUDIT_EVENT_TYPE.TAG_CREATE]: {
    agent: AUDIT_EVENT_ENTITIES.USER,
    patient: AUDIT_EVENT_ENTITIES.TAG,
    goal: null
  },
  [AUDIT_EVENT_TYPE.TAG_UPDATE]: {
    agent: AUDIT_EVENT_ENTITIES.USER,
    patient: AUDIT_EVENT_ENTITIES.TAG,
    goal: null
  },
  [AUDIT_EVENT_TYPE.TAG_DELETE]: {
    agent: AUDIT_EVENT_ENTITIES.USER,
    patient: AUDIT_EVENT_ENTITIES.TAG,
    goal: null
  },
  [AUDIT_EVENT_TYPE.TALLY_CREATE]: {
    agent: AUDIT_EVENT_ENTITIES.USER,
    patient: AUDIT_EVENT_ENTITIES.TALLY,
    goal: null
  },
  [AUDIT_EVENT_TYPE.TALLY_UPDATE]: {
    agent: AUDIT_EVENT_ENTITIES.USER,
    patient: AUDIT_EVENT_ENTITIES.TALLY,
    goal: null
  },
  [AUDIT_EVENT_TYPE.TALLY_DELETE]: {
    agent: AUDIT_EVENT_ENTITIES.USER,
    patient: AUDIT_EVENT_ENTITIES.TALLY,
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