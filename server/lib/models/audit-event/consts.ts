import { ValueEnum } from '../../obj';

export const AUDIT_EVENT_ENTITIES = {
  API_KEY: 'api-key',
  BANNER: 'banner',
  BOARD: 'board',
  GOAL: 'goal',
  LEADERBOARD: 'leaderboard',
  LEADERBOARD_MEMBER: 'leaderboard-member',
  LEADERBOARD_TEAM: 'leaderboard-team',
  PROJECT: 'work',
  TAG: 'tag',
  TALLY: 'tally',
  USER: 'user',
} as const;
export type AuditEventEntity = ValueEnum<typeof AUDIT_EVENT_ENTITIES>;

export const AUDIT_EVENT_TYPE = {
  API_KEY_CREATE: 'api-key:create',
  API_KEY_UPDATE: 'api-key:update',
  API_KEY_DELETE: 'api-key:delete',

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

  LEADERBOARD_CREATE: 'leaderboard:create',
  LEADERBOARD_UPDATE: 'leaderboard:update',
  LEADERBOARD_DELETE: 'leaderboard:delete',

  LEADERBOARD_MEMBER_CREATE: 'leaderboard-member:create',
  LEADERBOARD_MEMBER_UPDATE: 'leaderboard-member:update',
  LEADERBOARD_MEMBER_DELETE: 'leaderboard-member:delete',

  LEADERBOARD_TEAM_CREATE: 'leaderboard-team:create',
  LEADERBOARD_TEAM_UPDATE: 'leaderboard-team:update',
  LEADERBOARD_TEAM_DELETE: 'leaderboard-team:delete',

  // the values of these continue to be 'work:*' for legacy reasons
  // TODO: make a database migration that converts these
  PROJECT_CREATE: 'work:create',
  PROJECT_UPDATE: 'work:update',
  PROJECT_DELETE: 'work:delete',
  PROJECT_UNDELETE: 'work:undelete',

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

  SYSTEM_NOOP: 'system:noop',
};
export type AuditEventType = ValueEnum<typeof AUDIT_EVENT_TYPE>;

