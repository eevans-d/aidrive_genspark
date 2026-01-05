import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    // Test environment
    environment: 'node',
    
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
    // Nota: setup de Jest vive en tests/helpers/setup.js. Vitest no debe depender de archivos de test/ (eliminado).
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
