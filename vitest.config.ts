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
        '*.config.*'
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80
        }
      }
    },
    
    // Test files pattern
    include: [
      'tests/**/*.{test,spec}.{js,ts}'
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