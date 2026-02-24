---
name: QualityGate
description: >
  Sistema Integral de Calidad y Cierre — 9 fases (0-8) de auditoria exhaustiva
  adaptadas al stack Mini Market. Detecta anomalias silenciosas de IA (fantasmas,
  esqueletos, huerfanos, flujos rotos, env fantasma, imports muertos, rutas ciegas).
  Genera artefactos en .audit/ con veredicto binario final.
role: CODEX
version: 2.0.0
impact: CRITICAL
impact_legacy: 0
triggers:
  automatic:
  - orchestrator keyword match (QualityGate)
  manual:
  - QualityGate
  - cierre de proyecto
  - auditoria integral
  - calidad y cierre
  - quality gate completo
  - sistema de cierre
  - auditoria 9 fases
chain:
  receives_from: []
  sends_to:
  - DocuGuard
  required_before: []
priority: 10
---

# QualityGate Skill — Sistema Integral de Calidad y Cierre

**ROL:** CODEX (estado frio). Auditar con escepticismo por defecto. NO implementar fixes.
**FILOSOFIA:** "Se requiere evidencia directa del codigo fuente; nunca se asume que algo funciona porque deberia funcionar."

> Basado en el Sistema Integral de Calidad y Cierre de Proyectos v2.0.
> Adaptado al stack: React/Vite/TS + Supabase Edge Functions/Deno + PostgreSQL.

## Guardrails (Obligatorio)

1. NO imprimir secretos/JWTs (solo nombres).
2. NO usar comandos destructivos (`git reset --hard`, force-push, etc.).
3. Clasificar TODO como REAL / A CREAR / PROPUESTA FUTURA con evidencia.
4. Cada hallazgo incluye `archivo:linea`, severidad y accion concreta.
5. NO avanzar de fase hasta cumplir el criterio de salida de la fase actual.

## Principios de Diseno

| # | Principio | Definicion operativa |
|---|-----------|---------------------|
| 1 | **Escepticismo por defecto** | Evidencia directa del codigo; nunca asumir que funciona. |
| 2 | **Cobertura exhaustiva** | Todos los archivos, flujos y tests; omisiones requieren justificacion. |
| 3 | **Secuencialidad forzada** | Fases 0-8 en orden estricto; no avanzar sin criterio de salida. |
| 4 | **Accionabilidad total** | Cada hallazgo con `archivo:linea`, severidad y accion concreta. |
| 5 | **Trazabilidad completa** | Artefactos en `.audit/` con marca temporal. |

## Clasificacion de Severidad

```
CRITICO   — Bloquea despliegue. Resolver antes de continuar.
            Ej: secreto hardcodeado, funcion core vacia, flujo de pago sin logica.

ALTO      — No bloquea pero genera riesgo funcional significativo.
            Ej: ruta sin auth, test critico en skip, env fantasma en produccion.

MEDIO     — Degradacion de calidad o deuda tecnica relevante.
            Ej: modulo huerfano, dependencia no usada, README desalineado.

BAJO      — Mejora recomendada sin impacto funcional inmediato.
            Ej: TODO informativo, import ordenable, comentario desactualizado.
```

## Taxonomia de Anomalias Silenciosas de IA

| Tipo | Descripcion |
|------|-------------|
| **Fantasma** | Funcion documentada cuyo cuerpo esta vacio o solo tiene TODO/FIXME |
| **Esqueleto** | Funcion con firma completa sin logica de negocio (retorna null/[]/{}/""/0/false) |
| **Huerfano** | Modulo funcional que nunca es importado ni invocado |
| **Flujo Roto** | Piezas que funcionan aisladas pero fallan al conectarse end-to-end |
| **Env Fantasma** | Variable de entorno referenciada pero no definida en .env ni deploy |
| **Import Muerto** | Dependencia en package.json que no se usa en ningun archivo fuente |
| **Ruta Ciega** | Ruta en router que apunta a componente inexistente o placeholder vacio |

## Protocolo de Inicio (Auto-Deteccion)

```
Existe .audit/ ?
  NO  -> INICIAR auditoria desde Fase 0 (crear directorio)
  SI  -> Existe FINAL_REPORT.md ?
           NO  -> CONTINUAR desde ultima fase (leer .phase_marker)
           SI  -> MODO REVISION: presentar resumen y preguntar accion
```

## Protocolo de Ejecucion: Las 9 Fases

---

### FASE 0 — Mapeo Total del Proyecto

