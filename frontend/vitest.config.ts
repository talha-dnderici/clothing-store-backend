import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// FE-11 — Vitest config (Jest-compatible API via vitest).
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/app/__tests__/setup.ts'],
    css: false,
  },
});
