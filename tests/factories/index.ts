/**
 * Test Data Factories
 * 
 * Centralized factory functions for creating test data.
 * Use these instead of hardcoding data in individual tests.
 * 
 * @example
 * import { createProducto, createAlerta } from '../factories';
 * const producto = createProducto({ precio_unitario: 250 });
 */

// ============================================================================
// PRODUCTO FACTORY
// ============================================================================

export interface ProductoData {
        sku: string;
        nombre: string;
        marca?: string;
        categoria?: string;
        precio_unitario: number;
        precio_costo?: number;
        stock_disponible?: number;
        codigo_barras?: string;
        ultima_actualizacion: string;
        activo?: boolean;
        metadata?: Record<string, unknown>;
}

let productoCounter = 0;

export function createProducto(overrides: Partial<ProductoData> = {}): ProductoData {
        productoCounter++;
        return {
                sku: `TEST-SKU-${productoCounter.toString().padStart(4, '0')}`,
                nombre: `Producto de Prueba ${productoCounter}`,
                marca: 'MarcaTest',
                categoria: 'categoria-test',
                precio_unitario: 100 + Math.random() * 900,
                precio_costo: 50 + Math.random() * 400,
                stock_disponible: Math.floor(Math.random() * 100),
                ultima_actualizacion: new Date().toISOString(),
                activo: true,
                ...overrides
        };
}

export function createProductoMaxiconsumo(overrides: Partial<ProductoData> = {}): ProductoData {
        return createProducto({
                categoria: 'maxiconsumo',
                metadata: { fuente: 'scraper-maxiconsumo' },
                ...overrides
        });
}

// ============================================================================
// ALERTA FACTORY
// ============================================================================

export interface AlertaData {
        id: string;
        tipo: 'precio_alto' | 'precio_bajo' | 'stock_bajo' | 'producto_nuevo';
        severidad: 'critica' | 'alta' | 'media' | 'baja';
        mensaje: string;
        producto_id?: string;
        fecha_alerta: string;
        procesada: boolean;
        metadata?: Record<string, unknown>;
}

let alertaCounter = 0;

export function createAlerta(overrides: Partial<AlertaData> = {}): AlertaData {
        alertaCounter++;
        return {
                id: `alert-${alertaCounter.toString().padStart(4, '0')}`,
                tipo: 'precio_alto',
                severidad: 'media',
                mensaje: `Alerta de prueba #${alertaCounter}`,
                fecha_alerta: new Date().toISOString(),
                procesada: false,
                ...overrides
        };
}

export function createAlertaCritica(overrides: Partial<AlertaData> = {}): AlertaData {
        return createAlerta({
                severidad: 'critica',
                tipo: 'precio_alto',
                mensaje: 'ALERTA CRÍTICA: Precio excede umbral',
                ...overrides
        });
}

// ============================================================================
// USER FACTORY
// ============================================================================

export interface UserData {
        id: string;
        email: string;
        role: 'admin' | 'deposito' | 'ventas' | null;
        app_metadata?: Record<string, unknown>;
        user_metadata?: Record<string, unknown>;
}

let userCounter = 0;

export function createUser(overrides: Partial<UserData> = {}): UserData {
        userCounter++;
        return {
                id: `user-${userCounter.toString().padStart(4, '0')}`,
                email: `test${userCounter}@example.com`,
                role: 'ventas',
                ...overrides
        };
}

export function createAdminUser(overrides: Partial<UserData> = {}): UserData {
        return createUser({
                role: 'admin',
                app_metadata: { role: 'admin', permissions: ['all'] },
                ...overrides
        });
}

// ============================================================================
// RESPONSE FACTORY
// ============================================================================

export interface MockResponseData {
        success: boolean;
        data?: unknown;
        error?: { code: string; message: string };
        meta?: Record<string, unknown>;
}

export function createSuccessResponse(data: unknown, meta?: Record<string, unknown>): MockResponseData {
        return {
                success: true,
                data,
                meta
        };
}

export function createErrorResponse(code: string, message: string): MockResponseData {
        return {
                success: false,
                error: { code, message }
        };
}

// ============================================================================
// RESET COUNTERS (use in beforeEach if needed)
// ============================================================================

export function resetFactoryCounters(): void {
        productoCounter = 0;
        alertaCounter = 0;
        userCounter = 0;
}