**Objetivo:** Inventario cruzado completo: documentado vs implementado vs invocado.

**Acciones concretas (adaptadas al proyecto):**

1. Generar arbol completo (excluir `node_modules`, `.git`, `dist`, `coverage`, `.audit`):
   ```bash
   find . -type f \
     -not -path "./node_modules/*" -not -path "./.git/*" \
     -not -path "./dist/*" -not -path "./.audit/*" \
     -not -path "./coverage/*" -not -path "./minimarket-system/node_modules/*" \
     | sort > .audit/FILE_INVENTORY.txt
   ```

2. Extraer de `README.md`, `docs/ESTADO_ACTUAL.md` y `docs/API_README.md` la lista de funcionalidades prometidas.

3. Listar funciones/endpoints exportados:
   - Edge Functions: `supabase/functions/*/index.ts`
   - Frontend pages: `minimarket-system/src/pages/*.tsx`
   - Hooks: `minimarket-system/src/hooks/**/*.ts`
   - API handlers: `supabase/functions/api-minimarket/handlers/*.ts`

4. Construir **Matriz de Cruce**:
   ```
   | Funcionalidad     | Documentada | Implementada | Invocada   |
   |-------------------|-------------|--------------|------------|
   | Login usuario     | OK          | OK           | OK         |
   | Reset password    | OK          | Esqueleto    | OK         |
   | Export CSV        | OK          | Fantasma     | NO         |
   ```

5. Registrar todo huerfano, fantasma y esqueleto detectado.

**Artefacto:** `.audit/FILE_INVENTORY.txt`
**Criterio de salida:** Matriz completa; cada funcionalidad documentada tiene estado verificado.

---

### FASE 1 — Auditoria de Codigo Fuente

**Objetivo:** Identificar implementaciones incompletas, marcadores pendientes, referencias rotas.

**Acciones concretas:**

1. Buscar marcadores pendientes:
   ```bash
   grep -rn "TODO\|FIXME\|HACK\|XXX\|PLACEHOLDER\|TEMP\|STUB" \
     minimarket-system/src/ supabase/functions/ scripts/ \
     --include="*.ts" --include="*.tsx" --include="*.js" --include="*.mjs" \
     > .audit/SOURCE_AUDIT.txt 2>/dev/null
   ```

2. Detectar funciones con cuerpo vacio o que solo retornan valores por defecto.

3. Identificar imports no utilizados.

4. Verificar variables referenciadas pero no definidas.

5. Buscar bloques `catch` vacios o que solo contienen `console.log`/`console.error`:
   ```bash
   grep -rn "catch" minimarket-system/src/ supabase/functions/ \
     --include="*.ts" --include="*.tsx" -A3 | grep -E "console\.(log|error)|^\s*\}" \
     > .audit/CATCH_ANALYSIS.txt 2>/dev/null
   ```

6. Detectar codigo comentado extenso (>5 lineas consecutivas).

**Artefacto:** `.audit/SOURCE_AUDIT.txt`
**Criterio de salida:** Cero hallazgos CRITICO pendientes; todos clasificados con `archivo:linea`.

---

### FASE 2 — Auditoria de Flujos Funcionales

**Objetivo:** Trazar de extremo a extremo cada proceso de negocio del minimarket.

**Acciones concretas:**

1. Listar flujos core del minimarket:
   - Login -> Dashboard -> Inventario
   - Ingreso de mercaderia (deposito)
   - Venta (POS) -> Facturacion
   - Gestion de proveedores + precios
   - Alertas de stock / vencimientos
   - Cron jobs (scraping, notificaciones, reportes)
   - Cuaderno inteligente

2. Para cada flujo, trazar la cadena completa:
   - Punto de entrada (ruta frontend / endpoint API)
   - Middleware y validaciones (auth, RLS, rate limit)
   - Logica de negocio (handler / Edge Function)
   - Interacciones con Supabase (queries, RPCs)
   - Respuesta o renderizado final

3. Verificar contratos entre frontend (`apiClient.ts`) y backend (`api-minimarket/index.ts`).

4. Identificar flujos rotos donde un modulo espera un formato que otro no proporciona.

5. Verificar manejo de errores en cada punto de la cadena.

**Artefacto:** `.audit/FLOW_TRACES.txt`
**Criterio de salida:** Todos los flujos trazados; cada ruptura documentada con severidad.

---

### FASE 3 — Auditoria de Tests

**Objetivo:** Ejecutar suite completa y verificar cobertura real (no decorativa).

