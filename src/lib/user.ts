import { USER_STATE, type UserState } from 'server/lib/models/user/consts';

export const USER_STATE_INFO: Record<UserState, { color: string }> = {
  [USER_STATE.ACTIVE]: {
    color: 'success',
  },
  [USER_STATE.SUSPENDED]: {
    color: 'warning',
  },
  [USER_STATE.MERGED]: {
    color: 'secondary',
  },
  [USER_STATE.DELETED]: {
    color: 'danger',
  },
};
