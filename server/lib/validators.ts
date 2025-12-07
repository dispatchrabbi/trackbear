import { z } from 'zod';

const stringToInt = z.codec(z.string().regex(z.regexes.integer), z.int(), {
  decode: str => Number.parseInt(str, 10),
  encode: num => num.toString(),
});

export const zStrInt = function() {
  return stringToInt;
};

export const zIdParam = function() {
  return z.object({ id: zStrInt() });
};

export const zUuidParam = function() {
  return z.object({ uuid: z.uuid() });
};

export const zUuidAndIdParams = function() {
  return z.object({
    uuid: z.uuid(),
    id: zStrInt(),
  });
};

export const zDateStr = function() {
  return z.string().regex(z.regexes.date, { error: 'Expected date string (YYYY-MM-DD), received a different format' });
};

export type NonEmptyArray<T> = [T, ...T[]];
