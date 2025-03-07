import { defineConfig } from 'vitest/config';
import viteTsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  test: {
    include: 'server/integration-tests/**/*.test.ts',
  },
  plugins: [
    viteTsconfigPaths(),
  ],
});
