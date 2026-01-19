/**
 * Unit Tests for api-minimarket/helpers/pagination.ts
 * 
 * Tests pagination utilities:
 * - parsePagination - validates and parses limit/offset
 * - buildPaginationMeta - builds response metadata
 */

import { describe, it, expect } from 'vitest';
import {
        parsePagination,
        buildPaginationMeta
} from '../../supabase/functions/api-minimarket/helpers/pagination';

describe('parsePagination', () => {
        const defaultLimit = 20;
        const maxLimit = 100;

        describe('Valid inputs', () => {
                it('should use defaults when no params provided', () => {
                        const result = parsePagination(null, null, defaultLimit, maxLimit);

                        expect(result.ok).toBe(true);
                        if (result.ok) {
                                expect(result.params.limit).toBe(20);
                                expect(result.params.offset).toBe(0);
                        }
                });

                it('should use defaults for empty strings', () => {
                        const result = parsePagination('', '', defaultLimit, maxLimit);

                        expect(result.ok).toBe(true);
                        if (result.ok) {
                                expect(result.params.limit).toBe(20);
                                expect(result.params.offset).toBe(0);
                        }
                });

                it('should parse valid limit and offset', () => {
                        const result = parsePagination('50', '100', defaultLimit, maxLimit);

                        expect(result.ok).toBe(true);
                        if (result.ok) {
                                expect(result.params.limit).toBe(50);
                                expect(result.params.offset).toBe(100);
                        }
                });

                it('should cap limit at maxLimit', () => {
                        const result = parsePagination('500', '0', defaultLimit, maxLimit);

                        expect(result.ok).toBe(true);
                        if (result.ok) {
                                expect(result.params.limit).toBe(100); // Capped at maxLimit
                        }
                });

                it('should allow offset of 0', () => {
                        const result = parsePagination('10', '0', defaultLimit, maxLimit);

                        expect(result.ok).toBe(true);
                        if (result.ok) {
                                expect(result.params.offset).toBe(0);
                        }
                });
        });

        describe('Invalid limit', () => {
                it('should reject negative limit', () => {
                        const result = parsePagination('-5', '0', defaultLimit, maxLimit);

                        expect(result.ok).toBe(false);
                        if (!result.ok) {
                                expect(result.error.field).toBe('limit');
                        }
                });

                it('should reject zero limit', () => {
                        const result = parsePagination('0', '0', defaultLimit, maxLimit);

                        expect(result.ok).toBe(false);
                        if (!result.ok) {
                                expect(result.error.field).toBe('limit');
                        }
                });

                it('should reject non-numeric limit', () => {
                        const result = parsePagination('abc', '0', defaultLimit, maxLimit);

                        expect(result.ok).toBe(false);
                        if (!result.ok) {
                                expect(result.error.field).toBe('limit');
                        }
                });

                it('should reject float limit', () => {
                        const result = parsePagination('10.5', '0', defaultLimit, maxLimit);

                        expect(result.ok).toBe(false);
                        if (!result.ok) {
                                expect(result.error.field).toBe('limit');
                        }
                });
        });

        describe('Invalid offset', () => {
                it('should reject negative offset', () => {
                        const result = parsePagination('10', '-5', defaultLimit, maxLimit);

                        expect(result.ok).toBe(false);
                        if (!result.ok) {
                                expect(result.error.field).toBe('offset');
                        }
                });

                it('should reject non-numeric offset', () => {
                        const result = parsePagination('10', 'abc', defaultLimit, maxLimit);

                        expect(result.ok).toBe(false);
                        if (!result.ok) {
                                expect(result.error.field).toBe('offset');
                        }
                });

                it('should reject float offset', () => {
                        const result = parsePagination('10', '5.5', defaultLimit, maxLimit);

                        expect(result.ok).toBe(false);
                        if (!result.ok) {
                                expect(result.error.field).toBe('offset');
                        }
                });
        });
});

describe('buildPaginationMeta', () => {
        describe('With total count', () => {
                it('should include all pagination fields', () => {
                        const meta = buildPaginationMeta(100, 20, 0);

                        expect(meta.limit).toBe(20);
                        expect(meta.offset).toBe(0);
                        expect(meta.total).toBe(100);
                        expect(meta.hasMore).toBe(true);
                        expect(meta.page).toBe(1);
                        expect(meta.totalPages).toBe(5);
                });

                it('should calculate page correctly', () => {
                        expect(buildPaginationMeta(100, 20, 0).page).toBe(1);
                        expect(buildPaginationMeta(100, 20, 20).page).toBe(2);
                        expect(buildPaginationMeta(100, 20, 40).page).toBe(3);
                        expect(buildPaginationMeta(100, 20, 80).page).toBe(5);
                });

                it('should set hasMore correctly', () => {
                        expect(buildPaginationMeta(100, 20, 0).hasMore).toBe(true);
                        expect(buildPaginationMeta(100, 20, 60).hasMore).toBe(true);
                        expect(buildPaginationMeta(100, 20, 80).hasMore).toBe(false);
                        expect(buildPaginationMeta(100, 20, 100).hasMore).toBe(false);
                });

                it('should calculate totalPages correctly', () => {
                        expect(buildPaginationMeta(100, 20, 0).totalPages).toBe(5);
                        expect(buildPaginationMeta(95, 20, 0).totalPages).toBe(5);
                        expect(buildPaginationMeta(81, 20, 0).totalPages).toBe(5);
                        expect(buildPaginationMeta(80, 20, 0).totalPages).toBe(4);
                });
        });

        describe('Without total count', () => {
                it('should only include limit and offset', () => {
                        const meta = buildPaginationMeta(null, 20, 40);

                        expect(meta.limit).toBe(20);
                        expect(meta.offset).toBe(40);
                        expect(meta.total).toBeUndefined();
                        expect(meta.hasMore).toBeUndefined();
                        expect(meta.page).toBeUndefined();
                        expect(meta.totalPages).toBeUndefined();
                });
        });

        describe('Edge cases', () => {
                it('should handle empty result set', () => {
                        const meta = buildPaginationMeta(0, 20, 0);

                        expect(meta.total).toBe(0);
                        expect(meta.hasMore).toBe(false);
                        expect(meta.page).toBe(1);
                        expect(meta.totalPages).toBe(0);
                });

                it('should handle single page', () => {
                        const meta = buildPaginationMeta(15, 20, 0);

                        expect(meta.hasMore).toBe(false);
                        expect(meta.totalPages).toBe(1);
                });

                it('should handle exact page boundary', () => {
                        const meta = buildPaginationMeta(40, 20, 20);

                        expect(meta.hasMore).toBe(false);
                        expect(meta.page).toBe(2);
                        expect(meta.totalPages).toBe(2);
                });
        });
});
