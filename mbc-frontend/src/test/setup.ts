/**
 * Test Setup Configuration
 * Global test utilities and mocks for the frontend application
 */

import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeAll, vi } from 'vitest';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Global test setup
beforeAll(() => {
  // Mock environment variables
  Object.defineProperty(import.meta, 'env', {
    value: {
      VITE_API_URL: 'http://localhost:5000',
      VITE_WS_URL: 'ws://localhost:5000',
      MODE: 'test'
    },
    writable: true
  });
});

// Mock environment variables
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock scrollTo
Object.defineProperty(window, 'scrollTo', {
  value: vi.fn(),
  writable: true,
});

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock sessionStorage
const sessionStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock,
});

// Mock fetch
global.fetch = vi.fn();

// Mock WebSocket
global.WebSocket = vi.fn().mockImplementation(() => ({
  close: vi.fn(),
  send: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  readyState: 1,
  CONNECTING: 0,
  OPEN: 1,
  CLOSING: 2,
  CLOSED: 3
}));

// Mock URL.createObjectURL
global.URL.createObjectURL = vi.fn(() => 'mocked-url');
global.URL.revokeObjectURL = vi.fn();

// Mock File and FileReader
global.File = vi.fn().mockImplementation((chunks, filename, options) => ({
  name: filename,
  size: chunks.reduce((acc, chunk) => acc + chunk.length, 0),
  type: options?.type || '',
  lastModified: Date.now()
}));

global.FileReader = vi.fn().mockImplementation(() => ({
  readAsDataURL: vi.fn(),
  readAsText: vi.fn(),
  result: null,
  onload: null,
  onerror: null
}));

// Setup test environment
beforeEach(() => {
  vi.clearAllMocks();
});

// Test utilities
export const testUtils = {
  createMockUser: (role = 'student') => ({
    id: `test-user-${Date.now()}`,
    email: `test-${Date.now()}@example.com`,
    name: `Test User ${Date.now()}`,
    role,
    institutionId: 'test-institution-id',
    branchId: 'test-branch-id'
  }),

  createMockApiResponse: (data: any, success = true) => ({
    success,
    data,
    message: success ? 'Success' : 'Error',
    timestamp: new Date().toISOString()
  }),

  mockApiCall: (response: any, delay = 0) => {
    return vi.fn().mockImplementation(() => 
      new Promise(resolve => 
        setTimeout(() => resolve(response), delay)
      )
    );
  },

  mockWebSocketConnection: () => ({
    connect: vi.fn(),
    disconnect: vi.fn(),
    send: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
    isConnected: true
  })
};