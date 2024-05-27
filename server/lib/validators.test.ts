import { expect, describe, it } from 'vitest';
import { zStrInt, zIdParam, zUuidParam, zDateStr } from './validators.ts';

import { randomUUID } from 'node:crypto';

describe('zStrInt', () => {
  it('passes integer strings', () => {
    const expected = true;

    const actual = zStrInt().safeParse('123').success;
    expect(actual).toBe(expected);
  });

  it('fails decimal strings', () => {
    const expected = false;

    const actual = zStrInt().safeParse('123.45').success;
    expect(actual).toBe(expected);
  });

  it('fails alphabetic strings', () => {
    const expected = false;

    const actual = zStrInt().safeParse('abc').success;
    expect(actual).toBe(expected);
  });

  it('fails mixed strings', () => {
    const expected = false;

    const actual = zStrInt().safeParse('123abc').success;
    expect(actual).toBe(expected);
  });

  it('fails the empty string', () => {
    const expected = false;

    const actual = zStrInt().safeParse('').success;
    expect(actual).toBe(expected);
  });
});

describe('zIdParam', () => {
  it('passes integer strings', () => {
    const expected = true;

    const actual = zIdParam().safeParse({ id: '123' }).success;
    expect(actual).toBe(expected);
  });

  it('fails decimal strings', () => {
    const expected = false;

    const actual = zIdParam().safeParse({ id: '123.45' }).success;
    expect(actual).toBe(expected);
  });

  it('fails alphabetic strings', () => {
    const expected = false;

    const actual = zIdParam().safeParse({ id: 'abc' }).success;
    expect(actual).toBe(expected);
  });

  it('fails mixed strings', () => {
    const expected = false;

    const actual = zIdParam().safeParse({ id: '123abc' }).success;
    expect(actual).toBe(expected);
  });

  it('fails the empty string', () => {
    const expected = false;

    const actual = zIdParam().safeParse({ id: '' }).success;
    expect(actual).toBe(expected);
  });

  it('fails an object without an id parameter', () => {
    const expected = false;

    const actual = zIdParam().safeParse({ notId: '123' }).success;
    expect(actual).toBe(expected);
  });
});

describe('zUuidParam', () => {
  it('passes uuid strings', () => {
    const expected = true;

    const actual = zUuidParam().safeParse({ uuid: randomUUID() }).success;
    expect(actual).toBe(expected);
  });

  it('fails non-uuid strings', () => {
    const expected = false;

    const actual = zUuidParam().safeParse({ uuid: 'not a uuid' }).success;
    expect(actual).toBe(expected);
  });

  it('fails the empty string', () => {
    const expected = false;

    const actual = zUuidParam().safeParse({ uuid: '' }).success;
    expect(actual).toBe(expected);
  });

  it('fails an object without a uuid parameter', () => {
    const expected = false;

    const actual = zUuidParam().safeParse({ notId: randomUUID() }).success;
    expect(actual).toBe(expected);
  });
});

describe('zDateStr', () => {
  it('passes a valid date string', () => {
    const expected = true;

    const actual = zDateStr().safeParse('2024-02-29').success;
    expect(actual).toBe(expected);
  });

  it('fails a badly-formatted date string', () => {
    const expected = false;

    const actual = zDateStr().safeParse('February 29, 2024').success;
    expect(actual).toBe(expected);
  });

  it('fails the empty string', () => {
    const expected = false;

    const actual = zDateStr().safeParse('February 29, 2024').success;
    expect(actual).toBe(expected);
  });
});
