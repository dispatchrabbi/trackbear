import { defineConfig, coverageConfigDefaults } from 'vitest/config';
import viteTsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  test: {
    coverage: {
      enabled: true,
      // TODO: slowly remove these as coverage expands
      exclude: [
        ...coverageConfigDefaults.exclude,
        'docs/**',
        'prisma/**',
        'public/**',
        'scripts/**',
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
