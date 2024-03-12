import path from 'path';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { visualizer } from 'rollup-plugin-visualizer';

const CHUNKS_MAP = {
  'chart.js': 'node_modules/chart.js',
  'vuestic-ui': 'node_modules/vuestic-ui',
  'primevue': 'node_modules/primevue',
  'themes': 'src/themes',
};

// https://vitejs.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      "src": path.resolve(__dirname, "./src"),
      "server": path.resolve(__dirname, "./server"),
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
});
