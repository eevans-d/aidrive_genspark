// Example Edge Function Tests for Mini Market Backend
// This file demonstrates how to test Supabase Edge Functions

const { createClient } = require('@supabase/supabase-js');

// Test configuration
const SUPABASE_URL = process.env.SUPABASE_URL || 'http://localhost:54321';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'test-key';

describe('Edge Functions Tests', () => {
  let supabase;
  
  beforeAll(() => {
    // Initialize Supabase client for testing
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  });
  
  describe('API Productos Function', () => {
    test('should get all products', async () => {
      const { data, error } = await supabase.functions.invoke('api-productos', {
        body: { method: 'GET', path: '/' }
      });
      
      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(Array.isArray(data)).toBe(true);
    });
    
    test('should get product by ID', async () => {
      const testProductId = 'test-product-id';
      
      const { data, error } = await supabase.functions.invoke('api-productos', {
        body: { method: 'GET', path: `/${testProductId}` }
      });
      
      expect(error).toBeNull();
      expect(data).toHaveValidStructure(['id', 'nombre', 'precio_venta']);
    });
    
    test('should create new product', async () => {
      const newProduct = {
        nombre: 'Test Product',
        descripcion: 'Test Description',
        precio_venta: 99.99,
        stock_actual: 10,
        categoria_id: 'test-category',
        proveedor_id: 'test-provider'
      };
      
      const { data, error } = await supabase.functions.invoke('api-productos', {
        body: { method: 'POST', data: newProduct }
      });
      
      expect(error).toBeNull();
      expect(data.nombre).toBe(newProduct.nombre);
      expect(data.id).toBeDefined();
    });
  });
  
  describe('API Categorías Function', () => {
    test('should get all categories', async () => {
      const { data, error } = await supabase.functions.invoke('api-categorias', {
        body: { method: 'GET', path: '/' }
      });
      
      expect(error).toBeNull();
      expect(data).toBeDefined();
    });
    
    test('should create new category', async () => {
      const newCategory = {
        nombre: 'Test Category',
        descripcion: 'Test Category Description',
        activa: true
      };
      
      const { data, error } = await supabase.functions.invoke('api-categorias', {
        body: { method: 'POST', data: newCategory }
      });
      
      expect(error).toBeNull();
      expect(data.nombre).toBe(newCategory.nombre);
    });
  });
  
  describe('API Proveedores Function', () => {
    test('should get all providers', async () => {
      const { data, error } = await supabase.functions.invoke('api-proveedores', {
        body: { method: 'GET', path: '/' }
      });
      
      expect(error).toBeNull();
      expect(data).toBeDefined();
    });
    
    test('should get provider by ID', async () => {
      const testProviderId = 'test-provider-id';
      
      const { data, error } = await supabase.functions.invoke('api-proveedores', {
        body: { method: 'GET', path: `/${testProviderId}` }
      });
      
      expect(error).toBeNull();
      expect(data).toHaveValidStructure(['id', 'nombre', 'contacto', 'email']);
    });
  });
  
  describe('API Stock Function', () => {
    test('should get current stock levels', async () => {
      const { data, error } = await supabase.functions.invoke('api-stock', {
        body: { method: 'GET', path: '/' }
      });
      
      expect(error).toBeNull();
      expect(data).toBeDefined();
    });
    
    test('should update stock levels', async () => {
      const stockUpdate = {
        producto_id: 'test-product',
        cantidad: 50,
        tipo_movimiento: 'entrada',
        observaciones: 'Stock update test'
      };
      
      const { data, error } = await supabase.functions.invoke('api-stock', {
        body: { method: 'PUT', data: stockUpdate }
      });
      
      expect(error).toBeNull();
      expect(data.producto_id).toBe(stockUpdate.producto_id);
    });
  });
  
  describe('API Precios Function', () => {
    test('should get price history', async () => {
      const { data, error } = await supabase.functions.invoke('api-precios', {
        body: { method: 'GET', path: '/' }
      });
      
      expect(error).toBeNull();
      expect(data).toBeDefined();
    });
    
    test('should update product price', async () => {
      const priceUpdate = {
        producto_id: 'test-product',
        precio_nuevo: 149.99,
        proveedor_id: 'test-provider',
        observaciones: 'Price update test'
      };
      
      const { data, error } = await supabase.functions.invoke('api-precios', {
        body: { method: 'POST', data: priceUpdate }
      });
      
      expect(error).toBeNull();
      expect(data.precio_venta).toBe(priceUpdate.precio_nuevo);
    });
  });
  
  describe('Alertas Stock Function', () => {
    test('should detect low stock products', async () => {
      const { data, error } = await supabase.functions.invoke('alertas-stock', {
        body: { threshold: 10 }
      });
      
      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(Array.isArray(data)).toBe(true);
    });
    
    test('should generate alerts for out of stock items', async () => {
      const { data, error } = await supabase.functions.invoke('alertas-stock', {
        body: { check_out_of_stock: true }
      });
      
      expect(error).toBeNull();
    });
  });
  
  describe('Notificaciones Tareas Function', () => {
    test('should get pending tasks', async () => {
      const { data, error } = await supabase.functions.invoke('notificaciones-tareas', {
        body: { method: 'GET', path: '/' }
      });
      
      expect(error).toBeNull();
      expect(data).toBeDefined();
    });
    
    test('should create new task', async () => {
      const newTask = {
        titulo: 'Test Task',
        descripcion: 'Test task description',
        prioridad: 'media',
        fecha_vencimiento: new Date(Date.now() + 86400000).toISOString() // tomorrow
      };
      
      const { data, error } = await supabase.functions.invoke('notificaciones-tareas', {
        body: { method: 'POST', data: newTask }
      });
      
      expect(error).toBeNull();
      expect(data.titulo).toBe(newTask.titulo);
    });
  });
  
  describe('Reportes Automáticos Function', () => {
    test('should generate inventory report', async () => {
      const { data, error } = await supabase.functions.invoke('reportes-automaticos', {
        body: { 
          type: 'inventory',
          format: 'json',
          date_range: 'last_30_days'
        }
      });
      
      expect(error).toBeNull();
      expect(data).toBeDefined();
    });
    
    test('should generate sales report', async () => {
      const { data, error } = await supabase.functions.invoke('reportes-automaticos', {
        body: { 
          type: 'sales',
          format: 'json',
          date_range: 'last_30_days'
        }
      });
      
      expect(error).toBeNull();
      expect(data).toBeDefined();
    });
  });
  
  describe('Scraping Maxiconsumo Function', () => {
    test('should scrape product data', async () => {
      const { data, error } = await supabase.functions.invoke('scraping-maxiconsumo', {
        body: { 
          action: 'scrape',
          category: 'bebidas',
          limit: 10
        }
      });
      
      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(Array.isArray(data)).toBe(true);
    });
    
    test('should update scraped prices', async () => {
      const { data, error } = await supabase.functions.invoke('scraping-maxiconsumo', {
        body: { 
          action: 'update_prices',
          dry_run: true
        }
      });
      
      expect(error).toBeNull();
    });
  });
  
  // Performance tests
  describe('Performance Tests', () => {
    test('API response time should be under 1 second', async () => {
      const start = Date.now();
      
      const { data, error } = await supabase.functions.invoke('api-productos', {
        body: { method: 'GET', path: '/' }
      });
      
      const duration = Date.now() - start;
      
      expect(error).toBeNull();
      expect(duration).toBeLessThan(1000);
    });
    
    test('Database operations should be under 500ms', async () => {
      const testProduct = global.testHelpers.generateTestProduct();
      
      const { duration } = await global.performanceTestHelpers.measureTime(async () => {
        const { data, error } = await supabase.functions.invoke('api-productos', {
          body: { method: 'POST', data: testProduct }
        });
        expect(error).toBeNull();
      });
      
      expect(duration).toBeLessThan(500);
    });
  });
  
  // Security tests
  describe('Security Tests', () => {
    test('should reject unauthorized requests', async () => {
      const { data, error } = await supabase.functions.invoke('api-productos', {
        body: { method: 'GET', path: '/admin' },
        headers: { Authorization: 'Invalid token' }
      });
      
      expect(error).toBeDefined();
      expect(error.message).toContain('Unauthorized');
    });
    
    test('should validate input data', async () => {
      const invalidProduct = {
        nombre: '', // Invalid: empty name
        precio_venta: 'invalid_price' // Invalid: not a number
      };
      
      const { data, error } = await supabase.functions.invoke('api-productos', {
        body: { method: 'POST', data: invalidProduct }
      });
      
      expect(error).toBeDefined();
      expect(error.message).toContain('Validation');
    });
  });
});

// Helper functions for edge function testing
global.edgeFunctionTestHelpers = {
  // Test edge function with different HTTP methods
  testEdgeFunction: async (functionName, method, data = {}, path = '') => {
    const payload = { method, ...(Object.keys(data).length > 0 && { data }) };
    if (path) payload.path = path;
    
    return await supabase.functions.invoke(functionName, { body: payload });
  },
  
  // Test edge function error handling
  testEdgeFunctionError: async (functionName, payload, expectedError) => {
    const { data, error } = await supabase.functions.invoke(functionName, { body: payload });
    expect(error).toBeDefined();
    expect(error.message).toContain(expectedError);
  },
  
  // Test edge function performance
  testEdgeFunctionPerformance: async (functionName, payload, maxDuration = 1000) => {
    const start = Date.now();
    const { data, error } = await supabase.functions.invoke(functionName, { body: payload });
    const duration = Date.now() - start;
    
    expect(error).toBeNull();
    expect(duration).toBeLessThan(maxDuration);
    
    return duration;
  }
};