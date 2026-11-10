import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// BENTHIC-9 build configuration.
// base: './' keeps every asset relative so Capacitor can serve the bundle from file://-like origins.
export default defineConfig({
  base: './',
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    strictPort: false,
  },
  build: {
    target: 'es2020',
    assetsInlineLimit: 4096,
    chunkSizeWarningLimit: 2500,
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    reporters: ['default'],
  },
});
