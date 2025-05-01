import { USER_STATE } from 'server/lib/models/user/consts';

export const USER_STATE_INFO = {
  [USER_STATE.ACTIVE]: {
    color: 'success',
  },
  [USER_STATE.SUSPENDED]: {
    color: 'warning',
  },
  [USER_STATE.DELETED]: {
    color: 'danger',
  },
};
