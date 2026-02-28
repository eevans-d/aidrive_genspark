# CONTEXT PROMPT ENGINEERING — CLAUDE CODE (OCR NUEVOS + CONTINUIDAD)
## Proyecto: `aidrive_genspark`
## Fecha de referencia: 2026-02-28
## Objetivo: revisar, analizar y procesar el lote nuevo de imágenes OCR; ajustar detalles documentales; continuar ejecución sin perder contexto.

---

## INSTRUCCION MAESTRA (COPIAR TAL CUAL EN CLAUDE CODE)
Actua como ingeniero tecnico senior, orientado a evidencia y ejecución.

Debes:
1. Verificar estado real del repo (no asumir).
2. Procesar el lote de imágenes nuevas en `proveedores_facturas_temp/nuevos`.
3. Ajustar cualquier detalle pendiente que contradiga el estado canónico actual.
4. Dejar continuidad lista para la siguiente sesión (plan de siguiente paso + artefactos).

No respondas con teoría: ejecuta y deja evidencia reproducible.

---

## GUARDRAILS OBLIGATORIOS
1. No imprimir secretos/JWT/tokens/API keys (solo NOMBRES de variables).
2. No usar comandos git destructivos (`git reset --hard`, `git checkout -- <file>`, force-push).
3. Mantener `api-minimarket` con `verify_jwt=false` si llegas a redeployar (usar `--no-verify-jwt`).
4. No borrar imágenes originales del usuario; solo clasificar/ignorar duplicados.
5. Todo hallazgo debe incluir evidencia (`archivo:linea` o salida CLI concreta).

---

## CONTEXTO ANCLA YA CONFIRMADO (NO RE-DISCUTIR, SOLO VERIFICAR)
1. Plan OCR activo/canónico:
   - `docs/PLAN_FUSIONADO_FACTURAS_OCR.md`
2. Planes deprecados movidos a archivo histórico:
   - `docs/archive/planes-deprecados/PLAN_FACTURAS_OCR.md`
   - `docs/archive/planes-deprecados/PLAN_MAESTRO_OCR_FACTURAS.md`
   - `docs/archive/planes-deprecados/HOJA_RUTA_ACTUALIZADA_2026-02-08.md`
3. Lote nuevo detectado:
   - Ruta: `proveedores_facturas_temp/nuevos`
   - Imágenes útiles: 22 `.jpg`
   - Sidecars `:Zone.Identifier`: presentes (ignorar)
   - Duplicado exacto detectado: `20260227_211205.jpg` y `20260227_211205 (1).jpg`
4. Gaps OCR abiertos y priorizados:
   - `docs/closure/OPEN_ISSUES.md` (OCR-001..OCR-006)

---

## FUENTES DE VERDAD (ORDEN)
1. `docs/ESTADO_ACTUAL.md`
2. `docs/DECISION_LOG.md`
3. `docs/closure/OPEN_ISSUES.md`
4. `docs/API_README.md`
5. `docs/PLAN_FUSIONADO_FACTURAS_OCR.md`
6. `docs/archive/planes-deprecados/README.md`

Si hay conflicto, prevalece código + fuentes en ese orden.

---

## PROTOCOLO DE EJECUCION (ORDEN ESTRICTO)

### Fase 0 — Baseline de sesión
Ejecuta y registra:
```bash
git status --short
git rev-parse --short HEAD
date -u +"%Y-%m-%d %H:%M:%S UTC"
```

Además:
```bash
ls docs | rg '^PLAN|HOJA_RUTA'
```
Resultado esperado: solo `PLAN_FUSIONADO_FACTURAS_OCR.md` en raíz de `docs/`.

---

### Fase 1 — Inventario y preclasificación del lote nuevo
Objetivo: dejar lote limpio y listo para OCR.

1. Inventariar archivos:
```bash
find proveedores_facturas_temp/nuevos -maxdepth 1 -type f | sort
```

2. Separar:
- imágenes válidas (`.jpg/.jpeg/.png/.pdf`)
- sidecars (`:Zone.Identifier`)
- no-factura/auxiliares (ej: JSON de historial)

3. Detectar duplicados por hash y marcar “canonical/duplicate” (NO borrar originales).

