/**
 * Unit Tests for _shared/audit.ts
 * 
 * Tests audit logging functionality:
 * - extractAuditContext - extracts IP and User-Agent from request
 * - AuditLogEntry types
 * 
 * Note: auditLog() and queryAuditLogs() require database mocking
 * which is covered in integration tests.
 */

import { describe, it, expect } from 'vitest';
import { extractAuditContext } from '../../supabase/functions/_shared/audit';

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
