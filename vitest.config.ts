import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  // Environment variables for frontend hooks tests (mocked Supabase)
  define: {
    'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(process.env.VITE_SUPABASE_URL || 'http://localhost'),
    'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(process.env.VITE_SUPABASE_ANON_KEY || 'dummy-key-for-tests'),
  },
  test: {
    // Test environment - Changed to jsdom for React components
    environment: 'jsdom',

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
      'tests/unit/**/*.{test,spec}.{js,ts,jsx,tsx}'
    ],
    exclude: [
      'tests/api-contracts/**',
      'tests/e2e/**',
      'tests/integration/**',
      'tests/performance/**',
      'tests/security/**'
    ],

    // Setup files
    setupFiles: ['./tests/setup.ts'],

    // Global test configuration
    testTimeout: 10000,
    hookTimeout: 10000,

    // Reporting
    reporters: ['default', 'junit'],
    outputFile: {
      junit: 'test-reports/junit.xml'
    },

    // Globals for React Testing Library cleanup
    globals: true,

    server: {
      deps: {
        inline: [
          'react',
          'react-dom',
          'react-router-dom',
          'lucide-react',
          /@testing-library\/react/
        ]
      }
    }
  },

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './minimarket-system/src'),
      'react': path.resolve(__dirname, './minimarket-system/node_modules/react'),
      'react-dom': path.resolve(__dirname, './minimarket-system/node_modules/react-dom'),
      'react-dom/client': path.resolve(__dirname, './minimarket-system/node_modules/react-dom/client.js'),
      'react-router-dom': path.resolve(__dirname, './minimarket-system/node_modules/react-router-dom'),
      'lucide-react': path.resolve(__dirname, './minimarket-system/node_modules/lucide-react'),
      'react/jsx-runtime': path.resolve(__dirname, './minimarket-system/node_modules/react/jsx-runtime.js'),
      'react/jsx-dev-runtime': path.resolve(__dirname, './minimarket-system/node_modules/react/jsx-dev-runtime.js'),
      '@testing-library/react': path.resolve(__dirname, './minimarket-system/node_modules/@testing-library/react'),
      '@testing-library/jest-dom': path.resolve(__dirname, './minimarket-system/node_modules/@testing-library/jest-dom'),
    },
    dedupe: ['react', 'react-dom'],
  },

  // Build configuration
  build: {
    target: 'node18',
    outDir: 'dist',
    sourcemap: true
  }
});
