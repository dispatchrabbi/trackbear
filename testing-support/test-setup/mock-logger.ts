import { vi } from 'vitest';

// we always want to mock the logger
vi.mock('server/lib/logger.ts',
  // () => ({
  //   getLogger: () => ({
  //     info: console.info,
  //     error: console.error,
  //     debug: () => {},
  //   }),
  // }),
);
