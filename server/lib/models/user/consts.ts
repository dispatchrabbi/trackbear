export const USER_STATE = {
  ACTIVE:     'active',
  SUSPENDED:  'suspended',
  DELETED:    'deleted',
} as const;
export type UserState = typeof USER_STATE[keyof typeof USER_STATE];

// usernames must be between 3 and 24 characters
export const USERNAME_REGEX = /^[a-z][a-z0-9_-]{2,23}$/;
export const EMAIL_REGEX = /^.+@.+\..+$/;

export const ALLOWED_AVATAR_FORMATS = {
  'image/apng': 'apng',
  'image/avif': 'avif',
  'image/gif': 'gif',
  'image/jpeg': 'jpeg',
  'image/png': 'png',
  'image/svg+xml': 'svg',
  'image/webp': 'webp',
};
export const MAX_AVATAR_SIZE_IN_BYTES = 2 * 1024 * 1024; // 2MB