import { PrismaClient } from '@prisma/client';
import { beforeEach } from 'vitest';
import { mockDeep, mockReset } from 'vitest-mock-extended';

const dbClient = mockDeep<PrismaClient>();
export default dbClient;

beforeEach(() => {
  mockReset(dbClient);
});
