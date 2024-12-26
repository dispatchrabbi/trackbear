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
  SYSTEM_NOOP: 'system:noop',
};
export type AuditEventType = typeof AUDIT_EVENT_TYPE[keyof typeof AUDIT_EVENT_TYPE];

export const AUDIT_EVENT_ENTITIES = {
  BANNER: 'banner',
  USER: 'user',
} as const;
export type AuditEventEntity = typeof AUDIT_EVENT_ENTITIES[keyof typeof AUDIT_EVENT_ENTITIES];

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