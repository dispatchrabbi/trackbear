import { defineConfig, coverageConfigDefaults } from 'vitest/config';
import viteTsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  test: {
    setupFiles: [
      'testing-support/custom-matchers/api-response.ts',
    ],
    exclude: [
      'node_modules/**',
      'testing-support/**',
      'server/integration-tests/**',
    ],
    coverage: {
      enabled: true,
      // TODO: slowly remove these as coverage expands
      exclude: [
        ...coverageConfigDefaults.exclude,
        'docs/**',
        'generated/**',
        'prisma/**',
        'public/**',
        'scripts/**',
        'server/integration-tests/**',
        'server/workers/**',
        'src/**',
        '*.{js,ts}',
      ],
    },
  },
  plugins: [
    viteTsconfigPaths(),
  ],
});
