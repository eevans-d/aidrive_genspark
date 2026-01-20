import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  // Environment variables for frontend hooks tests (mocked Supabase)
  define: {
    'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(process.env.VITE_SUPABASE_URL || 'http://localhost'),
    'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(process.env.VITE_SUPABASE_ANON_KEY || 'dummy-key-for-tests'),
  },
  test: {
    // Test environment
    environment: 'node',
    
    // Environment variables for frontend tests
    env: {
      VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL || 'http://localhost',
      VITE_SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY || 'dummy-key-for-tests',
    },
    
    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        'coverage/',
        '**/*.d.ts',
        'tests/**',
        '*.config.*',
        'supabase/functions/**/*.legacy.ts'
      ],
      thresholds: {
        global: {
          branches: 60,
          functions: 60,
          lines: 60,
          statements: 60
        }
      }
    },
    
    // Test files pattern
    include: [
      'tests/unit/**/*.{test,spec}.{js,ts}'
    ],
    exclude: [
      'tests/api-contracts/**',
      'tests/e2e/**',
      'tests/integration/**',
      'tests/performance/**',
      'tests/security/**'
    ],

    // Setup files
    // Nota: tests/helpers/setup.js es legacy (Jest) y no se usa en Vitest.
    setupFiles: [],
    
    // Global test configuration
    testTimeout: 10000,
    hookTimeout: 10000,
    
    // Reporting
    reporters: ['default', 'junit'],
    outputFile: {
      junit: 'test-reports/junit.xml'
    }
  },
  
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  
  // Build configuration
  build: {
    target: 'node18',
    outDir: 'dist',
    sourcemap: true
  }
});
