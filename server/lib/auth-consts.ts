import { ValueEnum } from './obj';

// we happen to import this constant on the front end, so this allows us to do so without bringing anything else with us
export const AUTHORIZATION_SCHEME = 'Bearer';

export const ACCESS_TYPE = {
  NONE: 'none',
  LOGIN: 'login',
  API_TOKEN: 'api-token',
  UNKNOWN: 'unknown',
} as const;
export type AccessType = ValueEnum<typeof ACCESS_TYPE>;
