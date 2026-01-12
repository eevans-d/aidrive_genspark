/**
 * Pagination helpers for api-minimarket.
 */

import { parsePositiveInt, parseNonNegativeInt } from './validation.ts';

export type PaginationParams = {
  limit: number;
  offset: number;
};

export type PaginationError = {
  field: 'limit' | 'offset';
  message: string;
};

export type PaginationResult =
  | { ok: true; params: PaginationParams }
  | { ok: false; error: PaginationError };

/**
 * Parse and validate pagination parameters.
 *
 * @param limitParam - Raw limit string from query params
 * @param offsetParam - Raw offset string from query params
 * @param defaultLimit - Default limit if not provided
 * @param maxLimit - Maximum allowed limit
 * @returns Validated pagination params or error
 */
export function parsePagination(
  limitParam: string | null,
  offsetParam: string | null,
  defaultLimit: number,
  maxLimit: number,
): PaginationResult {
  // Parse limit
  let limit: number;
  if (limitParam === null || limitParam === '') {
    limit = defaultLimit;
  } else {
    const parsed = parsePositiveInt(limitParam);
    if (parsed === null) {
      return {
        ok: false,
        error: { field: 'limit', message: 'limit debe ser un entero > 0' },
      };
    }
    limit = parsed;
  }

  // Parse offset
  let offset: number;
  if (offsetParam === null || offsetParam === '') {
    offset = 0;
  } else {
    const parsed = parseNonNegativeInt(offsetParam);
    if (parsed === null) {
      return {
        ok: false,
        error: { field: 'offset', message: 'offset debe ser un entero >= 0' },
      };
    }
    offset = parsed;
  }

  return {
    ok: true,
    params: {
      limit: Math.min(limit, maxLimit),
      offset,
    },
  };
}

/**
 * Build pagination info for response metadata.
 */
export function buildPaginationMeta(
  totalCount: number | null,
  limit: number,
  offset: number,
): Record<string, unknown> {
  const meta: Record<string, unknown> = {
    limit,
    offset,
  };

  if (totalCount !== null) {
    meta.total = totalCount;
    meta.hasMore = offset + limit < totalCount;
    meta.page = Math.floor(offset / limit) + 1;
    meta.totalPages = Math.ceil(totalCount / limit);
  }

  return meta;
}
