// This is a separate file from user.ts so that it can be imported by the front-end
// The front-end doesn't like @decorators so we have to split the model out

export const USER_STATE = {
  ACTIVE:     'active',
  SUSPENDED:  'suspended',
  DELETED:    'deleted',
} as const;
export type UserState = typeof USER_STATE[keyof typeof USER_STATE];

export const USERNAME_REGEX = /^[a-z][a-z0-9_-]+$/;
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