4. Generar manifiesto:
- `docs/closure/OCR_NUEVOS_MANIFEST_2026-02-28.md`

Formato mínimo por fila:
- `archivo`
- `hash`
- `tipo`
- `duplicado_de`
- `proveedor_estimado`
- `cuit_detectado`
- `proveedor_id`
- `estado_preparacion` (`ready|needs_review|ignored`)

---

### Fase 2 — Resolución de proveedor por imagen (antes de ingesta)
Objetivo: evitar OCR con proveedor incorrecto.

Estrategia recomendada (en este orden):
1. Detectar CUIT del texto de la imagen (OCR preliminar).
2. Cruzar CUIT con `proveedores`.
3. Si no hay CUIT, usar heurística por nombre comercial + briefing:
   - `proveedores_facturas_temp/BRIEFING_AGENTE_MINIMARKET.md`
4. Si persiste ambigüedad: marcar `needs_review` y continuar con las demás.

Nota:
- Si falta credencial para OCR preliminar (`GCV_API_KEY`) o acceso DB, marcar `BLOCKED` con evidencia y dejar script + dry-run listos.

---

### Fase 3 — Ingesta y extracción OCR del lote
Objetivo: ejecutar pipeline real para los `ready`.

Implementa/usa script reproducible (ejemplo: `scripts/ocr-procesar-nuevos.mjs`) con modo:
- `--dry-run` (default)
- `--execute`

Pipeline por imagen `ready`:
1. Upload a bucket `facturas` (`<proveedor_id>/<timestamp>.<ext>`).
2. Insert en `facturas_ingesta` con `estado='pendiente'`.
3. Invocar extracción OCR (preferible endpoint real del sistema).
4. Registrar:
   - `factura_id`
   - `estado final`
   - `items_count`
   - `score_confianza`
   - errores si aplica

Guardar artefacto:
- `docs/closure/OCR_NUEVOS_RESULTADOS_2026-02-28.md`

---

### Fase 4 — Ajustes de detalle sobre lo ya realizado
Objetivo: cerrar cabos sueltos.

Checklist:
1. Verificar que no queden referencias activas a planes deprecados en rutas antiguas.
2. Si encontrás drift documental nuevo, corregir mínimo necesario.
3. Validar enlaces docs:
```bash
node scripts/validate-doc-links.mjs
```
4. Registrar decisiones nuevas en `docs/DECISION_LOG.md` solo si cambian criterio/flujo.

---

### Fase 5 — Continuidad ejecutable (handoff)
Objetivo: que la próxima ventana IA continúe sin re-trabajo.

Generar:
1. Resumen ejecutivo (10-15 líneas) con estado del lote.
2. Tabla:
   - `procesadas_ok`
   - `procesadas_con_warning`
   - `fallidas`
   - `blocked`
3. Top 5 acciones siguientes (ordenadas por impacto).
4. Archivos exactos tocados.
5. Comandos para reanudar exactamente desde el estado final.

Guardar en:
- `docs/closure/OCR_NUEVOS_HANDOFF_2026-02-28.md`

---

## CRITERIOS DE EXITO DE ESTA SESION
Se considera completa SOLO si:
1. Existe manifiesto del lote nuevo con clasificación completa.
2. Existe resultado OCR por imagen (real o `BLOCKED` justificado).
3. No hay ambigüedad sobre plan activo vs histórico.
4. Queda handoff accionable para la siguiente sesión.

---

## FORMATO DE SALIDA QUE DEBES ENTREGAR AL FINAL
1. `Estado final`: `COMPLETADO` o `PARCIAL (BLOCKED)`
2. `Hallazgos` (orden severidad: CRITICO/ALTO/MEDIO/BAJO)
3. `Evidencia` (`archivo:linea` o comandos ejecutados)
4. `Archivos modificados`
5. `Siguiente paso inmediato` (solo 1, el más importante)

---

## COMANDO DE ARRANQUE SUGERIDO (EN CLAUDE CODE)
```bash
.agent/scripts/p0.sh bootstrap
.agent/scripts/p0.sh session-start "OCR lote nuevos + continuidad operativa"
.agent/scripts/p0.sh extract --with-gates --with-supabase
```

Y al cierre:
```bash
.agent/scripts/p0.sh session-end
```
