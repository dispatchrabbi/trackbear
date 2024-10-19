import { Request, Response } from 'express';
import type { User } from "@prisma/client";

import { vi, Mock } from 'vitest';
import { mockObject } from '../../../testing-support/util';
import { RequestWithUser } from '../auth';

type MockRequest = {
  sessionID: string;
  user: null | User;
  params: Record<string, string>;
  query: Record<string, string>;
  body: unknown;
};
export function getMockRequest(overrides?: Partial<MockRequest>): Request {
  const req = {
    sessionID: 'mocked',
    user: null,
    params: {},
    query: {},
    body: {},
    ...overrides,
  };

  return req as unknown as Request;
}

type MockResponse = {
  status: Mock<(code: number) => MockResponse>,
  send: Mock<(payload: unknown) => MockResponse>,
};
export function getMockResponse(): Response {
  const res = {
    status: vi.fn(() => res),
    send: vi.fn(() => res)
  } as MockResponse;

  return res as unknown as Response;
}

export function getHandlerMocks(reqOverrides?: Partial<MockRequest>) {
  return {
    req: getMockRequest(reqOverrides),
    res: getMockResponse(),
    next: vi.fn(),
  };
}

export const MOCK_USER_ID = -100;
export function getHandlerMocksWithUser(reqOverrides?: Partial<MockRequest>) {
  return {
    req: getMockRequest({
      user: mockObject<User>({ id: MOCK_USER_ID }),
      ...reqOverrides,
    }) as RequestWithUser,
    res: getMockResponse(),
    next: vi.fn(),
  };
}