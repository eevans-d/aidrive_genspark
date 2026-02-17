# EVIDENCIA: Unificacion Canonica + Remediacion Critica

**Fecha:** 2026-02-17
**Sesion:** Unificacion canonica post-auditoria paralela
**Commit base:** `10f3cd3` (branch `main`, clean)

---

## Baseline

```
Branch: main
HEAD: 10f3cd3 docs: deploy evidence + update docs post-hardening D-127
Node: v20.20.0
pnpm: 9.15.9
Supabase CLI: 2.72.7
git status: CLEAN
```

---

## FASE 1: Remediacion deploy.sh

### Antes
```bash
# deploy.sh:436 (funcion deploy_migrations)
supabase db reset --linked  # RIESGO CATASTROFICO en staging/production
```

### Despues
```bash
# deploy_migrations() ahora usa:
# - `supabase db push` para staging/production (seguro: aplica solo migraciones pendientes)
# - `supabase db reset` solo para dev local (sin --linked)
```

### Verificacion
```bash
grep -n "db reset" deploy.sh
# Solo debe aparecer en contexto dev local, nunca con --linked
```

---

## FASE 2: Higiene de referencias

### 2.1 Referencia rota `.claude/plans/smooth-shimmying-canyon.md`
- Archivos corregidos: `docs/ESTADO_ACTUAL.md`, `docs/DECISION_LOG.md`, `docs/closure/CONTINUIDAD_SESIONES.md`, `docs/closure/CONTEXT_PROMPT_DEPLOY_HARDENING_2026-02-17.md`
- Sustituida por: referencia a D-126 en DECISION_LOG (trazable y persistente)

### 2.2 Snapshots pre-deploy deprecados
- `BASELINE_LOG_2026-02-17_032715.md`: cabecera de deprecacion agregada
- `TECHNICAL_ANALYSIS_2026-02-17_032718.md`: cabecera de deprecacion agregada
- `INVENTORY_REPORT_2026-02-17_032740.md`: cabecera de deprecacion agregada

### 2.3 Reporte SRE canonizado
- `REPORTE_AUDITORIA_SRE_DEFINITIVO_2026-02-17.md` agregado como excepcion en `.gitignore`
- Enlazado desde `README_CANONICO.md` y `CONTINUIDAD_SESIONES.md`

---

## FASE 3: Consolidacion de objetivo final

- `OBRA_OBJETIVO_FINAL_PRODUCCION/README.md`: confirmado como documento canonico maestro
- `OBJETIVO_FINAL_PRODUCCION.md`: marcado como subordinado/complementario con puntero al canonico

---

## FASE 4: Mapeo VULN-SRE vs Matriz

- Creado: `docs/closure/OBRA_OBJETIVO_FINAL_PRODUCCION/MAPEO_VULN_SRE_VS_MATRIZ_2026-02-17.md`
- 8 VULNs mapeadas a ejes de la matriz de contraste con estado, evidencia y accion

---

## FASE 5: Hoja de ruta unica

- Creado: `docs/closure/HOJA_RUTA_UNICA_CANONICA_2026-02-17.md`
- Top 10 prioridades, 4 fases secuenciales, DoD verificable, dependencias

---

## FASE 6: Verificacion final

| Check | Resultado | Detalle |
|---|---|---|
| Doc links | PASS | 80 archivos verificados, 0 enlaces rotos |
| Unit tests | PASS | 1165/1165 (58 archivos, 29.75s) |
| Frontend component tests | PASS | 175/175 (30 archivos) |
| Lint frontend | PASS | 0 errors, 1 warning pre-existente (Ventas.tsx useMemo) |
| Build frontend | PASS | 9.64s, PWA generada |
| Integration tests | BLOCKED | Requiere `.env.test` (no disponible en este host) |
| E2E tests | BLOCKED | Requiere entorno local Supabase o `.env.test` |
| `grep "db reset --linked" deploy.sh` | 0 resultados | VULN-001 confirmado cerrado |
| `grep "smooth-shimmying-canyon" **/*.md` | 0 resultados en docs canonicos | Solo en este archivo de evidencia |
| `git ls-files REPORTE_AUDITORIA_SRE*` | Trackeable | Excepcion en .gitignore agregada |

---

## Criterios de aceptacion

| # | Criterio | Estado |
|---|---|---|
| 1 | No queda camino remoto con `db reset --linked` | PASS |
| 2 | No quedan referencias a `.claude/plans/smooth-shimmying-canyon.md` | PASS |
| 3 | Reporte SRE trazable y canonico | PASS |
| 4 | Unico documento objetivo maestro | PASS |
| 5 | Mapeo VULN-001..008 vs matriz | PASS |
| 6 | Hoja de ruta unica canonica enlazada | PASS |
| 7 | Quality gates ejecutados o BLOCKED documentado | PASS (4/6 verdes, 2 BLOCKED con evidencia) |
