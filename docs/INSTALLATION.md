# Installation Guide

Estado: Activo
Audiencia: Tecnico interno
Ultima actualizacion: 2026-02-21
Fuente de verdad: docs/ESTADO_ACTUAL.md
Owner documental: Infra + Desarrollo

> Referencia factual: segun FactPack 2026-02-21.

## Objetivo
Dejar el entorno listo para desarrollo, pruebas y validacion operativa sin configuraciones ambiguas.

## Procedimiento Paso A Paso
### 1) Requisitos previos
- Node.js 20+
- npm (incluido con Node)
- pnpm 9+
- Supabase CLI
- Deno (para tareas/validaciones Edge Function)

### 2) Clonar e instalar
```bash
git clone <repo-url>
cd aidrive_genspark
npm install
pnpm -C minimarket-system install --prefer-offline
```

### 3) Configurar entorno
Backend/raiz:
```bash
cp .env.example .env
```

Frontend:
```bash
cp minimarket-system/.env.example minimarket-system/.env
```

Tests integracion/E2E:
```bash
cp .env.test.example .env.test
```

### 4) Levantar frontend local
```bash
pnpm -C minimarket-system dev
```

### 5) Setup completo (opcional)
```bash
# flujo asistido de setup
bash setup.sh

# o variantes
bash setup.sh dev
bash setup.sh prod
```

### 6) Supabase local (si aplica)
```bash
supabase start
supabase status
```

### 7) Migraciones y datos
```bash
# estado de migraciones
bash migrate.sh status

# aplicar migraciones
bash migrate.sh up

# seed opcional
bash migrate.sh seed
```

## Variables Clave
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_API_GATEWAY_URL`
- `API_PROVEEDOR_SECRET`
- `ALLOWED_ORIGINS`

## Errores Comunes
| Error | Causa | Solucion |
|---|---|---|
| `supabase: command not found` | CLI no instalada | Instalar Supabase CLI |
| Frontend no conecta | `.env` faltante o incompleto | Revisar `minimarket-system/.env` |
| Integracion no corre | `.env.test` ausente | Copiar y completar `.env.test` |
| `401/403` en funciones | token/rol/headers invalidos | Reautenticar y validar variables |

## Verificacion
Verificacion minima de instalacion:
```bash
pnpm -C minimarket-system lint
pnpm -C minimarket-system build
npm run test:unit
bash scripts/run-integration-tests.sh --dry-run
bash scripts/run-e2e-tests.sh --dry-run
node scripts/validate-doc-links.mjs
```

## Escalacion
1. Guardar salida del comando fallido.
2. Comparar con `docs/TROUBLESHOOTING.md`.
3. Escalar a soporte tecnico con:
   - comando ejecutado
   - error exacto
   - SO/versión de Node/pnpm
