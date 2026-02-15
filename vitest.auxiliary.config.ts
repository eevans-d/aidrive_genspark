/**
 * Vitest Configuration for Auxiliary Test Suites
 * 
 * Includes: performance, security, api-contracts
 * 
 * Usage:
 *   npm run test:auxiliary        # All auxiliary (mocked, no creds needed)
 *   npm run test:performance      # Performance suite only
 *   npm run test:security         # Security suite only
 *   npm run test:contracts        # API contracts suite only
 * 
 * Environment Variables:
 *   SUPABASE_URL          - Required for real network tests (skipped by default)
 *   SUPABASE_ANON_KEY     - Required for real network tests (skipped by default)
 *   RUN_REAL_TESTS=true   - Enable tests that require network/credentials
 */

import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    
    // Include ONLY migrated Vitest files (.vitest.test.ts)
    include: [
      'tests/performance/**/*.vitest.test.ts',
      'tests/security/**/*.vitest.test.ts',
      'tests/api-contracts/**/*.vitest.test.ts'
    ],
    
    // Exclude legacy Jest files and other suites
    exclude: [
      'tests/unit/**',
      'tests/contract/**',
      'tests/e2e/**',
      'tests/**/*.test.js',  // Legacy Jest files
      'node_modules/**'
    ],
    
    // Test configuration
    testTimeout: 30000,  // Longer timeout for performance tests
    hookTimeout: 10000,
    
    // Globals for fetch mock
    globals: true,
    
    // Reporter
    reporters: ['verbose', 'junit'],
    outputFile: {
      junit: './test-reports/junit.auxiliary.xml'
    },
    
    // Alias for imports
    alias: {
      '@shared': path.resolve(__dirname, './supabase/functions/_shared'),
      '@tests': path.resolve(__dirname, './tests')
    },
    
    // Pool configuration (Vitest 4.x syntax)
    pool: 'threads',
    // Run serially for predictable mocking
    isolate: true,
    sequence: {
      shuffle: false
    }
  }
});
