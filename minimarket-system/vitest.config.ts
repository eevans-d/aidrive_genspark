import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
        plugins: [react()],
        test: {
                // Use jsdom for browser-like environment
                environment: 'jsdom',

                // Global test APIs (describe, it, expect without imports)
                globals: true,

                // Setup file for testing-library matchers
                setupFiles: ['./src/setupTests.ts'],

                // Test file patterns
                include: ['src/**/*.{test,spec}.{ts,tsx}'],

                // Environment variables for mocked Supabase
                env: {
                        VITE_SUPABASE_URL: 'http://localhost',
                        VITE_SUPABASE_ANON_KEY: 'dummy-key-for-tests',
                },

                // Coverage configuration
                coverage: {
                        provider: 'v8',
                        reporter: ['text', 'html', 'json-summary'],
                        exclude: [
                                'node_modules/',
                                'src/setupTests.ts',
                                '**/*.d.ts',
                        ],
                },
        },

        resolve: {
                alias: {
                        '@': path.resolve(__dirname, './src'),
                },
        },
});
