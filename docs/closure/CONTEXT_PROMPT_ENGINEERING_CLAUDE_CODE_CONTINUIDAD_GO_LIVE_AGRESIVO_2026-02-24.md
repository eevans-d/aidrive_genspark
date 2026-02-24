# CONTEXT PROMPT ENGINEERING — OPCION 2 (AGRESIVA)
## Proyecto: eevans-d/aidrive_genspark
## Ventana: Nueva sesión Claude Code
## Fecha: 2026-02-24
## Modo: Hardening profundo + cierre de deuda crítica + readiness strict

---

> **INSTRUCCIÓN MAESTRA (MODO AGRESIVO):**
> Ejecuta una sesión integral, sin pausas, para eliminar riesgos de producción de forma estricta.
> Prioriza seguridad, determinismo de dependencias, robustez CI/CD y capacidad real de rollback.
> Si aparece un riesgo P0/P1, trátalo como blocker operativo hasta remediarlo o dejar mitigación verificable.

---

## 1) GUARDRAILS INQUEBRANTABLES

1. NO imprimir secretos/JWTs/tokens/keys (solo nombres de variables).
2. NO comandos destructivos (`git reset --hard`, `git checkout -- <file>`, force push).
3. `api-minimarket` debe permanecer con `verify_jwt=false` en cualquier redeploy (`--no-verify-jwt`).
4. Cada cambio relevante debe quedar en commit atómico:
   - `fix|feat|test|docs|chore: [scope] descripcion`
5. Cualquier hallazgo CRITICAL/HIGH debe incluir evidencia de archivo/línea/comando.

---

## 2) OBJETIVO AGRESIVO

Dejar el proyecto en estado **GO estricto** con:
- Gates técnicos verdes.
- Dependencias sensibles bajo gobernanza fuerte.
- Seguridad defensiva validada con evidencia reproducible.
- Runbook de rollback probado/documentado.
- Bloqueos operativos reales explicitados (si existen).

---

## 3) PRE-FLIGHT PROTOCOL ZERO

Ejecutar:

```bash
.agent/scripts/p0.sh bootstrap
.agent/scripts/p0.sh session-start "opcion 2 agresiva: hardening profundo y go-live estricto"
.agent/scripts/p0.sh extract --with-gates --with-supabase
```

Si falla, aplicar fallback manual y documentar.

---

## 4) FASE A — BASELINE Y BLOQUEADORES INMEDIATOS

```bash
git status --short
git rev-parse --short HEAD
node -v && npm -v && pnpm -v
supabase --version
npx -y deno --version
```

Detección rápida de blockers:
- `deno check` 15/15
- unit/components/security/build/typecheck
- doc links / metrics

Comandos:
```bash
npx vitest run tests/unit/ --reporter=dot
npx vitest run --config minimarket-system/vitest.config.ts --reporter=dot
npx vitest run tests/security --config vitest.auxiliary.config.ts --reporter=dot
cd minimarket-system && pnpm build && npx tsc --noEmit && cd ..
for dir in supabase/functions/*/; do
  f=$(basename "$dir"); [ "$f" = "_shared" ] && continue
  [ -f "${dir}index.ts" ] || continue
  npx -y deno check --no-lock "${dir}index.ts"
done
node scripts/validate-doc-links.mjs
node scripts/metrics.mjs --check || node scripts/metrics.mjs
```

---

## 5) FASE B — DEPENDENCY GOVERNANCE (AGRESIVA)

### B.1 Lockdown de dependencias críticas
- `@supabase/supabase-js`
- librerías de auth, runtime crítico, seguridad

Acción agresiva:
1. Evitar drift entre root/frontend/edge.
2. Quitar ambigüedad semver en paquetes críticos (preferir pin exacto donde corresponda).
3. Regenerar lockfiles de forma consistente.

### B.2 Guard estricto en CI
Crear `scripts/check-critical-deps-alignment.mjs` que:
- Valide coincidencia exacta entre root/frontend/edge para deps críticas.
- Falla con `exit 1` ante cualquier drift.
- Informe diff claro y remediation.

### B.3 CI fail-fast
Actualizar `.github/workflows/ci.yml`:
- Job temprano bloqueante (`dependency-governance`).
- Debe correr antes de test/build.

### B.4 Tests del guard
Crear tests unitarios del checker con casos positivos y negativos.

---

## 6) FASE C — SECURITY HARDENING SQL + RLS

