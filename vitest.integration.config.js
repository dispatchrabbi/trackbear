import { defineConfig } from 'vitest/config';
import viteTsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  test: {
    include: 'server/integration-tests/**/*.test.ts',
    setupFiles: [
      'testing-support/test-setup/mock-logger.ts',
      'testing-support/test-setup/test-db.ts',
    ],
  },
  plugins: [
    viteTsconfigPaths(),
  ],
});
