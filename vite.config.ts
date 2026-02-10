import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
  plugins: [svelte()],
  build: {
    outDir: 'dist/ui',
    emptyDirOnly: true,
  },
  server: {
    proxy: {
      '/api': 'http://localhost:3456',
      '/ws': {
        target: 'ws://localhost:3456',
        ws: true,
      },
    },
  },
});
