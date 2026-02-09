import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  // Environment variables for mocked Supabase
  define: {
    'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(process.env.VITE_SUPABASE_URL || 'http://localhost'),
    'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(process.env.VITE_SUPABASE_ANON_KEY || 'dummy-key-for-tests'),
  },
  test: {
    // Test environment - Node for integration tests using MSW
    environment: 'node',

    // Environment variables
    env: {
      VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL || 'http://localhost',
      VITE_SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY || 'dummy-key-for-tests',
    },

    // Test files pattern - ONLY integration tests
    include: [
      'tests/integration/**/*.{test,spec}.{js,ts}'
    ],

    // Global test configuration
    testTimeout: 10000,
    hookTimeout: 10000,

    // Reporting
    reporters: ['default', 'junit'],
    outputFile: {
      junit: 'test-reports/junit.integration.xml',
    },
  },

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@tests': path.resolve(__dirname, './tests'),
    },
  },
});
