import { expect, describe, it } from 'vitest';
import { success, failure, h } from './api-response.ts';

import express from 'express';

describe('success', () => {
  it('returns a success object', () => {
    const expected = {
      success: true,
      data: { isTesting: true },
    };

    const actual = success({ isTesting: true });

    expect(actual).toStrictEqual(expected);
  })
});

describe('failure', () => {
  it('returns a failure object', () => {
    const expected = {
      success: false,
      error: {
        code: 'TEST_ERROR_CODE',
        message: 'This is a test error',
      }
    };

    const actual = failure('TEST_ERROR_CODE', 'This is a test error');

    expect(actual).toStrictEqual(expected);
  })
});

describe('h', () => {
  it('handles non-throwing handlers with a success');

  it('handles throwing handlers by calling next with the error');

  it('handles error code P2025 by responding with 404');
});
