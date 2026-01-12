/**
 * Vitest Configuration for MBC Frontend
 * Comprehensive testing setup with React Testing Library and coverage
 */

import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  
  test: {
    // Test environment
    environment: 'jsdom',
    
    // Global test setup
    globals: true,
    
    // Setup files
    setupFiles: ['./src/test/setup.ts'],
    
    // Test file patterns
    include: [
      'src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'
    ],
    
    // Exclude patterns
    exclude: [
      'node_modules',
      'dist',
      '.next',
      'coverage'
    ],
    
    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: 'coverage',
      
      // Coverage thresholds
      thresholds: {
        global: {
          branches: 75,
          functions: 80,
          lines: 80,
          statements: 80
        }
      },
      
      // Files to include in coverage
      include: [
        'src/**/*.{ts,tsx}',
        '!src/**/*.d.ts',
        '!src/test/**',
        '!src/**/*.stories.{ts,tsx}',
        '!src/main.tsx',
        '!src/vite-env.d.ts'
      ]
    },
    
    // Test timeout
    testTimeout: 20000,
    
    // Hook timeout
    hookTimeout: 10000,
    
    // Retry failed tests
    retry: 1,
    
    // Reporter configuration
    reporter: ['verbose', 'junit'],
    
    // Output file for JUnit reporter
    outputFile: {
      junit: 'test-results/junit.xml'
    }
  },
  
  // Resolve configuration
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  
  // Define global variables
  define: {
    'import.meta.env.VITE_API_URL': JSON.stringify('http://localhost:5000'),
    'import.meta.env.VITE_WS_URL': JSON.stringify('ws://localhost:5000'),
    'import.meta.env.MODE': JSON.stringify('test')
  }
});