# RealityCheck Report

- Fecha: `2026-02-19`
- Scope: `full` (frontend UX operativo + navegación + interacción IA asistida)
- Depth: `deep`
- Focus: `ux`
- Método: análisis estático del código actual (sin sesión de navegador en vivo en esta pasada).

## Clasificación REAL / A CREAR / PROPUESTA

| Elemento | Estado | Evidencia |
|---|---|---|
| Dashboard base con métricas y estados de error | REAL | `minimarket-system/src/pages/Dashboard.tsx` |
| ErrorMessage estandarizado en páginas funcionales | REAL | `minimarket-system/src/pages/*.tsx` |
| Quick actions en búsqueda global | REAL | `minimarket-system/src/components/GlobalSearch.tsx` |
| Alertas proactivas con CTA accionables | REAL | `minimarket-system/src/components/AlertsDrawer.tsx` |
| Flujo IA guiado para usuario no técnico (sin prompt libre) | A CREAR | no existe ruta dedicada en `minimarket-system/src/App.tsx` |
| Onboarding silencioso primer uso | A CREAR | no hay implementación en `minimarket-system/src` |
| Navegación simplificada para móvil bajo presión | A CREAR | `minimarket-system/src/components/Layout.tsx` |
| Modo simple operativo (1 toque por tarea crítica) | A CREAR | dashboard actual sin hub de acciones |
| Medición de adopción UX por flujo | PROPUESTA FUTURA | no hay telemetría UX específica |

## Hallazgos (ordenados por severidad)

### P0

1. Métricas del dashboard potencialmente inexactas para operación real.
   - Evidencia:
     - `minimarket-system/src/hooks/queries/useDashboardStats.ts:24` (`limit(5)` en tareas).
     - `minimarket-system/src/hooks/queries/useDashboardStats.ts:36` (`limit(100)` en stock).
     - `minimarket-system/src/pages/Dashboard.tsx:113` (`tareasPendientes.length` mostrado como total).
   - Impacto: erosiona confianza del jefe en el sistema.

2. Acceso a POS/Pocket no visible en navegación principal pese a rutas existentes.
   - Evidencia:
     - rutas presentes: `minimarket-system/src/App.tsx:170`, `minimarket-system/src/App.tsx:179`.
     - menú principal sin `/pos` ni `/pocket`: `minimarket-system/src/components/Layout.tsx:25`.
   - Impacto: aumenta fricción en la tarea más frecuente (vender).

3. Navegación móvil saturada para usuario no técnico.
   - Evidencia:
     - 11 ítems de navegación: `minimarket-system/src/components/Layout.tsx:25`.
     - barra móvil `grid-cols-8`: `minimarket-system/src/components/Layout.tsx:268`.
   - Impacto: decisiones lentas, taps erróneos, abandono.

### P1

1. Skeleton loading incompleto (6/15 páginas).
   - Evidencia: faltan en `Clientes.tsx`, `Deposito.tsx`, `Kardex.tsx`, `Login.tsx`, `Pocket.tsx`, `Proveedores.tsx`, `Rentabilidad.tsx`, `Ventas.tsx`.
   - Impacto: percepción de lentitud/inestabilidad.

2. Interacción IA parcial para no técnicos.
   - Evidencia:
     - existe `insightsApi` y `searchApi`: `minimarket-system/src/lib/apiClient.ts:739`, `minimarket-system/src/lib/apiClient.ts:907`.
     - no existe pantalla de asistente ni flujo guiado por “preguntas típicas”.
   - Impacto: usuario no sabe qué preguntar ni qué acción tomar.

3. Error copy mejorable para soporte operativo.
   - Evidencia:
     - parser depende de `includes(...)` por texto: `minimarket-system/src/components/errorMessageUtils.ts:32`.
     - en producción puede devolver mensajes backend sin normalizar por `code/status`: `minimarket-system/src/components/errorMessageUtils.ts:27`.
   - Impacto: mensajes inconsistentes bajo estrés.

4. Formato monetario inconsistente en pedidos.
   - Evidencia:
     - `minimarket-system/src/pages/Pedidos.tsx:222` usa `toLocaleString()` sin locale explícito.
   - Impacto: lectura ambigua según navegador/dispositivo.

### P2

1. Flujo de búsqueda depende de modal + query >= 2 caracteres.
   - Evidencia:
     - search habilita con `query.length >= 2`: `minimarket-system/src/hooks/useGlobalSearch.ts:8`.
   - Impacto: operador no técnico puede no descubrir funcionalidades clave si no usa búsqueda.

2. Logout y errores de auth con feedback mejorable.
   - Evidencia:
     - `console.error` en signOut: `minimarket-system/src/components/Layout.tsx:88`.
   - Impacto: menor claridad en fallos de cierre de sesión.

## Validación HC-1 / HC-2 / HC-3

- HC-1 cron auth: PASS.
  - Evidencia: `supabase/migrations/20260211055140_fix_cron_jobs_auth_and_maintenance.sql`.
- HC-2 deploy safety: PASS.
  - Evidencia: `deploy.sh` filtra `_shared` y usa `--no-verify-jwt` para `api-minimarket`.
- HC-3 mutaciones silenciosas: PASS.
  - Evidencia: no hay `console.error` sin feedback visual en páginas productivas.

## Score UX Actual

- Score UX operativo estimado: `72/100`.
- Lectura: técnicamente estable, pero con fricciones de adopción para usuario no técnico en navegación y acceso a tareas críticas.

## Recomendación Ejecutiva

1. Priorizar primero exactitud de métricas + navegación operativa (P0).
2. Segundo, completar Skeleton y estandarización de mensajes (P1).
3. Tercero, implementar asistente IA guiado por chips y CTA (P1 estratégico).
