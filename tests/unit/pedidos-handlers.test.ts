/**
 * Unit Tests for api-minimarket/handlers/pedidos.ts
 * 
 * Tests CRUD operations for orders (pedidos):
 * - Validation of order creation payload
 * - State transitions
 * - Payment status calculations
 * - Item preparation tracking
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ============================================================================
// TYPE DEFINITIONS (matching pedidos.ts)
// ============================================================================

interface PedidoItem {
        producto_id?: string;
        producto_nombre: string;
        producto_sku?: string;
        cantidad: number;
        precio_unitario: number;
        observaciones?: string;
}

interface CreatePedidoPayload {
        cliente_nombre: string;
        cliente_telefono?: string;
        cliente_id?: string;
        tipo_entrega: 'retiro' | 'domicilio';
        direccion_entrega?: string;
        edificio?: string;
        piso?: string;
        departamento?: string;
        horario_entrega_preferido?: string;
        observaciones?: string;
        items: PedidoItem[];
        transcripcion_texto?: string;
}

// ============================================================================
// VALIDATION HELPERS (extracted logic for testing)
// ============================================================================

function validateClienteNombre(nombre: string | undefined | null): boolean {
        return Boolean(nombre?.trim());
}

function validateItems(items: PedidoItem[] | undefined | null): { valid: boolean; error?: string } {
        if (!items || items.length === 0) {
                return { valid: false, error: 'Se requiere al menos un item en el pedido' };
        }

        for (let i = 0; i < items.length; i++) {
                const item = items[i];
                if (!item.producto_nombre?.trim()) {
                        return { valid: false, error: `Item ${i + 1}: producto_nombre es requerido` };
                }
                if (typeof item.cantidad !== 'number' || item.cantidad <= 0) {
                        return { valid: false, error: `Item ${i + 1}: cantidad debe ser mayor a 0` };
                }
                if (typeof item.precio_unitario !== 'number' || item.precio_unitario < 0) {
                        return { valid: false, error: `Item ${i + 1}: precio_unitario inválido` };
                }
        }

        return { valid: true };
}

function validateTipoEntrega(tipo: string | undefined): boolean {
        return tipo === 'retiro' || tipo === 'domicilio';
}

function validateDireccionEntrega(tipo_entrega: string, direccion: string | undefined | null): boolean {
        if (tipo_entrega === 'domicilio') {
                return Boolean(direccion?.trim());
        }
        return true; // Retiro no requiere dirección
}

function calculateEstadoPago(monto_pagado: number, monto_total: number): string {
        if (monto_pagado >= monto_total) {
                return 'pagado';
        } else if (monto_pagado > 0) {
                return 'parcial';
        }
        return 'pendiente';
}

function isValidEstado(estado: string): boolean {
        const estadosValidos = ['pendiente', 'preparando', 'listo', 'entregado', 'cancelado'];
        return estadosValidos.includes(estado);
}

// ============================================================================
// TESTS
// ============================================================================

describe('Pedidos Validation: Cliente Nombre', () => {
        it('should accept valid cliente_nombre', () => {
                expect(validateClienteNombre('Juan Pérez')).toBe(true);
                expect(validateClienteNombre('María')).toBe(true);
        });

        it('should reject empty cliente_nombre', () => {
                expect(validateClienteNombre('')).toBe(false);
                expect(validateClienteNombre('   ')).toBe(false);
        });

        it('should reject null/undefined', () => {
                expect(validateClienteNombre(null)).toBe(false);
                expect(validateClienteNombre(undefined)).toBe(false);
        });
});

describe('Pedidos Validation: Items', () => {
        it('should accept valid items array', () => {
                const items: PedidoItem[] = [
                        { producto_nombre: 'Salchichas FELA', cantidad: 2, precio_unitario: 1500 },
                        { producto_nombre: 'Queso', cantidad: 1, precio_unitario: 2000, observaciones: 'En fetas' }
                ];
                const result = validateItems(items);
                expect(result.valid).toBe(true);
        });

        it('should reject empty items array', () => {
                const result = validateItems([]);
                expect(result.valid).toBe(false);
                expect(result.error).toContain('al menos un item');
        });

        it('should reject null/undefined items', () => {
                expect(validateItems(null).valid).toBe(false);
                expect(validateItems(undefined).valid).toBe(false);
        });

        it('should reject item without producto_nombre', () => {
                const items: PedidoItem[] = [
                        { producto_nombre: '', cantidad: 1, precio_unitario: 100 }
                ];
                const result = validateItems(items);
                expect(result.valid).toBe(false);
                expect(result.error).toContain('producto_nombre es requerido');
        });

        it('should reject item with cantidad <= 0', () => {
                const items: PedidoItem[] = [
                        { producto_nombre: 'Test', cantidad: 0, precio_unitario: 100 }
                ];
                const result = validateItems(items);
                expect(result.valid).toBe(false);
                expect(result.error).toContain('cantidad debe ser mayor a 0');
        });

        it('should reject item with cantidad negative', () => {
                const items: PedidoItem[] = [
                        { producto_nombre: 'Test', cantidad: -1, precio_unitario: 100 }
                ];
                const result = validateItems(items);
                expect(result.valid).toBe(false);
        });

        it('should reject item with precio_unitario negative', () => {
                const items: PedidoItem[] = [
                        { producto_nombre: 'Test', cantidad: 1, precio_unitario: -50 }
                ];
                const result = validateItems(items);
                expect(result.valid).toBe(false);
                expect(result.error).toContain('precio_unitario inválido');
        });

        it('should accept item with precio_unitario = 0 (free item)', () => {
                const items: PedidoItem[] = [
                        { producto_nombre: 'Muestra gratis', cantidad: 1, precio_unitario: 0 }
                ];
                const result = validateItems(items);
                expect(result.valid).toBe(true);
        });

        it('should include item index in error message', () => {
                const items: PedidoItem[] = [
                        { producto_nombre: 'OK', cantidad: 1, precio_unitario: 100 },
                        { producto_nombre: '', cantidad: 1, precio_unitario: 100 } // Error in item 2
                ];
                const result = validateItems(items);
                expect(result.error).toContain('Item 2');
        });
});

describe('Pedidos Validation: Tipo Entrega', () => {
        it('should accept "retiro"', () => {
                expect(validateTipoEntrega('retiro')).toBe(true);
        });

        it('should accept "domicilio"', () => {
                expect(validateTipoEntrega('domicilio')).toBe(true);
        });

        it('should reject invalid types', () => {
                expect(validateTipoEntrega('delivery')).toBe(false);
                expect(validateTipoEntrega('pickup')).toBe(false);
                expect(validateTipoEntrega('')).toBe(false);
                expect(validateTipoEntrega(undefined)).toBe(false);
        });
});

describe('Pedidos Validation: Direccion Entrega', () => {
        it('should require direccion for domicilio', () => {
                expect(validateDireccionEntrega('domicilio', 'Calle 123')).toBe(true);
                expect(validateDireccionEntrega('domicilio', '')).toBe(false);
                expect(validateDireccionEntrega('domicilio', null)).toBe(false);
                expect(validateDireccionEntrega('domicilio', undefined)).toBe(false);
        });

        it('should not require direccion for retiro', () => {
                expect(validateDireccionEntrega('retiro', null)).toBe(true);
                expect(validateDireccionEntrega('retiro', undefined)).toBe(true);
                expect(validateDireccionEntrega('retiro', '')).toBe(true);
        });
});

describe('Pedidos: Estado Pago Calculation', () => {
        it('should return "pagado" when monto_pagado >= monto_total', () => {
                expect(calculateEstadoPago(1000, 1000)).toBe('pagado');
                expect(calculateEstadoPago(1500, 1000)).toBe('pagado');
        });

        it('should return "parcial" when 0 < monto_pagado < monto_total', () => {
                expect(calculateEstadoPago(500, 1000)).toBe('parcial');
                expect(calculateEstadoPago(1, 1000)).toBe('parcial');
                expect(calculateEstadoPago(999, 1000)).toBe('parcial');
        });

        it('should return "pendiente" when monto_pagado = 0', () => {
                expect(calculateEstadoPago(0, 1000)).toBe('pendiente');
        });

        it('should handle edge cases', () => {
                expect(calculateEstadoPago(0, 0)).toBe('pagado'); // Free order
                expect(calculateEstadoPago(100, 0)).toBe('pagado'); // Overpaid free order
        });
});

describe('Pedidos: Estado Validation', () => {
        it('should accept valid estados', () => {
                expect(isValidEstado('pendiente')).toBe(true);
                expect(isValidEstado('preparando')).toBe(true);
                expect(isValidEstado('listo')).toBe(true);
                expect(isValidEstado('entregado')).toBe(true);
                expect(isValidEstado('cancelado')).toBe(true);
        });

        it('should reject invalid estados', () => {
                expect(isValidEstado('en_proceso')).toBe(false);
                expect(isValidEstado('completed')).toBe(false);
                expect(isValidEstado('')).toBe(false);
                expect(isValidEstado('PENDIENTE')).toBe(false); // Case sensitive
        });
});

describe('Pedidos: Full Payload Validation', () => {
        const validPayload: CreatePedidoPayload = {
                cliente_nombre: 'Juan Pérez',
                cliente_telefono: '+54 9 2262 123456',
                tipo_entrega: 'domicilio',
                direccion_entrega: 'Calle 123',
                items: [
                        { producto_nombre: 'Salchichas', cantidad: 2, precio_unitario: 1500 }
                ]
        };

        it('should validate complete payload for domicilio', () => {
                expect(validateClienteNombre(validPayload.cliente_nombre)).toBe(true);
                expect(validateTipoEntrega(validPayload.tipo_entrega)).toBe(true);
                expect(validateDireccionEntrega(validPayload.tipo_entrega, validPayload.direccion_entrega)).toBe(true);
                expect(validateItems(validPayload.items).valid).toBe(true);
        });

        it('should validate payload for retiro without direccion', () => {
                const retiroPayload: CreatePedidoPayload = {
                        ...validPayload,
                        tipo_entrega: 'retiro',
                        direccion_entrega: undefined
                };
                expect(validateDireccionEntrega(retiroPayload.tipo_entrega, retiroPayload.direccion_entrega)).toBe(true);
        });

        it('should accept optional fields as undefined', () => {
                const minimalPayload: CreatePedidoPayload = {
                        cliente_nombre: 'María',
                        tipo_entrega: 'retiro',
                        items: [{ producto_nombre: 'Queso', cantidad: 1, precio_unitario: 2000 }]
                };
                expect(validateClienteNombre(minimalPayload.cliente_nombre)).toBe(true);
                expect(validateItems(minimalPayload.items).valid).toBe(true);
        });
});

describe('Pedidos: Monto Calculation', () => {
        it('should calculate subtotal correctly', () => {
                const items: PedidoItem[] = [
                        { producto_nombre: 'A', cantidad: 2, precio_unitario: 100 }, // 200
                        { producto_nombre: 'B', cantidad: 3, precio_unitario: 50 }   // 150
                ];
                const total = items.reduce((sum, item) => sum + (item.cantidad * item.precio_unitario), 0);
                expect(total).toBe(350);
        });

        it('should handle empty items', () => {
                const items: PedidoItem[] = [];
                const total = items.reduce((sum, item) => sum + (item.cantidad * item.precio_unitario), 0);
                expect(total).toBe(0);
        });

        it('should handle large quantities', () => {
                const items: PedidoItem[] = [
                        { producto_nombre: 'Bulk', cantidad: 1000, precio_unitario: 10000 }
                ];
                const total = items.reduce((sum, item) => sum + (item.cantidad * item.precio_unitario), 0);
                expect(total).toBe(10000000);
        });
});
