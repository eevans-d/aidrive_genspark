import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/integration/**/*.{test,spec}.{js,ts}'],
    exclude: [
      'tests/unit/**',
      'tests/api-contracts/**',
      'tests/e2e/**',
      'tests/performance/**',
      'tests/security/**'
    ],
    testTimeout: 30000,
    hookTimeout: 30000,
    reporters: ['default', 'junit'],
    outputFile: {
      junit: 'test-reports/junit.integration.xml'
    }
  }
});
