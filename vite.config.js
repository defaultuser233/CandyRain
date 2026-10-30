import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  server: {
    host: true,
    port: 5173,
    watch: {
      ignored: ['**/tmp-e2e/**', '**/tmp-e2e-profile/**', '**/dist/**'],
    },
  },
  build: {
    target: 'es2020',
    assetsInlineLimit: 0,
  },
});
