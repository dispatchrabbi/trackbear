import { format } from 'date-fns';

export function formatExpirationDate(expiresAt: Date | null) {
  if(expiresAt === null) {
    return 'Never';
  }

  // PPPpp is a localized date and time
  return format(expiresAt, 'PPPpp');
}

export function formatLastUsedDate(lastUsed: Date | null) {
  if(lastUsed === null) {
    return 'Never';
  }

  // PPPpp is a localized date and time
  return format(lastUsed, 'PPPpp');
}

export function isExpired(expiresAt: Date | null) {
  return expiresAt === null ? false : expiresAt < new Date();
}
