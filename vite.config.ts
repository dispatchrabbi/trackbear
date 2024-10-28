import path from 'path';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { visualizer } from 'rollup-plugin-visualizer';

const CHUNKS_MAP = {
  'chart.js': 'node_modules/chart.js',
  'core-js': 'node_modules/core-js',
  'date-fns': 'node_modules/date-fns',
  'markdown-it': 'node_modules/markdown-it',
  'observable-plot': 'node_modules/@observablehq/plot',
  'primevue-calendar': 'node_modules/primevue/calendar',
  'primevue-datatable': 'node_modules/primevue/datatable',
  'primevue': 'node_modules/primevue',
  'themes': 'src/themes',
  'zod': 'node_modules/zod',
};

// https://vitejs.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      "src": path.resolve(__dirname, "./src"),
      "server": path.resolve(__dirname, "./server"),
      // found in https://github.com/prisma/prisma/issues/12504#issuecomment-1285883083
      ".prisma/client/index-browser": "./node_modules/.prisma/client/index-browser.js"
    },
  },
  plugins: [ vue(), visualizer() ],
  build: {
    outDir: 'dist',
    rollupOptions: {
      output: {
        manualChunks: function(id) {
          return Object.keys(CHUNKS_MAP).find(chunk => id.includes(CHUNKS_MAP[chunk]));
        },
      },
    },
  },
  // pass env variables to the front-end (see https://vite.dev/config/shared-options.html#envprefix)
  envPrefix: ['FE'],
  define: {
    'import.meta.env.URL_PREFIX':       JSON.stringify(process.env.EMAIL_URL_PREFIX),
    'import.meta.env.ENABLE_METRICS':   JSON.stringify(process.env.ENABLE_METRICS),
    'import.meta.env.PLAUSIBLE_HOST':   JSON.stringify(process.env.PLAUSIBLE_HOST),
    'import.meta.env.PLAUSIBLE_DOMAIN': JSON.stringify(process.env.PLAUSIBLE_DOMAIN),
  },
});
