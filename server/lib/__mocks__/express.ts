import { Request, Response } from 'express';
import type { User } from "@prisma/client";

import { beforeEach, vi } from 'vitest';
import type { Mock } from 'vitest';
import { mockDeep, mockReset } from 'vitest-mock-extended';
import { mockObject } from './util';
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

export function getMockResponse(): Response {
  const res = {
    status: vi.fn((code: number) => res),
    send: vi.fn((payload: unknown) => res)
  };

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