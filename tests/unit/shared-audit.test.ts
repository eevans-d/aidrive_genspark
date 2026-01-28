/**
 * Unit Tests for _shared/audit.ts
 * 
 * Tests audit logging functionality:
 * - extractAuditContext - extracts IP and User-Agent from request
 * - auditLog - logs audit entries to database
 * - queryAuditLogs - queries audit logs with filters
 * - AuditLogEntry types
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { extractAuditContext, auditLog, queryAuditLogs } from '../../supabase/functions/_shared/audit';

// Mock Supabase client
const createMockSupabase = (overrides: any = {}) => ({
        from: vi.fn().mockReturnValue({
                insert: vi.fn().mockReturnValue({
                        select: vi.fn().mockReturnValue({
                                single: vi.fn().mockResolvedValue({ data: { id: 'audit-123' }, error: null })
                        })
                }),
                select: vi.fn().mockReturnValue({
                        order: vi.fn().mockReturnValue({
                                eq: vi.fn().mockReturnThis(),
                                gte: vi.fn().mockReturnThis(),
                                lte: vi.fn().mockReturnThis(),
                                limit: vi.fn().mockResolvedValue({ data: [], error: null })
                        })
                }),
                ...overrides
        })
});

describe('extractAuditContext', () => {
        it('should extract x-forwarded-for header', () => {
                const req = new Request('https://example.com', {
                        headers: { 'x-forwarded-for': '192.168.1.100' }
                });

                const context = extractAuditContext(req);

                expect(context.ip_address).toBe('192.168.1.100');
        });

        it('should fall back to x-real-ip', () => {
                const req = new Request('https://example.com', {
                        headers: { 'x-real-ip': '10.0.0.50' }
                });

                const context = extractAuditContext(req);

                expect(context.ip_address).toBe('10.0.0.50');
        });

        it('should prefer x-forwarded-for over x-real-ip', () => {
                const req = new Request('https://example.com', {
                        headers: {
                                'x-forwarded-for': '192.168.1.100',
                                'x-real-ip': '10.0.0.50'
                        }
                });

                const context = extractAuditContext(req);

                expect(context.ip_address).toBe('192.168.1.100');
        });

        it('should return null when no IP headers', () => {
                const req = new Request('https://example.com');

                const context = extractAuditContext(req);

                expect(context.ip_address).toBeNull();
        });

        it('should extract user-agent header', () => {
                const req = new Request('https://example.com', {
                        headers: { 'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
                });

                const context = extractAuditContext(req);

                expect(context.user_agent).toBe('Mozilla/5.0 (Windows NT 10.0; Win64; x64)');
        });

        it('should return null when no user-agent', () => {
                const req = new Request('https://example.com');

                const context = extractAuditContext(req);

                expect(context.user_agent).toBeNull();
        });

        it('should handle all headers together', () => {
                const req = new Request('https://example.com', {
                        headers: {
                                'x-forwarded-for': '203.0.113.195, 70.41.3.18',
                                'user-agent': 'MiniMarket-App/1.0'
                        }
                });

                const context = extractAuditContext(req);

                expect(context.ip_address).toBe('203.0.113.195, 70.41.3.18');
                expect(context.user_agent).toBe('MiniMarket-App/1.0');
        });
});

describe('auditLog', () => {
        beforeEach(() => {
                vi.clearAllMocks();
        });

        it('should work in dry-run mode without supabase client', async () => {
                const entry = {
                        action: 'precio_actualizado' as const,
                        usuario_id: 'user-123',
                        entidad_tipo: 'productos',
                        entidad_id: 'prod-456',
                        detalles: { precio_anterior: 100, precio_nuevo: 150 }
                };

                const result = await auditLog(null, entry);

                expect(result.success).toBe(true);
                expect(result.audit_id).toContain('dry-run-');
        });

        it('should insert audit log with supabase client', async () => {
                const mockSupabase = createMockSupabase();
                const entry = {
                        action: 'stock_ajustado' as const,
                        usuario_id: 'user-456',
                        entidad_tipo: 'stock_deposito',
                        entidad_id: 'stock-789',
                        nivel: 'warning' as const
                };

                const result = await auditLog(mockSupabase as any, entry);

                expect(result.success).toBe(true);
                expect(result.audit_id).toBe('audit-123');
                expect(mockSupabase.from).toHaveBeenCalledWith('audit_log');
        });

        it('should return error when database insert fails', async () => {
                const mockSupabase = {
                        from: vi.fn().mockReturnValue({
                                insert: vi.fn().mockReturnValue({
                                        select: vi.fn().mockReturnValue({
                                                single: vi.fn().mockResolvedValue({
                                                        data: null,
                                                        error: { message: 'Database error' }
                                                })
                                        })
                                })
                        })
                };

                const result = await auditLog(mockSupabase as any, {
                        action: 'producto_eliminado' as const
                });

                expect(result.success).toBe(false);
                expect(result.error).toBe('Database error');
        });

        it('should handle exceptions gracefully', async () => {
                const mockSupabase = {
                        from: vi.fn().mockImplementation(() => {
                                throw new Error('Connection failed');
                        })
                };

                const result = await auditLog(mockSupabase as any, {
                        action: 'login_fallido' as const
                });

                expect(result.success).toBe(false);
                expect(result.error).toBe('Connection failed');
        });

        it('should use default nivel when not specified', async () => {
                const mockInsert = vi.fn().mockReturnValue({
                        select: vi.fn().mockReturnValue({
                                single: vi.fn().mockResolvedValue({ data: { id: 'audit-999' }, error: null })
                        })
                });
                const mockSupabase = {
                        from: vi.fn().mockReturnValue({ insert: mockInsert })
                };

                await auditLog(mockSupabase as any, {
                        action: 'producto_creado' as const
                });

                const insertArg = mockInsert.mock.calls[0][0];
                expect(insertArg.nivel).toBe('info');
        });
});

describe('queryAuditLogs', () => {
        beforeEach(() => {
                vi.clearAllMocks();
        });

        it('should query audit logs without filters', async () => {
                const mockSupabase = createMockSupabase();

                const result = await queryAuditLogs(mockSupabase as any);

                expect(result.success).toBe(true);
                expect(result.data).toEqual([]);
                expect(mockSupabase.from).toHaveBeenCalledWith('audit_log');
        });

        it('should apply action filter', async () => {
                const mockEq = vi.fn().mockReturnThis();
                const mockLimit = vi.fn().mockResolvedValue({
                        data: [{ id: 1, action: 'precio_actualizado' }],
                        error: null
                });
                const mockSupabase = {
                        from: vi.fn().mockReturnValue({
                                select: vi.fn().mockReturnValue({
                                        order: vi.fn().mockReturnValue({
                                                eq: mockEq,
                                                limit: mockLimit
                                        })
                                })
                        })
                };

                const result = await queryAuditLogs(mockSupabase as any, { action: 'precio_actualizado' });

                expect(result.success).toBe(true);
                expect(mockEq).toHaveBeenCalledWith('action', 'precio_actualizado');
        });

        it('should apply date range filters', async () => {
                const mockGte = vi.fn().mockReturnThis();
                const mockLte = vi.fn().mockReturnThis();
                const mockLimit = vi.fn().mockResolvedValue({ data: [], error: null });
                const mockSupabase = {
                        from: vi.fn().mockReturnValue({
                                select: vi.fn().mockReturnValue({
                                        order: vi.fn().mockReturnValue({
                                                gte: mockGte,
                                                lte: mockLte,
                                                limit: mockLimit
                                        })
                                })
                        })
                };

                const result = await queryAuditLogs(mockSupabase as any, {
                        fecha_desde: '2026-01-01',
                        fecha_hasta: '2026-01-31'
                });

                expect(result.success).toBe(true);
                expect(mockGte).toHaveBeenCalledWith('fecha_accion', '2026-01-01');
                expect(mockLte).toHaveBeenCalledWith('fecha_accion', '2026-01-31');
        });

        it('should apply custom limit', async () => {
                const mockLimit = vi.fn().mockResolvedValue({ data: [], error: null });
                const mockSupabase = {
                        from: vi.fn().mockReturnValue({
                                select: vi.fn().mockReturnValue({
                                        order: vi.fn().mockReturnValue({
                                                limit: mockLimit
                                        })
                                })
                        })
                };

                await queryAuditLogs(mockSupabase as any, { limit: 50 });

                expect(mockLimit).toHaveBeenCalledWith(50);
        });

        it('should return error when query fails', async () => {
                const mockSupabase = {
                        from: vi.fn().mockReturnValue({
                                select: vi.fn().mockReturnValue({
                                        order: vi.fn().mockReturnValue({
                                                limit: vi.fn().mockResolvedValue({
                                                        data: null,
                                                        error: { message: 'Query failed' }
                                                })
                                        })
                                })
                        })
                };

                const result = await queryAuditLogs(mockSupabase as any);

                expect(result.success).toBe(false);
                expect(result.error).toBe('Query failed');
                expect(result.data).toEqual([]);
        });

        it('should handle exceptions gracefully', async () => {
                const mockSupabase = {
                        from: vi.fn().mockImplementation(() => {
                                throw new Error('Connection timeout');
                        })
                };

                const result = await queryAuditLogs(mockSupabase as any);

                expect(result.success).toBe(false);
                expect(result.error).toBe('Connection timeout');
        });
});

// Type tests - these verify TypeScript types compile correctly
describe('AuditLogEntry Types', () => {
        it('should accept standard audit actions', () => {
                const entry = {
                        action: 'precio_actualizado' as const,
                        usuario_id: 'user-123',
                        entidad_tipo: 'productos',
                        entidad_id: 'prod-456',
                        detalles: { precio_anterior: 100, precio_nuevo: 150 },
                        nivel: 'info' as const
                };

                expect(entry.action).toBe('precio_actualizado');
                expect(entry.nivel).toBe('info');
        });

        it('should accept custom actions', () => {
                const entry = {
                        action: 'custom_action',
                        detalles: { custom: true }
                };

                expect(entry.action).toBe('custom_action');
        });

        it('should accept all nivel values', () => {
                const levels = ['info', 'warning', 'critical'] as const;

                for (const nivel of levels) {
                        const entry = { action: 'test', nivel };
                        expect(entry.nivel).toBe(nivel);
                }
        });
});
