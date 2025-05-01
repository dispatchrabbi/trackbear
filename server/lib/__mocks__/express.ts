import { Request, Response } from 'express';
import type { User } from '@prisma/client';

import { vi, Mock } from 'vitest';
import { mockObject, TEST_USER_ID } from '../../../testing-support/util';
import { RequestWithUser } from '../middleware/access';

type MockRequest = Request & {
  sessionID: string;
  user: null | User;
  params: Record<string, string>;
  query: Record<string, string>;
  body: unknown;
};
export function getMockRequest(overrides?: Partial<MockRequest>): MockRequest {
  const req = {
    sessionID: 'mocked',
    user: null,
    params: {},
    query: {},
    body: {},
    ...overrides,
  };

  return req as MockRequest;
}

export type MockResponse = Response & {
  status: Mock<(code: number) => MockResponse>;
  send: Mock<(payload: unknown) => MockResponse>;
};
export function getMockResponse(): MockResponse {
  const res = {
    status: vi.fn(() => res),
    send: vi.fn(() => res),
  } as MockResponse;

  return res;
}

export function getHandlerMocks(reqOverrides?: Partial<MockRequest>) {
  return {
    req: getMockRequest(reqOverrides),
    res: getMockResponse(),
    next: vi.fn(),
  };
}

type MockRequestWithUser = RequestWithUser & {
  sessionID: string;
  user: null | User;
  params: Record<string, string>;
  query: Record<string, string>;
  body: unknown;
};
export function getHandlerMocksWithUser(reqOverrides?: Partial<MockRequestWithUser>) {
  return {
    req: getMockRequest({
      user: mockObject<User>({ id: TEST_USER_ID }),
      ...reqOverrides,
    }) as MockRequestWithUser,
    res: getMockResponse(),
    next: vi.fn(),
  };
}
