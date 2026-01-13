# Suites de pruebas

## Qué hay
- `tests/unit/` (Vitest) — obligatoria en CI.
- `tests/performance/` (Vitest mock) — habilitar con `npm run test:performance`.
- `tests/security/` (Vitest mock) — habilitar con `npm run test:security`.
- `tests/api-contracts/` (Vitest mock) — habilitar con `npm run test:contracts`.
- Archivos `*.test.js` en estas carpetas son legacy Jest y no se ejecutan por defecto.

## Cómo ejecutarlas (sin red ni credenciales)
```bash
npm run test:auxiliary   # performance + security + contracts (mock)
```

## Pruebas reales (requieren credenciales, fuera de CI)
```bash
RUN_REAL_TESTS=true SUPABASE_URL=... SUPABASE_ANON_KEY=... API_PROVEEDOR_SECRET=... npm run test:performance
RUN_REAL_TESTS=true SUPABASE_URL=... SUPABASE_ANON_KEY=... API_PROVEEDOR_SECRET=... npm run test:security
RUN_REAL_TESTS=true SUPABASE_URL=... SUPABASE_ANON_KEY=... API_PROVEEDOR_SECRET=... npm run test:contracts
```

## Notas
- No hay llamadas de red en modo por defecto (RUN_REAL_TESTS != true).
- CI solo corre unit tests y suites auxiliares si se invocan explícitamente.
