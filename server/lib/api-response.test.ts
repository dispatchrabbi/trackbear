import { expect, describe, it } from 'vitest';
import { success, failure } from './api-response.ts';

describe('success', () => {
  it('returns a success object', () => {
    const expected = {
      success: true,
      data: { isTesting: true },
    };

    const actual = success({ isTesting: true });

    expect(actual).toStrictEqual(expected);
  });
});

describe('failure', () => {
  it('returns a failure object', () => {
    const expected = {
      success: false,
      error: {
        code: 'TEST_ERROR_CODE',
        message: 'This is a test error',
      },
    };

    const actual = failure('TEST_ERROR_CODE', 'This is a test error');

    expect(actual).toStrictEqual(expected);
  });
});

describe('h', () => {
  it.skip('handles non-throwing handlers with a success');

  it.skip('handles throwing handlers by calling next with the error');

  it.skip('handles error code P2025 by responding with 404');
});
