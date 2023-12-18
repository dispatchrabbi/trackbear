import { z } from 'zod';

function isIntStr(str: string): boolean {
  return Number.parseInt(str, 10) === +str && Number.isInteger(+str);
}

export const zStrInt = function(params?: { message?: string; }) {
  return z.string()
    .refine(isIntStr, { message: params?.message || 'Expected integer string, received non-integer string' })
    .transform(str => Number.parseInt(str, 10));
};

export const zInt = function() {
  return z.number()
    .refine(num => Number.isInteger(num), { message: 'Expected integer, received non-integer'});
}

export const zDateStr = function() {
  return z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'Expected date string (YYYY-MM-DD), received a different format' });
}