export const AUDIT_EVENT_TYPE_ARGUMENTS: Record<AuditEventType, {
  agent: AuditEventEntity;
  patient: AuditEventEntity | null;
  goal: AuditEventEntity | null;
}> = {
  [AUDIT_EVENT_TYPE.API_KEY_CREATE]: {
    agent: AUDIT_EVENT_ENTITIES.USER,
    patient: AUDIT_EVENT_ENTITIES.API_KEY,
    goal: null,
  },
  [AUDIT_EVENT_TYPE.API_KEY_UPDATE]: {
    agent: AUDIT_EVENT_ENTITIES.USER,
    patient: AUDIT_EVENT_ENTITIES.API_KEY,
    goal: null,
  },
  [AUDIT_EVENT_TYPE.API_KEY_DELETE]: {
    agent: AUDIT_EVENT_ENTITIES.USER,
    patient: AUDIT_EVENT_ENTITIES.API_KEY,
    goal: null,
  },
  [AUDIT_EVENT_TYPE.BANNER_CREATE]: {
    agent: AUDIT_EVENT_ENTITIES.USER,
    patient: AUDIT_EVENT_ENTITIES.BANNER,
    goal: null,
  },
  [AUDIT_EVENT_TYPE.BANNER_UPDATE]: {
    agent: AUDIT_EVENT_ENTITIES.USER,
    patient: AUDIT_EVENT_ENTITIES.BANNER,
    goal: null,
  },
  [AUDIT_EVENT_TYPE.BANNER_DELETE]: {
    agent: AUDIT_EVENT_ENTITIES.USER,
    patient: AUDIT_EVENT_ENTITIES.BANNER,
    goal: null,
  },
  [AUDIT_EVENT_TYPE.BOARD_CREATE]: {
    agent: AUDIT_EVENT_ENTITIES.USER,
    patient: AUDIT_EVENT_ENTITIES.BOARD,
    goal: null,
  },
  [AUDIT_EVENT_TYPE.BOARD_UPDATE]: {
    agent: AUDIT_EVENT_ENTITIES.USER,
    patient: AUDIT_EVENT_ENTITIES.BOARD,
    goal: null,
  },
  [AUDIT_EVENT_TYPE.BOARD_DELETE]: {
    agent: AUDIT_EVENT_ENTITIES.USER,
    patient: AUDIT_EVENT_ENTITIES.BOARD,
    goal: null,
  },
  [AUDIT_EVENT_TYPE.BOARD_UNDELETE]: {
    agent: AUDIT_EVENT_ENTITIES.USER,
    patient: AUDIT_EVENT_ENTITIES.BOARD,
    goal: null,
  },
  [AUDIT_EVENT_TYPE.GOAL_CREATE]: {
    agent: AUDIT_EVENT_ENTITIES.USER,
    patient: AUDIT_EVENT_ENTITIES.GOAL,
    goal: null,
  },
  [AUDIT_EVENT_TYPE.GOAL_UPDATE]: {
    agent: AUDIT_EVENT_ENTITIES.USER,
    patient: AUDIT_EVENT_ENTITIES.GOAL,
    goal: null,
  },
  [AUDIT_EVENT_TYPE.GOAL_DELETE]: {
    agent: AUDIT_EVENT_ENTITIES.USER,
    patient: AUDIT_EVENT_ENTITIES.GOAL,
    goal: null,
  },
  [AUDIT_EVENT_TYPE.GOAL_UNDELETE]: {
    agent: AUDIT_EVENT_ENTITIES.USER,
    patient: AUDIT_EVENT_ENTITIES.GOAL,
    goal: null,
  },
  [AUDIT_EVENT_TYPE.LEADERBOARD_CREATE]: {
    agent: AUDIT_EVENT_ENTITIES.USER,
    patient: AUDIT_EVENT_ENTITIES.LEADERBOARD,
    goal: null,
  },
  [AUDIT_EVENT_TYPE.LEADERBOARD_UPDATE]: {
    agent: AUDIT_EVENT_ENTITIES.USER,
    patient: AUDIT_EVENT_ENTITIES.LEADERBOARD,
    goal: null,
  },
  [AUDIT_EVENT_TYPE.LEADERBOARD_DELETE]: {
    agent: AUDIT_EVENT_ENTITIES.USER,
    patient: AUDIT_EVENT_ENTITIES.LEADERBOARD,
    goal: null,
  },
  [AUDIT_EVENT_TYPE.LEADERBOARD_MEMBER_CREATE]: {
    agent: AUDIT_EVENT_ENTITIES.USER,
    patient: AUDIT_EVENT_ENTITIES.LEADERBOARD_MEMBER,
    goal: AUDIT_EVENT_ENTITIES.LEADERBOARD,
  },
  [AUDIT_EVENT_TYPE.LEADERBOARD_MEMBER_UPDATE]: {
    agent: AUDIT_EVENT_ENTITIES.USER,
    patient: AUDIT_EVENT_ENTITIES.LEADERBOARD_MEMBER,
    goal: AUDIT_EVENT_ENTITIES.LEADERBOARD,
  },
  [AUDIT_EVENT_TYPE.LEADERBOARD_MEMBER_DELETE]: {
    agent: AUDIT_EVENT_ENTITIES.USER,
    patient: AUDIT_EVENT_ENTITIES.LEADERBOARD_MEMBER,
    goal: AUDIT_EVENT_ENTITIES.LEADERBOARD,
  },
  [AUDIT_EVENT_TYPE.LEADERBOARD_TEAM_CREATE]: {
    agent: AUDIT_EVENT_ENTITIES.USER,
    patient: AUDIT_EVENT_ENTITIES.LEADERBOARD_TEAM,
    goal: AUDIT_EVENT_ENTITIES.LEADERBOARD,
  },
  [AUDIT_EVENT_TYPE.LEADERBOARD_TEAM_UPDATE]: {
    agent: AUDIT_EVENT_ENTITIES.USER,
    patient: AUDIT_EVENT_ENTITIES.LEADERBOARD_TEAM,
    goal: AUDIT_EVENT_ENTITIES.LEADERBOARD,
  },
  [AUDIT_EVENT_TYPE.LEADERBOARD_TEAM_DELETE]: {
    agent: AUDIT_EVENT_ENTITIES.USER,
    patient: AUDIT_EVENT_ENTITIES.LEADERBOARD_TEAM,
    goal: AUDIT_EVENT_ENTITIES.LEADERBOARD,
  },
  [AUDIT_EVENT_TYPE.TAG_CREATE]: {
    agent: AUDIT_EVENT_ENTITIES.USER,
    patient: AUDIT_EVENT_ENTITIES.TAG,
    goal: null,
  },
  [AUDIT_EVENT_TYPE.TAG_UPDATE]: {
    agent: AUDIT_EVENT_ENTITIES.USER,
    patient: AUDIT_EVENT_ENTITIES.TAG,
    goal: null,
  },
  [AUDIT_EVENT_TYPE.TAG_DELETE]: {
    agent: AUDIT_EVENT_ENTITIES.USER,
    patient: AUDIT_EVENT_ENTITIES.TAG,
    goal: null,
  },
  [AUDIT_EVENT_TYPE.TALLY_CREATE]: {
    agent: AUDIT_EVENT_ENTITIES.USER,
    patient: AUDIT_EVENT_ENTITIES.TALLY,
    goal: null,
  },
  [AUDIT_EVENT_TYPE.TALLY_UPDATE]: {
    agent: AUDIT_EVENT_ENTITIES.USER,
    patient: AUDIT_EVENT_ENTITIES.TALLY,
    goal: null,
  },
  [AUDIT_EVENT_TYPE.TALLY_DELETE]: {
    agent: AUDIT_EVENT_ENTITIES.USER,
    patient: AUDIT_EVENT_ENTITIES.TALLY,
    goal: null,
  },
  [AUDIT_EVENT_TYPE.USER_SIGNUP]: {
    agent: AUDIT_EVENT_ENTITIES.USER,
    patient: AUDIT_EVENT_ENTITIES.USER,
    goal: null,
  },
  [AUDIT_EVENT_TYPE.USER_CREATE]: {
    agent: AUDIT_EVENT_ENTITIES.USER,
    patient: AUDIT_EVENT_ENTITIES.USER,
    goal: null,
  },
  [AUDIT_EVENT_TYPE.USER_UPDATE]: {
    agent: AUDIT_EVENT_ENTITIES.USER,
    patient: AUDIT_EVENT_ENTITIES.USER,
    goal: null,
  },
  [AUDIT_EVENT_TYPE.USER_ACTIVATE]: {
    agent: AUDIT_EVENT_ENTITIES.USER,
    patient: AUDIT_EVENT_ENTITIES.USER,
    goal: null,
  },
  [AUDIT_EVENT_TYPE.USER_SUSPEND]: {
    agent: AUDIT_EVENT_ENTITIES.USER,
    patient: AUDIT_EVENT_ENTITIES.USER,
    goal: null,
  },
  [AUDIT_EVENT_TYPE.USER_DELETE]: {
    agent: AUDIT_EVENT_ENTITIES.USER,
    patient: AUDIT_EVENT_ENTITIES.USER,
    goal: null,
  },
  [AUDIT_EVENT_TYPE.USER_VERIFY_EMAIL]: {
    agent: AUDIT_EVENT_ENTITIES.USER,
    patient: AUDIT_EVENT_ENTITIES.USER,
    goal: null,
  },
  [AUDIT_EVENT_TYPE.USER_PASSWORD_RESET]: {
    agent: AUDIT_EVENT_ENTITIES.USER,
    patient: AUDIT_EVENT_ENTITIES.USER,
    goal: null,
  },
  [AUDIT_EVENT_TYPE.USER_PASSWORD_CHANGE]: {
    agent: AUDIT_EVENT_ENTITIES.USER,
    patient: AUDIT_EVENT_ENTITIES.USER,
    goal: null,
  },
  [AUDIT_EVENT_TYPE.USER_REQUEST_EMAIL_VERIFICATION]: {
    agent: AUDIT_EVENT_ENTITIES.USER,
    patient: AUDIT_EVENT_ENTITIES.USER,
    goal: null,
  },
  [AUDIT_EVENT_TYPE.USER_REQUEST_PASSWORD_RESET]: {
    agent: AUDIT_EVENT_ENTITIES.USER,
    patient: AUDIT_EVENT_ENTITIES.USER,
    goal: null,
  },
  [AUDIT_EVENT_TYPE.USER_LOGIN]: {
    agent: AUDIT_EVENT_ENTITIES.USER,
    patient: null,
    goal: null,
  },
  [AUDIT_EVENT_TYPE.USER_FAILED_LOGIN]: {
    agent: AUDIT_EVENT_ENTITIES.USER,
    patient: null,
    goal: null,
  },
  [AUDIT_EVENT_TYPE.PROJECT_CREATE]: {
    agent: AUDIT_EVENT_ENTITIES.USER,
    patient: AUDIT_EVENT_ENTITIES.PROJECT,
    goal: null,
  },
  [AUDIT_EVENT_TYPE.PROJECT_UPDATE]: {
    agent: AUDIT_EVENT_ENTITIES.USER,
    patient: AUDIT_EVENT_ENTITIES.PROJECT,
    goal: null,
  },
  [AUDIT_EVENT_TYPE.PROJECT_DELETE]: {
    agent: AUDIT_EVENT_ENTITIES.USER,
    patient: AUDIT_EVENT_ENTITIES.PROJECT,
    goal: null,
  },
  [AUDIT_EVENT_TYPE.PROJECT_UNDELETE]: {
    agent: AUDIT_EVENT_ENTITIES.USER,
    patient: AUDIT_EVENT_ENTITIES.PROJECT,
    goal: null,
  },
} as const;

export const AUDIT_EVENT_SOURCE = {
  ADMIN_CONSOLE: 'admin console',
  BATCH_CREATE: 'batch create',
  LINK: 'link',
  SCRIPT: 'script',
  WORKER: 'worker',
};
export type AuditEventSource = ValueEnum<typeof AUDIT_EVENT_SOURCE>;
