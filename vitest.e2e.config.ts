import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/e2e/**/*.smoke.test.{js,ts}'],
    exclude: [
      'tests/unit/**',
      'tests/api-contracts/**',
      'tests/integration/**',
      'tests/performance/**',
      'tests/security/**'
    ],
    testTimeout: 60000,
    hookTimeout: 60000,
    reporters: ['default', 'junit'],
    outputFile: {
      junit: 'test-reports/junit.e2e.xml'
    }
  }
});