**Acciones concretas:**

1. Ejecutar suite completa:
   ```bash
   npx vitest run --reporter=verbose 2>&1 | tee .audit/TEST_RESULTS.txt
   ```

2. Registrar resultado de cada test: PASS / FAIL / SKIP.

3. Para cada test omitido (`skip`, `xit`, `xdescribe`, `test.skip`):
   ```bash
   grep -rn "\.skip\|xit\|xdescribe\|test\.skip\|it\.skip\|describe\.skip" \
     tests/ minimarket-system/src/ \
     --include="*.test.*" --include="*.spec.*" \
     > .audit/SKIPPED_TESTS.txt 2>/dev/null
   ```

4. Verificar que tests no sean triviales (`expect(true).toBe(true)`).

5. Identificar funcionalidades criticas sin cobertura.

6. Registrar cobertura global y por archivo:
   ```bash
   npx vitest run --coverage 2>&1 | tee -a .audit/TEST_RESULTS.txt
   ```

**Artefacto:** `.audit/TEST_RESULTS.txt`
**Criterio de salida:** Suite ejecutada sin fallos; cada skip justificado; criticos con cobertura.

---

### FASE 4 — Integraciones y Dependencias

**Objetivo:** Coherencia entre dependencias declaradas, usadas y servicios externos.

**Acciones concretas:**

1. Cruzar dependencias (raiz + minimarket-system):
   ```bash
   cat package.json | npx -y json dependencies devDependencies > .audit/DECLARED_DEPS_ROOT.txt 2>/dev/null
   cat minimarket-system/package.json | npx -y json dependencies devDependencies > .audit/DECLARED_DEPS_FRONTEND.txt 2>/dev/null
   grep -rh "from '" minimarket-system/src/ supabase/functions/ \
     --include="*.ts" --include="*.tsx" | sort -u > .audit/USED_IMPORTS.txt
   ```

2. Identificar **dependencias fantasma** (declaradas no usadas) y **faltantes** (usadas no declaradas).

3. Validar esquema de base de datos:
   - Verificar migraciones sincronizadas con `docs/ESQUEMA_BASE_DATOS_ACTUAL.md`.
   - Confirmar campos referenciados en codigo existen en esquema.

4. Verificar variables de entorno:
   ```bash
   # Frontend
   grep -roh "import\.meta\.env\.\w\+" minimarket-system/src/ 2>/dev/null | sort -u > .audit/ENV_REFERENCED_FRONTEND.txt
   # Backend (Deno)
   grep -roh "Deno\.env\.get(\"\w\+\")" supabase/functions/ 2>/dev/null | sort -u > .audit/ENV_REFERENCED_BACKEND.txt
   # Definidas
   cat .env.example 2>/dev/null | grep -v "^#" | grep -v "^$" | cut -d= -f1 | sort -u > .audit/ENV_DEFINED.txt
   cat .env.test.example 2>/dev/null | grep -v "^#" | grep -v "^$" | cut -d= -f1 | sort -u >> .audit/ENV_DEFINED.txt
   sort -u -o .audit/ENV_DEFINED.txt .audit/ENV_DEFINED.txt
   ```

5. Verificar integraciones externas (Supabase, Cloudflare Pages, SendGrid).

**Artefacto:** `.audit/DEPENDENCIES_AUDIT.txt`, `.audit/ENV_MISSING.txt`
**Criterio de salida:** Cero dependencias fantasma criticas; cero env vars faltantes para produccion.

---

### FASE 5 — UI y Routing

**Objetivo:** Cada ruta tiene componente real renderizable; cero componentes inalcanzables.

**Acciones concretas:**

1. Extraer rutas del router:
   ```bash
   grep -n "path\|element\|Route" minimarket-system/src/App.tsx > .audit/ROUTING_AUDIT.txt 2>/dev/null
   ```

2. Para cada ruta verificar:
   - Componente referenciado existe como archivo.
   - Componente tiene contenido renderizable real (no placeholder).
   - Props requeridas son suministradas.

3. Identificar **componentes huerfanos** (definidos pero sin ruta ni import).

4. Verificar `ProtectedRoute` en rutas que requieren autenticacion.

5. Comprobar rutas de error (404, 500).

**Artefacto:** `.audit/ROUTING_AUDIT.txt`
**Criterio de salida:** Cada ruta con componente funcional; guards verificados; rutas de error implementadas.

---

### FASE 6 — Seguridad Basica

