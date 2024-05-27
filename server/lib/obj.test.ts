import { expect, describe, it } from 'vitest';
import { omit, pick } from './obj.ts';

describe('omit', () => {
  it('omits the given keys', () => {
    const expected = {
      survives: true,
      alsoSurvives: 'me too',
    };

    const actual = omit({
      survives: true,
      alsoSurvives: 'me too',
      removeMe: false,
      removeMeToo: 'goodbye!',
    }, ['removeMe', 'removeMeToo']);

    expect(actual).toStrictEqual(expected);
  });
});

describe('pick', () => {
  it('picks the given keys', () => {
    const expected = {
      survives: true,
      alsoSurvives: 'me too',
    };

    const actual = pick({
      survives: true,
      alsoSurvives: 'me too',
      removeMe: false,
      removeMeToo: 'goodbye!',
    }, ['survives', 'alsoSurvives']);

    expect(actual).toStrictEqual(expected);
  });
});
