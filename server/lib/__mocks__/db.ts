import { type PrismaClient } from 'generated/prisma/client';
import { vi, beforeEach } from 'vitest';
import { mockDeep, mockReset } from 'vitest-mock-extended';

const mockedDbClient = mockDeep<PrismaClient>();
beforeEach(() => {
  mockReset(mockedDbClient);
});

export const initDbClient = vi.fn();
export const disconnectDbClient = vi.fn(() => Promise.resolve());
export const getDbClient = vi.fn(() => mockedDbClient);
export const testDatabaseConnection = vi.fn();
export const testDatabaseConnectionSafe = vi.fn(() => true);