### C.1 Auditoría real en BD remota
Usar `supabase migration list --linked` y auditoría SQL read-only para:
- `SECURITY DEFINER` sin `search_path`.
- Tablas sin RLS o policies insuficientes.

### C.2 Remediación agresiva
Si hay hallazgos:
- Crear migraciones incrementales idempotentes.
- Aplicar con `supabase db push`.
- Re-auditar hasta cero hallazgos críticos.

### C.3 Cron/Auth hardening
Verificar cron jobs SQL:
- presencia de `Authorization` en `net.http_post` cuando aplique.
- evitar jobs que fallen silenciosamente por auth.

---

## 7) FASE D — EDGE FUNCTION SECURITY DEFENSE-IN-DEPTH

Auditar 15 funciones:
- auth guard presente y consistente
- manejo OPTIONS/CORS
- manejo uniforme de errores
- request correlation (`x-request-id`)
- rate-limit/circuit-breaker en rutas sensibles

Acción agresiva:
- Si falta patrón crítico, corregir en la misma sesión.
- Acompañar fix con tests unitarios.

---

## 8) FASE E — OCR READINESS OPERATIVO REAL

Verificar secret por nombre (sin valor):
```bash
supabase secrets list
```

Requerido:
- `GCV_API_KEY`

Si falta:
- marcar `NO-GO` operativo de OCR o `GO con condición explícita` (según alcance funcional).
- documentar instrucción exacta de alta.

---

## 9) FASE F — CI/CD Y RECUPERACIÓN

### F.1 Pipeline strict
- Confirmar que security-tests es blocking.
- Confirmar budgets de bundle y typecheck blocking.

### F.2 Rollback real (agresivo)
- Verificar existencia y vigencia de runbook de rollback.
- Simular drill documental/técnico mínimo (sin borrar datos).
- Registrar tiempos y pasos exactos.

### F.3 Pre-commit / lint-staged
- Asegurar que previenen drift de calidad.

---

## 10) FASE G — VALIDACIÓN FINAL FULL

```bash
npx vitest run tests/unit/ --reporter=verbose
npx vitest run --config minimarket-system/vitest.config.ts --reporter=verbose
npx vitest run tests/security --config vitest.auxiliary.config.ts --reporter=verbose
npx vitest run tests/unit/ --coverage
npm run test:auxiliary
cd minimarket-system && pnpm build && npx tsc --noEmit && cd ..
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

## 11) DOCUMENTACIÓN FINAL OBLIGATORIA

Actualizar:
- `docs/ESTADO_ACTUAL.md`
- `docs/DECISION_LOG.md` (decisiones de hardening/deps/CI)
- `docs/TESTING.md` (si cambian conteos)
- `docs/METRICS.md`

Crear reporte final:
- `docs/closure/REPORTE_CONTINUIDAD_GO_LIVE_AGRESIVO_2026-02-24.md`

Debe incluir:
1. Resumen ejecutivo
2. Hallazgos CRITICAL/HIGH/MEDIUM/LOW
3. Cambios aplicados (archivo por archivo)
4. Validaciones finales (tabla de gates)
5. Riesgos residuales
6. Decisión GO/NO-GO
7. Evidencia CLI

---

## 12) CRITERIOS DE ACEPTACIÓN (AGRESIVOS)

- [ ] Unit/components/security/build/typecheck en verde.
- [ ] Coverage global >= umbral vigente.
- [ ] `deno check` 15/15 verde.
- [ ] Security definer/search_path sin pendientes críticos.
- [ ] Dependencias críticas sin drift y gate CI activo.
- [ ] OCR secret readiness confirmada por nombre (`GCV_API_KEY`).
- [ ] Doc links y metrics en verde.
- [ ] Reporte final y decisión GO/NO-GO sustentada.

---

## 13) FORMATO DE RESPUESTA FINAL (MANDATORIO)

Responder exactamente en este orden:
1. **Resultado ejecutivo**
2. **Cambios aplicados**
3. **Evidencia de validación**
4. **Observación**
5. **Recomendación**
6. **Sugerencia**
7. **Conclusión**

Sin relleno. Sin ambigüedad. Solo hechos verificables.

---

## 14) ANTI-DETENCIÓN

1. No pedir confirmación entre fases.
2. Si falla algo, fix inmediato o bloqueo documentado y continuar.
3. Si una tarea es inviable por entorno, dejar workaround ejecutable.
4. No cerrar sesión sin reporte y decisión final.

