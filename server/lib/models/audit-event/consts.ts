import { ValueEnum } from "../../obj";

export const AUDIT_EVENT_ENTITIES = {
  BANNER: 'banner',
  BOARD: 'board',
  GOAL: 'goal',
  TAG: 'tag',
  TALLY: 'tally',
  USER: 'user',
  WORK: 'work',
} as const;
export type AuditEventEntity = ValueEnum<typeof AUDIT_EVENT_ENTITIES>;

// TODO: extract CUD events and base them off the entities enum
export const AUDIT_EVENT_TYPE = {
  BANNER_CREATE: 'banner:create',
  BANNER_UPDATE: 'banner:update',
  BANNER_DELETE: 'banner:delete',

  BOARD_CREATE: 'board:create',
  BOARD_UPDATE: 'board:update',
  BOARD_DELETE: 'board:delete',
  BOARD_UNDELETE: 'board:undelete',

  GOAL_CREATE: 'goal:create',
  GOAL_UPDATE: 'goal:update',
  GOAL_DELETE: 'goal:delete',
  GOAL_UNDELETE: 'goal:undelete',
  
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
  [AUDIT_EVENT_TYPE.BOARD_CREATE]: {
    agent: AUDIT_EVENT_ENTITIES.USER,
    patient: AUDIT_EVENT_ENTITIES.BOARD,
    goal: null
  },
  [AUDIT_EVENT_TYPE.BOARD_UPDATE]: {
    agent: AUDIT_EVENT_ENTITIES.USER,
    patient: AUDIT_EVENT_ENTITIES.BOARD,
    goal: null
  },
  [AUDIT_EVENT_TYPE.BOARD_DELETE]: {
    agent: AUDIT_EVENT_ENTITIES.USER,
    patient: AUDIT_EVENT_ENTITIES.BOARD,
    goal: null
  },
  [AUDIT_EVENT_TYPE.BOARD_UNDELETE]: {
    agent: AUDIT_EVENT_ENTITIES.USER,
    patient: AUDIT_EVENT_ENTITIES.BOARD,
    goal: null
  },
  [AUDIT_EVENT_TYPE.GOAL_CREATE]: {
    agent: AUDIT_EVENT_ENTITIES.USER,
    patient: AUDIT_EVENT_ENTITIES.GOAL,
    goal: null
  },
  [AUDIT_EVENT_TYPE.GOAL_UPDATE]: {
    agent: AUDIT_EVENT_ENTITIES.USER,
    patient: AUDIT_EVENT_ENTITIES.GOAL,
    goal: null
  },
  [AUDIT_EVENT_TYPE.GOAL_DELETE]: {
    agent: AUDIT_EVENT_ENTITIES.USER,
    patient: AUDIT_EVENT_ENTITIES.GOAL,
    goal: null
  },
  [AUDIT_EVENT_TYPE.GOAL_UNDELETE]: {
    agent: AUDIT_EVENT_ENTITIES.USER,
    patient: AUDIT_EVENT_ENTITIES.GOAL,
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
  [AUDIT_EVENT_TYPE.WORK_CREATE]: {
    agent: AUDIT_EVENT_ENTITIES.USER,
    patient: AUDIT_EVENT_ENTITIES.WORK,
    goal: null
  },
  [AUDIT_EVENT_TYPE.WORK_UPDATE]: {
    agent: AUDIT_EVENT_ENTITIES.USER,
    patient: AUDIT_EVENT_ENTITIES.WORK,
    goal: null
  },
  [AUDIT_EVENT_TYPE.WORK_DELETE]: {
    agent: AUDIT_EVENT_ENTITIES.USER,
    patient: AUDIT_EVENT_ENTITIES.WORK,
    goal: null
  },
  [AUDIT_EVENT_TYPE.WORK_UNDELETE]: {
    agent: AUDIT_EVENT_ENTITIES.USER,
    patient: AUDIT_EVENT_ENTITIES.WORK,
    goal: null
  },
};