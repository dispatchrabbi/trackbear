import { ValueEnum } from './obj.ts';

export const FAILURE_CODES = {
  FORBIDDEN: 'FORBIDDEN',
  NOT_LOGGED_IN: 'NOT_LOGGED_IN',
  NO_API_TOKEN: 'NO_API_TOKEN',
  NOT_FOUND: 'NOT_FOUND',
  VALIDATION_FAILED: 'VALIDATION_FAILED',
} as const;
export type FailureCode = ValueEnum<typeof FAILURE_CODES>;