**Objetivo:** Escanear vulnerabilidades comunes que agentes de IA introducen frecuentemente.

**Acciones concretas:**

1. Buscar secretos hardcodeados:
   ```bash
   grep -rn "password\s*=\|secret\s*=\|api_key\s*=\|token\s*=" \
     minimarket-system/src/ supabase/functions/ \
     --include="*.ts" --include="*.tsx" \
     | grep -v "process\.env\|Deno\.env\|import\.meta\.env\|config\.\|example\|test\|mock\|placeholder\|type\|interface" \
     > .audit/HARDCODED_SECRETS.txt 2>/dev/null
   ```

2. Buscar JWTs hardcodeados (patron del proyecto):
   ```bash
   grep -rE "ey[A-Za-z0-9\-_=]{20,}" \
     minimarket-system/src/ supabase/functions/ \
     --include="*.ts" --include="*.tsx" \
     > .audit/HARDCODED_JWTS.txt 2>/dev/null
   ```

3. Validar `.gitignore`: `.env`, `node_modules/`, `dist/`, `.audit/`, credenciales.

4. Verificar RLS en migraciones:
   ```bash
   echo "=== Tables Created ===" > .audit/SECURITY_AUDIT.txt
   grep -c "CREATE TABLE" supabase/migrations/*.sql >> .audit/SECURITY_AUDIT.txt 2>/dev/null
   echo "=== RLS Enabled ===" >> .audit/SECURITY_AUDIT.txt
   grep -c "ENABLE ROW LEVEL SECURITY" supabase/migrations/*.sql >> .audit/SECURITY_AUDIT.txt 2>/dev/null
   ```

5. Verificar auth en endpoints sensibles (cron jobs con Authorization header — HC-1).

6. Ejecutar npm audit:
   ```bash
   npm audit --production 2>&1 | tee .audit/NPM_AUDIT.txt
   ```

**Artefacto:** `.audit/SECURITY_AUDIT.txt`, `.audit/NPM_AUDIT.txt`
**Criterio de salida:** Cero secretos hardcodeados; `.gitignore` validado; RLS verificado; HC-1 verificado.

---

### FASE 7 — Consistencia Documental

**Objetivo:** Documentacion refleja fielmente el estado real del codigo.

**Acciones concretas:**

1. Cruzar `README.md` contra codigo:
   - Verificar comandos documentados (instalacion, ejecucion, tests) funcionan.
   - Confirmar funcionalidades listadas vs Matriz de Cruce (Fase 0).

2. Cruzar `docs/ESTADO_ACTUAL.md`:
   - Verificar conteos de tests, migraciones, Edge Functions.
   - Confirmar fecha de referencia no es stale (>14 dias).

3. Cruzar `docs/API_README.md` contra endpoints reales en `api-minimarket/index.ts`.

4. Cruzar `docs/ESQUEMA_BASE_DATOS_ACTUAL.md` contra migraciones reales.

5. Catalogar TODO/FIXME/HACK de Fase 1:
   - Clasificar: deuda tecnica aceptable vs bloqueos reales.

6. Verificar `docs/closure/OPEN_ISSUES.md` actualizado.

**Artefacto:** `.audit/DOC_CONSISTENCY.txt`
**Criterio de salida:** README ejecutable; cero discrepancias criticas docs-vs-codigo.

---

### FASE 8 — Generacion del Reporte Final

**Objetivo:** Consolidar hallazgos en reporte con veredicto binario y plan de accion.

**Acciones concretas:**

1. Recopilar todos los artefactos de `.audit/`.

2. Consolidar en `FINAL_REPORT.md`:
   - Resumen ejecutivo con metricas clave.
   - Tabla de hallazgos por fase con severidad, ubicacion y accion.
   - Veredicto binario.
   - Plan de accion priorizado.

3. Regla de veredicto:
   ```
   APROBADO:
     0 hallazgos CRITICO
     0 hallazgos ALTO sin justificacion documentada
     Suite de tests ejecutada sin fallos

   REQUIERE ACCION:
     Cualquier condicion anterior no satisfecha
   ```

**Artefacto:** `.audit/FINAL_REPORT.md`
**Criterio de salida:** Reporte entregado con veredicto binario y plan de accion.

---

## Estructura del Directorio .audit/

