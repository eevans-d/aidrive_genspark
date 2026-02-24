# CONTEXT PROMPT ENGINEERING — CONTINUIDAD GO-LIVE (CLAUDE CODE)
## Proyecto: eevans-d/aidrive_genspark
## Fecha de contexto: 2026-02-24
## Objetivo: cerrar hardening final + gobernanza de dependencias + evidencia de readiness

---

> **INSTRUCCIÓN MAESTRA:**
> Ejecuta esta sesión de punta a punta sin pausas intermedias.
> Si un paso falla, documenta evidencia, aplica fix inmediato (si es impacto bajo/medio), y continúa.
> No expongas secretos/JWTs (solo nombres de variables).

---

## 0) CONTEXTO REAL YA VERIFICADO (NO ASUMIR, RE-VALIDAR)

Estado previo confirmado en sesión anterior (2026-02-24):
- Unit tests: `1711/1711 PASS` (`80 files`)
- Components: `238/238 PASS` (`46 files`)
- Security: `11 PASS | 3 skipped`
- `deno check` edge functions: `15/15 OK`
- Migración de hardening aplicada: `20260224010000_harden_security_definer_search_path_global.sql`
- `@supabase/supabase-js` alineado en root/frontend/edge a línea `2.95.x`

**Tu trabajo ahora:** validar que esto sigue siendo cierto en estado actual de rama y elevar la robustez operativa/CI para que no vuelva a desalinearse.

---

## 1) GUARDRAILS NO NEGOCIABLES

1. NO imprimir secretos, JWTs, tokens ni API keys (solo nombres).
2. NO comandos destructivos (`git reset --hard`, `git checkout -- <file>`, force push).
3. Si redeploy de `api-minimarket`: mantener `verify_jwt=false` (`--no-verify-jwt`).
4. Commits atómicos con formato:
   - `fix|feat|test|docs|chore: [scope] descripcion`

---

## 2) FLUJO PROTOCOL ZERO (OBLIGATORIO)

Ejecuta y guarda evidencia:

```bash
.agent/scripts/p0.sh bootstrap
.agent/scripts/p0.sh session-start "continuidad go-live: dependency governance + hardening final + readiness evidence"
.agent/scripts/p0.sh extract --with-gates --with-supabase
```

Si algún script falla: fallback manual y documentar en reporte final.

---

## 3) FASE A — BASELINE + SANITY INICIAL

### A.1 Baseline técnico
```bash
git status --short
git rev-parse --short HEAD
node -v
npm -v
pnpm -v
supabase --version
```

### A.2 Validaciones mínimas iniciales
```bash
npx vitest run tests/unit/ --reporter=dot
npx vitest run --config minimarket-system/vitest.config.ts --reporter=dot
npx vitest run tests/security --config vitest.auxiliary.config.ts --reporter=dot
cd minimarket-system && pnpm build && cd ..
cd minimarket-system && npx tsc --noEmit && cd ..
```

---

## 4) FASE B — GOBERNANZA DE DEPENDENCIAS (TAREA ALTA COMPLEJIDAD)

### Meta
Evitar drift futuro de `@supabase/supabase-js` entre capas y bloquear regresiones automáticamente.

### B.1 Alineación estricta (si no está ya exacta)
- Revisar:
  - `package.json`
  - `minimarket-system/package.json`
  - `supabase/functions/deno.json`
  - `supabase/functions/import_map.json`
- Si hay rangos (`^`), evaluar fijar versión exacta en root/frontend para mayor determinismo.

### B.2 Crear guard de consistencia en CI
Implementar script nuevo:
- `scripts/check-supabase-js-alignment.mjs`

Debe:
1. Leer versiones de root/frontend/deno/import_map.
2. Normalizarlas a semver (sin `^`, URL esm.sh, etc).
3. Fallar (`exit 1`) si no coinciden major.minor.patch esperado.
4. Imprimir diff claro y acción sugerida.

### B.3 Integrar guard en CI
Actualizar `.github/workflows/ci.yml`:
- Añadir paso blocking en job temprano (`lint` o job dedicado `dependency-alignment`).
- Mensaje explícito de falla.

