import { defineConfig } from 'vitest/config';
import viteTsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  test: {
    setupFiles: [
      'testing-support/custom-matchers/api-response.ts',
      'testing-support/test-setup/mock-logger.ts',
    ],
    exclude: [
      'node_modules/**',
      'testing-support/**',
      'server/integration-tests/**',
    ],
    coverage: {
      enabled: true,
      include: [
        'server/**/*.ts',
        'src/**/*.ts',
        'main.ts',
      ],
      // TODO: remove these as coverage expands
      exclude: [
        'server/integration-tests/**',
        'server/workers/**',
        'src/**',
        'main.ts',
      ],
    },
  },
  plugins: [
    viteTsconfigPaths(),
  ],
});
