import { defineConfig } from 'vitest/config';
import fs from 'fs';
import path from 'path';

const frontendNodeModules = path.resolve(__dirname, './minimarket-system/node_modules');
const rootNodeModules = path.resolve(__dirname, './node_modules');

function resolveNodeModule(pkgName: string, subPath = ''): string {
  const candidate = path.join(frontendNodeModules, pkgName, subPath);
  if (fs.existsSync(candidate)) return candidate;
  return path.join(rootNodeModules, pkgName, subPath);
}

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
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80
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
      'tests/contract/**',
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
      'react': resolveNodeModule('react'),
      'react-dom': resolveNodeModule('react-dom'),
      'react-dom/client': resolveNodeModule('react-dom', 'client.js'),
      'react-router-dom': resolveNodeModule('react-router-dom'),
      'lucide-react': resolveNodeModule('lucide-react'),
      'react/jsx-runtime': resolveNodeModule('react', 'jsx-runtime.js'),
      'react/jsx-dev-runtime': resolveNodeModule('react', 'jsx-dev-runtime.js'),
      '@testing-library/react': resolveNodeModule('@testing-library/react'),
      '@testing-library/jest-dom': resolveNodeModule('@testing-library/jest-dom'),
      '@testing-library/jest-dom/vitest': resolveNodeModule('@testing-library/jest-dom', 'vitest'),
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
