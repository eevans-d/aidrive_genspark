import { describe, it, expect } from 'vitest';
import { extractTrustedRole } from '../../supabase/functions/api-assistant/auth';

describe('api-assistant auth role extraction', () => {
  it('uses app_metadata.role as the trusted source', () => {
    const role = extractTrustedRole({
      app_metadata: { role: 'admin' },
      user_metadata: { role: 'ventas' },
    });

    expect(role).toBe('admin');
  });

  it('ignores user_metadata.role when app_metadata.role is missing', () => {
    const role = extractTrustedRole({
      app_metadata: {},
      user_metadata: { role: 'admin' },
    });

    expect(role).toBe('usuario');
  });

  it('normalizes role aliases to canonical values', () => {
    expect(extractTrustedRole({ app_metadata: { role: 'Administrador' } })).toBe('admin');
    expect(extractTrustedRole({ app_metadata: { role: 'warehouse' } })).toBe('deposito');
    expect(extractTrustedRole({ app_metadata: { role: 'sales' } })).toBe('ventas');
  });
});

