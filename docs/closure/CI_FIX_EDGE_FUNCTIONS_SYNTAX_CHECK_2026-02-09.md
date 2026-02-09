# CI Fix — Edge Functions Syntax Check (Deno)

Fecha: 2026-02-09

Contexto: el PR `#33` quedó **UNSTABLE** por fallar el check de GitHub Actions **"Edge Functions Syntax Check"**, que ejecuta `deno check --no-lock` sobre `supabase/functions/*/index.ts`.

Objetivo: corregir errores de type-checking (Deno/TS) con cambios mínimos y verificables, sin alterar comportamiento runtime.

---

## Evidencia del fallo (extracto)

Comando:

```bash
gh pr checks 33
```

Log (extracto relevante):

```text
TS2345 [ERROR]: Argument of type 'HeadersInit' is not assignable to parameter of type 'Record<string, string>'.
  at file:///.../supabase/functions/api-minimarket/handlers/pedidos.ts:198:83
  at file:///.../supabase/functions/api-minimarket/handlers/pedidos.ts:276:84
  at file:///.../supabase/functions/api-minimarket/handlers/pedidos.ts:320:90
  at file:///.../supabase/functions/api-minimarket/handlers/pedidos.ts:350:74
  at file:///.../supabase/functions/api-minimarket/handlers/pedidos.ts:367:84

TS2345 [ERROR]: Argument of type 'string | undefined' is not assignable to parameter of type 'string'.
  at file:///.../supabase/functions/api-minimarket/index.ts:320:35
  at file:///.../supabase/functions/api-minimarket/index.ts:328:11
  at file:///.../supabase/functions/api-minimarket/index.ts:388:27

TS2352 [ERROR]: Conversion of type 'Record<string, unknown>' to type 'CreatePedidoPayload' may be a mistake...
  at file:///.../supabase/functions/api-minimarket/index.ts:1748:10

Found 9 errors.
error: Type checking failed.
```

---

## Fix aplicado (mínimo)

Archivos tocados:
- `supabase/functions/api-minimarket/handlers/pedidos.ts`
  - Ajuste de typing: `headers: HeadersInit` → `headers: Record<string, string>` (alineado con helpers PostgREST que esperan header-object serializable).
- `supabase/functions/api-minimarket/index.ts`
  - Congelar config validada para closures: `supabaseUrlStr` / `supabaseAnonKeyStr` (evita que TS trate `supabaseUrl`/`supabaseAnonKey` como `string | undefined` dentro de funciones anidadas).
  - `createRequestHeaders(token ?? null, ...)` para evitar `undefined`.
  - Cast explícito: `bodyResult as unknown as Parameters<typeof handleCrearPedido>[4]` (Deno TS2352).

---

## Validación local (post-fix)

```bash
npm run test:unit
```

Resultado: **PASS** (44 test files, 785 tests).

