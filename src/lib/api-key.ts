import { format } from 'date-fns';

export function formatExpirationDate(expiresAt: Date) {
  // PPPpp is a localized date and time
  return format(expiresAt, 'PPPpp');
}

export function isExpired(expiresAt: Date) {
  return expiresAt < new Date();
}
