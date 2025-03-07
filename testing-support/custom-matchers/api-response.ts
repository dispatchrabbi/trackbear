import { expect } from 'vitest';

import type { MockResponse } from '../../server/lib/__mocks__/express.ts';
import { success, failure } from '../../server/lib/api-response.ts';

expect.extend({
  toSucceedWith: function<T>(received: MockResponse, status: number, payload: T) {
    const statusCall = received.status.mock.lastCall;
    if(!statusCall) {
      return {
        pass: false,
        message: () => 'Expected status() to have been called, but it was not',
      };
    }
    
    const sendCall = received.send.mock.lastCall;
    if(!sendCall) {
      return {
        pass: false,
        message: () => 'Expected send() to have been called, but it was not',
      };
    }
    
    const { equals } = this;

    // did the call to status have `status` as the only param?
    if(!equals(statusCall, [ status ])) {
      return {
        pass: false,
        message: () => 'Status codes do not match',
        actual: statusCall[0],
        expected: status,
      };
    }

    // did the call to send have `success(payload)` as the only param?
    const successResponse = success(payload);
    if(!equals(sendCall, [ successResponse ])) {
      return {
        pass: false,
        message: () => 'Success responses do not match',
        actual: sendCall[0],
        expected: successResponse,
      };
    }

    return {
      pass: true,
      message: () => 'Everything matches',
    };
  },
  toFailWith: function(received: MockResponse, status: number, code: string, message?: string) {
    const statusCall = received.status.mock.lastCall;
    if(!statusCall) {
      return {
        pass: false,
        message: () => 'Expected status() to have been called, but it was not',
      };
    }
    
    const sendCall = received.send.mock.lastCall;
    if(!sendCall) {
      return {
        pass: false,
        message: () => 'Expected send() to have been called, but it was not',
      };
    }
    
    const { equals } = this;

    // did the call to status have `status` as the only param?
    if(!equals(statusCall, [ status ])) {
      return {
        pass: false,
        message: () => 'Status codes do not match',
        actual: statusCall[0],
        expected: status,
      };
    }

    // did the call to send have `failure(code, message)` as the only param?
    const failureResponse = failure(code, message ?? expect.any(String));
    if(!equals(sendCall, [ failureResponse ])) {
      return {
        pass: false,
        message: () => 'Failure responses do not match',
        actual: sendCall[0],
        expected: failureResponse,
      };
    }

    return {
      pass: true,
      message: () => 'Everything matches',
    };
  },
})