### B.4 Tests del script
Crear:
- `tests/unit/dependency-alignment.test.ts` (o equivalente)

Casos:
- versiones iguales -> PASS
- drift root vs frontend -> FAIL esperado
- drift deno/import_map -> FAIL esperado

---

## 5) FASE C — HARDENING SQL POST-MIGRATION

### C.1 Revalidar local y remoto
```bash
supabase migration list --linked
```

### C.2 Verificación real de funciones SECURITY DEFINER sin search_path
Crear SQL de auditoría (solo lectura) y ejecutar contra remoto (sin exponer secretos):
- contar funciones `prosecdef=true` en `public` sin `proconfig` con `search_path`.

Si count > 0:
- generar migración incremental correctiva.
- aplicar con `supabase db push`.
- volver a verificar hasta 0.

---

## 6) FASE D — SECRET READINESS OCR (OPERATIVO)

Objetivo: asegurar readiness de OCR en producción, sin exponer valores.

### D.1 Verificar nombre de secret en Supabase
```bash
supabase secrets list
```

### D.2 Confirmar presencia de:
- `GCV_API_KEY`

Si no existe:
- documentar bloqueo operativo en reporte (no inventar valor).
- dejar instrucción exacta para alta manual en dashboard/CLI.

---

## 7) FASE E — VALIDACIÓN FINAL COMPLETA

Ejecutar al final:

```bash
npx vitest run tests/unit/ --reporter=verbose
npx vitest run --config minimarket-system/vitest.config.ts --reporter=verbose
npx vitest run tests/security --config vitest.auxiliary.config.ts --reporter=verbose
npx vitest run tests/unit/ --coverage
cd minimarket-system && pnpm build && cd ..
cd minimarket-system && npx tsc --noEmit && cd ..
for dir in supabase/functions/*/; do
  f=$(basename "$dir"); [ "$f" = "_shared" ] && continue
  [ -f "${dir}index.ts" ] || continue
  npx -y deno check --no-lock "${dir}index.ts"
done
node scripts/validate-doc-links.mjs
node scripts/metrics.mjs
node scripts/metrics.mjs --check
```

---

## 8) FASE F — DOCUMENTACIÓN OBLIGATORIA (DOCUGUARD)

Actualizar mínimo:
- `docs/ESTADO_ACTUAL.md`
- `docs/TESTING.md` (si cambian conteos)
- `docs/METRICS.md` (regenerado)
- `docs/DECISION_LOG.md` (si hubo decisiones de versionado/gates)

Crear reporte nuevo:
- `docs/closure/REPORTE_CONTINUIDAD_GO_LIVE_2026-02-24.md`

Estructura:
1. Resumen ejecutivo
2. Cambios realizados
3. Validaciones (tabla con PASS/FAIL)
4. Riesgos residuales
5. GO/NO-GO final
6. Evidencia CLI relevante

---

## 9) CRITERIOS DE ACEPTACIÓN (DEBE CUMPLIR TODO)

- [ ] Unit/component/security/build/typecheck en verde.
- [ ] `deno check` 15/15 en verde.
- [ ] `supabase-js` alineado y protegido por gate CI.
- [ ] Auditoría `SECURITY DEFINER` sin pendientes críticos activos.
- [ ] `GCV_API_KEY` verificado por nombre (presente o bloqueo documentado).
- [ ] Docs sincronizadas y reporte de continuidad generado.
- [ ] Commits atómicos y limpios.

---

## 10) FORMATO DE RESPUESTA FINAL (OBLIGATORIO)

En el mensaje final, responder en este orden:

1. **Resultado ejecutivo** (2-4 líneas)
2. **Cambios aplicados** (lista con rutas)
3. **Evidencia de validación** (totales PASS/FAIL)
4. **Observación**
5. **Recomendación**
6. **Sugerencia**
7. **Conclusión**

Sin relleno. Sin ambigüedad. Sin texto motivacional.

---

## 11) ANTI-DETENCIÓN

1. No pidas confirmación entre fases.
2. Si algo falla, corrige o documenta bloqueo con evidencia y sigue.
3. Si un comando tarda demasiado, córtalo y continúa con alternativa.
4. No cierres hasta entregar reporte y estado GO/NO-GO.

