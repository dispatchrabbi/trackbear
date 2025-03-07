import { defineConfig, coverageConfigDefaults } from 'vitest/config';
import viteTsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  test: {
    setupFiles: [
      'testing-support/custom-matchers/api-response.ts',
    ],
    exclude: [
      'testing-support/**',
      'server/integration-tests/**',
    ],
    coverage: {
      enabled: true,
      // TODO: slowly remove these as coverage expands
      exclude: [
        ...coverageConfigDefaults.exclude,
        'docs/**',
        'prisma/**',
        'public/**',
        'scripts/**',
        'server/integration-tests/**',
        'server/workers/**',
        'src/**',
        '*.{js,ts}',
      ]
    },
  },
  plugins: [
    viteTsconfigPaths(),
  ],
});
