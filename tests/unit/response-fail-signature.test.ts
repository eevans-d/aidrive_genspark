import { describe, it, expect } from 'vitest';
import { fail } from '../../supabase/functions/_shared/response.ts';

describe('response.fail() signature resolution', () => {
  it('uses current signature (headers + options)', async () => {
    const res = fail('X', 'Y', 400, { 'x-foo': 'bar' }, { requestId: 'rid' });

    expect(res.headers.get('x-foo')).toBe('bar');
    expect(res.headers.get('content-type')).toContain('application/json');

    const body = await res.json();
    expect(body.requestId).toBe('rid');
    expect(body.error.details).toBeUndefined();
  });

  it('supports legacy signature (details + headers)', async () => {
    const res = fail('X', 'Y', 400, { foo: 'bar' }, { 'x-foo': 'bar' });

    expect(res.headers.get('x-foo')).toBe('bar');

    const body = await res.json();
    expect(body.error.details).toEqual({ foo: 'bar' });
  });
});
