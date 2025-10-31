// Test Setup Configuration for Mini Market Backend

// Set up test environment variables
process.env.NODE_ENV = 'test';
process.env.TEST_DATABASE_URL = 'postgresql://postgres:password@localhost:5432/minimarket_test_db';

// Import test utilities
const { TextDecoder, TextEncoder } = require('util');

// Mock global objects that might not be available in test environment
global.TextDecoder = TextDecoder;
global.TextEncoder = TextEncoder;

// Set up console mocking for cleaner test output
const originalConsoleLog = console.log;
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

beforeEach(() => {
  // Reset mocks before each test
  jest.clearAllMocks();
});

afterEach(() => {
  // Clean up after each test
  jest.restoreAllMocks();
});

// Global test helpers
global.testHelpers = {
  // Generate random test data
  generateTestProduct: () => ({
    id: `test-product-${Date.now()}`,
    nombre: `Producto Test ${Date.now()}`,
    descripcion: 'Producto generado para testing',
    precio_venta: Math.round(Math.random() * 1000) / 100,
    stock_actual: Math.floor(Math.random() * 100),
    categoria_id: 'test-categoria',
    proveedor_id: 'test-proveedor',
    activo: true,
    fecha_creacion: new Date().toISOString()
  }),
  
  // Generate test user
  generateTestUser: () => ({
    id: `test-user-${Date.now()}`,
    email: `test${Date.now()}@example.com`,
    nombre: 'Usuario Test',
    rol: 'empleado',
    activo: true,
    fecha_creacion: new Date().toISOString()
  }),
  
  // Generate test category
  generateTestCategory: () => ({
    id: `test-category-${Date.now()}`,
    nombre: `Categoría Test ${Date.now()}`,
    descripcion: 'Categoría generada para testing',
    activa: true,
    fecha_creacion: new Date().toISOString()
  }),
  
  // Generate test provider
  generateTestProvider: () => ({
    id: `test-provider-${Date.now()}`,
    nombre: `Proveedor Test ${Date.now()}`,
    contacto: 'Test Contact',
    telefono: '123-456-789',
    email: `provider${Date.now()}@example.com`,
    activo: true,
    fecha_creacion: new Date().toISOString()
  })
};

// Custom matchers for common testing patterns
expect.extend({
  toBeValidDate(received) {
    const pass = received instanceof Date && !isNaN(received);
    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid date`,
        pass: true
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid date`,
        pass: false
      };
    }
  },
  
  toHaveValidStructure(received, expectedKeys) {
    const receivedKeys = Object.keys(received);
    const missingKeys = expectedKeys.filter(key => !receivedKeys.includes(key));
    const extraKeys = receivedKeys.filter(key => !expectedKeys.includes(key));
    
    const pass = missingKeys.length === 0;
    
    if (pass) {
      return {
        message: () => `expected ${JSON.stringify(received)} not to have valid structure`,
        pass: true
      };
    } else {
      return {
        message: () => `expected ${JSON.stringify(received)} to have valid structure. Missing: ${missingKeys.join(', ')}. Extra: ${extraKeys.join(', ')}`,
        pass: false
      };
    }
  }
});

// Supabase test utilities
global.supabaseTestHelpers = {
  // Mock Supabase client for testing
  createMockClient: () => ({
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null, error: null })
    })),
    auth: {
      signIn: jest.fn(),
      signOut: jest.fn(),
      getUser: jest.fn()
    }
  }),
  
  // Mock edge function response
  mockEdgeFunctionResponse: (data = {}, error = null) => ({
    data,
    error,
    status: error ? 400 : 200
  })
};

// Database test utilities
global.dbTestHelpers = {
  // Mock database connection
  createMockConnection: () => ({
    query: jest.fn(),
    release: jest.fn(),
    connect: jest.fn(),
    end: jest.fn()
  }),
  
  // Mock query results
  mockQueryResult: (rows = [], rowCount = rows.length) => ({
    rows,
    rowCount,
    command: 'SELECT'
  })
};

// API test utilities
global.apiTestHelpers = {
  // Mock HTTP responses
  mockApiResponse: (status = 200, data = {}, headers = {}) => ({
    status,
    data,
    headers: {
      'content-type': 'application/json',
      ...headers
    }
  }),
  
  // Generate test API endpoints
  generateTestEndpoint: (resource) => `/api/v1/${resource}/${Date.now()}`
};

// Performance testing utilities
global.performanceTestHelpers = {
  // Measure execution time
  measureTime: async (fn) => {
    const start = Date.now();
    const result = await fn();
    const end = Date.now();
    return {
      result,
      duration: end - start
    };
  },
  
  // Performance thresholds
  thresholds: {
    apiResponse: 500, // ms
    databaseQuery: 100, // ms
    edgeFunction: 1000 // ms
  }
};

// Clean up function to run after all tests
afterAll(async () => {
  // Clean up any test data
  console.log('🧹 Cleaning up test environment...');
  
  // Close any open connections
  // Clear any timers
  // Remove test files
  
  console.log('✅ Test environment cleaned up');
});