```
.audit/
├── FILE_INVENTORY.txt        <- Fase 0
├── SOURCE_AUDIT.txt          <- Fase 1
├── CATCH_ANALYSIS.txt        <- Fase 1
├── FLOW_TRACES.txt           <- Fase 2
├── TEST_RESULTS.txt          <- Fase 3
├── SKIPPED_TESTS.txt         <- Fase 3
├── DEPENDENCIES_AUDIT.txt    <- Fase 4
├── DECLARED_DEPS_ROOT.txt    <- Fase 4
├── DECLARED_DEPS_FRONTEND.txt <- Fase 4
├── USED_IMPORTS.txt          <- Fase 4
├── ENV_REFERENCED_FRONTEND.txt <- Fase 4
├── ENV_REFERENCED_BACKEND.txt  <- Fase 4
├── ENV_DEFINED.txt           <- Fase 4
├── ENV_MISSING.txt           <- Fase 4
├── ROUTING_AUDIT.txt         <- Fase 5
├── SECURITY_AUDIT.txt        <- Fase 6
├── HARDCODED_SECRETS.txt     <- Fase 6
├── HARDCODED_JWTS.txt        <- Fase 6
├── NPM_AUDIT.txt             <- Fase 6
├── DOC_CONSISTENCY.txt       <- Fase 7
├── FINAL_REPORT.md           <- Fase 8
└── .phase_marker             <- Control interno
```

## Marcador de Fase (.audit/.phase_marker)

```
LAST_COMPLETED_PHASE=4
TIMESTAMP=2026-02-24T14:30:00Z
AUDITOR=claude-code
NOTES=Auditoria en progreso. Fases 0-4 completadas.
```

Actualizar `.phase_marker` al completar cada fase.

## Flujo Combinado con Otras Herramientas

| Etapa | Fases | Herramienta | Accion |
|-------|-------|-------------|--------|
| 1. Auditoria Estructural | 0-4 | Claude Code | Mapeo, codigo, flujos, tests, deps |
| 2. Analisis Semantico | — | Copilot / Codex | Correcciones propuestas para CRITICO/ALTO |
| 3. Auditoria Final | 5-8 | Claude Code | UI, seguridad, docs, reporte |
| 4. Verificacion | — | Copilot + Claude | Aplicar fixes y re-auditar items criticos |

## Reglas de Automatizacion

1. Ejecutar las 9 fases en secuencia estricta sin pedir confirmacion.
2. Si un comando falla: registrar error y continuar; NO bloquear auditoria.
3. Generar artefacto de cada fase antes de avanzar.
4. Si >5 hallazgos CRITICO: emitir alerta temprana sin detener la auditoria.
5. FINAL_REPORT.md se genera solo al completar Fase 8.

## Anti-Loop / Stop-Conditions

**SI no hay entorno de ejecucion (npm/pnpm no disponible):**
1. Ejecutar fases estaticas (0, 1, 2, 5, 6, 7) con analisis de codigo.
2. Marcar fases de ejecucion (3, 4) como BLOCKED.
3. Generar reporte parcial.

**SI >20 hallazgos CRITICO:**
1. Generar reporte inmediatamente.
2. Veredicto: REQUIERE ACCION.
3. Recomendar priorizacion por severidad + impacto de negocio.

**NUNCA:** Emitir veredicto APROBADO si existe algun hallazgo CRITICO sin resolver.

## Quality Gates del Skill

- [ ] Las 9 fases ejecutadas (o justificadas como BLOCKED).
- [ ] Cada hallazgo tiene archivo:linea + severidad + accion.
- [ ] .phase_marker actualizado en cada transicion.
- [ ] FINAL_REPORT.md generado con veredicto binario.
- [ ] Plan de accion priorizado si veredicto = REQUIERE ACCION.

## Relacion con Skills Existentes

| Skill existente | Complementariedad |
|-----------------|-------------------|
| ProductionGate | QualityGate es mas profundo (9 fases vs 18 gates rapidos). ProductionGate = pre-deploy rapido. QualityGate = cierre exhaustivo. |
| RealityCheck | RealityCheck focaliza UX/usabilidad. QualityGate cubre anomalias silenciosas de IA + trazabilidad completa. |
| SecurityAudit | SecurityAudit es profundo en seguridad. QualityGate Fase 6 = escaneo basico. Para seguridad profunda, usar SecurityAudit. |
| TestMaster | TestMaster ejecuta y verifica tests. QualityGate Fase 3 = auditoria de tests (cobertura real, skips, triviales). |
| DocuGuard | DocuGuard sincroniza docs. QualityGate Fase 7 = verificar consistencia documental. |
