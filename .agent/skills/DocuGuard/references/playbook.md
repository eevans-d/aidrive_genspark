# DocuGuard Playbook

## Table of Contents
- [Fase 0: Preflight Check](#fase-0-preflight-check)
- [Fase A: Security and Pattern Scan](#fase-a-security--pattern-scan)
- [Fase B: Sincronizacion Documental](#fase-b-sincronizacion-documental)
- [Fase C: Verificacion Cruzada](#fase-c-verificacion-cruzada)
- [Fase D: Reporte de Sincronizacion](#fase-d-reporte-de-sincronizacion)
- [Template Obligatorio](#template-obligatorio)
- [Quality Gates (PASS/FAIL)](#quality-gates-passfail)
- [Resolucion de Conflictos entre Docs](#resolucion-de-conflictos-entre-docs)
- [Manejo de Errores](#manejo-de-errores)
- [Senales de Parada Inmediata](#senales-de-parada-inmediata)

## Fase 0: Preflight Check

Objetivo: verificar que el entorno de documentacion esta listo.

```bash
# 0.1 - Verificar estructura de docs
DIRS_REQUIRED=("docs" "docs/audit" "docs/closure")
for dir in "${DIRS_REQUIRED[@]}"; do
  if [ ! -d "$dir" ]; then
    echo "[WARN] Directorio $dir no existe - creando..."
    mkdir -p "$dir"
  fi
done

# 0.2 - Verificar archivos criticos
FILES_REQUIRED=(
  "README.md"
  "docs/ESTADO_ACTUAL.md"
  "docs/API_README.md"
  "docs/DECISION_LOG.md"
  "docs/ESQUEMA_BASE_DATOS_ACTUAL.md"
)
MISSING=()
for f in "${FILES_REQUIRED[@]}"; do
  if [ ! -f "$f" ]; then
    MISSING+=("$f")
  fi
done
if [ ${#MISSING[@]} -gt 0 ]; then
  echo "[WARN] Archivos faltantes: ${MISSING[*]}"
  echo "       Crear templates base en Fase B."
fi

# 0.3 - Verificar herramienta de busqueda
command -v rg >/dev/null 2>&1 && SCAN_CMD="rg" || SCAN_CMD="grep"
echo "[INFO] Scanner: $SCAN_CMD"
```

## Fase A: Security & Pattern Scan

Objetivo: bloquear documentacion de estado inseguro o no trazable.

```bash
SCAN_CMD="rg"
command -v rg >/dev/null 2>&1 || SCAN_CMD="grep -r"

# A.1 - Console debug
if [ "$SCAN_CMD" = "rg" ]; then
  rg -l "console\.(log|debug|info)" supabase/functions/ --glob="*.ts" 2>/dev/null
  rg -l "console\.(log|debug|info)" minimarket-system/src/ --glob="*.{ts,tsx}" 2>/dev/null
else
  grep -rl "console\.\(log\|debug\|info\)" supabase/functions/ --include="*.ts" 2>/dev/null
  grep -rl "console\.\(log\|debug\|info\)" minimarket-system/src/ --include="*.ts" --include="*.tsx" 2>/dev/null
fi

# A.2 - Tokens/JWT/API keys hardcodeados
if [ "$SCAN_CMD" = "rg" ]; then
  rg -l -e "ey[A-Za-z0-9\-_]{20,}\.[A-Za-z0-9\-_]{20,}" \
          -e "sk[-_]live[-_][A-Za-z0-9]{20,}" \
          -e "apikey\s*[:=]\s*['\"][A-Za-z0-9]" \
          supabase/functions/ minimarket-system/src/ --glob="*.{ts,tsx}" 2>/dev/null
else
  grep -rlE "ey[A-Za-z0-9\-_]{20,}\.[A-Za-z0-9\-_]{20,}" supabase/functions/ minimarket-system/src/ --include="*.ts" --include="*.tsx" 2>/dev/null
fi

# A.3 - Passwords/secret literals
if [ "$SCAN_CMD" = "rg" ]; then
  rg -l -e "password\s*[:=]\s*['\"][^'\"$]" \
          -e "secret\s*[:=]\s*['\"][^'\"$]" \
          supabase/functions/ --glob="*.ts" 2>/dev/null
else
  grep -rlE "password\s*[:=]\s*['\"][^'\"$]" supabase/functions/ --include="*.ts" 2>/dev/null
fi

# A.4 - URLs hardcodeadas
if [ "$SCAN_CMD" = "rg" ]; then
  rg -l "https://[a-z]+\.supabase\.co" supabase/functions/ --glob="*.ts" 2>/dev/null
else
  grep -rl "https://[a-z]*\.supabase\.co" supabase/functions/ --include="*.ts" 2>/dev/null
fi

# A.5 - TODO/FIXME/HACK (warning)
if [ "$SCAN_CMD" = "rg" ]; then
  rg -n "TODO|FIXME|HACK|XXX" supabase/functions/ minimarket-system/src/ --glob="*.{ts,tsx}" 2>/dev/null | head -20
else
  grep -rn "TODO\|FIXME\|HACK\|XXX" supabase/functions/ minimarket-system/src/ --include="*.ts" --include="*.tsx" 2>/dev/null | head -20
fi
```

Decision automatica:
- Si A.1-A.4 encuentra resultados: `BLOCKED`.
- Si A.5 encuentra resultados: `WARNING` y continuar.

## Fase B: Sincronizacion Documental

Objetivo: alinear docs con estado real del codigo.

### B.1 - Reality check de referencias

```bash
# Funciones Edge no documentadas
if [ -f "docs/API_README.md" ]; then
  for func_dir in supabase/functions/*/; do
    func_name=$(basename "$func_dir")
    if [ "$func_name" != "_shared" ]; then
      if ! grep -q "$func_name" docs/API_README.md 2>/dev/null; then
        echo "[CODE_HUERFANO] Funcion '$func_name' existe pero no esta documentada"
      fi
    fi
  done
fi

# Funciones documentadas pero inexistentes
if [ -f "docs/API_README.md" ]; then
  grep -oP '(?<=## |### )\S+' docs/API_README.md 2>/dev/null | while read func; do
    if [ ! -d "supabase/functions/$func" ] && [ ! -f "supabase/functions/$func/index.ts" ]; then
      echo "[DOC_FANTASMA] Funcion '$func' documentada y no encontrada"
    fi
  done
fi
```

### B.2 - Matriz de sincronizacion por cambio

| Si cambia... | Actualizar... |
|---|---|
| `package.json` o `minimarket-system/package.json` | `README.md` |
| `supabase/functions/*` | `docs/API_README.md` |
| decisiones de arquitectura | `docs/DECISION_LOG.md` |
| variables/secretos (nombres) | ejecutar auditoria env |
| `supabase/migrations/*.sql` | `docs/ESQUEMA_BASE_DATOS_ACTUAL.md` |
| `.agent/skills/*` | `docs/ESTADO_ACTUAL.md` |
| cualquier cambio | `docs/ESTADO_ACTUAL.md` |

### B.3 - Template base para docs faltantes

```markdown
# Estado Actual del Proyecto
> Ultima actualizacion: [FECHA_HOY]
> Actualizado por: DocuGuard v2.1

## Resumen
[PENDIENTE - Completar en proxima sesion]

## Componentes Activos
- [ ] Verificar y listar

## Metricas
- Tests: [PENDIENTE]
- Skills: [CONTAR desde .agent/skills/]
- Funciones Edge: [CONTAR desde supabase/functions/]
```

### B.4 - Auditoria de variables de entorno

```bash
if [ -f ".agent/scripts/env_audit.py" ]; then
  python3 .agent/scripts/env_audit.py --format markdown 2>/dev/null
else
  echo "[INFO] env_audit.py no encontrado - fallback manual"
  if [ -f ".env.example" ]; then
    echo "Variables en .env.example:"
    grep -oP '^[A-Z_]+' .env.example 2>/dev/null | sort
  fi
  echo "Variables usadas en Edge Functions:"
  grep -roP 'Deno\.env\.get\(["\x27]\K[^"\x27]+' supabase/functions/ 2>/dev/null | sort -u
  echo "Variables usadas en Frontend:"
  grep -roP 'import\.meta\.env\.\K[A-Z_]+' minimarket-system/src/ 2>/dev/null | sort -u
fi
```

### B.5 - Estado de evidencias de auditoria

```bash
AUDIT_COUNT=$(ls docs/audit/EVIDENCIA_SP-*.md 2>/dev/null | wc -l)
if [ "$AUDIT_COUNT" -gt 0 ]; then
  echo "[INFO] $AUDIT_COUNT evidencias encontradas"
  for evidence in docs/audit/EVIDENCIA_SP-*.md; do
    UNRESOLVED=$(grep -c "\[ \]" "$evidence" 2>/dev/null || echo 0)
    RESOLVED=$(grep -c "\[x\]" "$evidence" 2>/dev/null || echo 0)
    echo "  $(basename "$evidence"): $RESOLVED resueltos, $UNRESOLVED pendientes"
  done
fi
```

## Fase C: Verificacion Cruzada

Objetivo: validar coherencia global de la documentacion.

### C.1 - Freshness check

```bash
if [ -f "docs/ESTADO_ACTUAL.md" ]; then
  DOC_DATE=$(grep -oP '\d{4}-\d{2}-\d{2}' docs/ESTADO_ACTUAL.md | head -1)
  if [ -n "$DOC_DATE" ]; then
    DAYS_OLD=$(( ($(date +%s) - $(date -d "$DOC_DATE" +%s 2>/dev/null || echo 0)) / 86400 ))
    if [ "$DAYS_OLD" -gt 7 ]; then
      echo "[STALE] ESTADO_ACTUAL.md tiene $DAYS_OLD dias"
    elif [ "$DAYS_OLD" -gt 5 ]; then
      echo "[WARN] ESTADO_ACTUAL.md tiene $DAYS_OLD dias"
    else
      echo "[OK] ESTADO_ACTUAL.md actualizado hace $DAYS_OLD dias"
    fi
  else
    echo "[WARN] No hay fecha valida en ESTADO_ACTUAL.md"
  fi
fi
```

### C.2 - Conteo de skills

```bash
SKILL_DIRS=$(find .agent/skills -mindepth 1 -maxdepth 1 -type d 2>/dev/null | wc -l)
echo "[INFO] Skills encontrados: $SKILL_DIRS"

if [ -f "docs/ESTADO_ACTUAL.md" ]; then
  DOC_SKILL_COUNT=$(grep -oP '\d+(?=\s*skills?)' docs/ESTADO_ACTUAL.md | head -1)
  if [ -n "$DOC_SKILL_COUNT" ] && [ "$DOC_SKILL_COUNT" != "$SKILL_DIRS" ]; then
    echo "[DESINCRONIZADO] Docs=$DOC_SKILL_COUNT vs real=$SKILL_DIRS"
  fi
fi

if [ -f ".agent/skills/project_config.yaml" ]; then
  CONFIG_SKILL_COUNT=$(grep -oP 'skills_total:\s*\K\d+' .agent/skills/project_config.yaml)
  if [ -n "$CONFIG_SKILL_COUNT" ] && [ "$CONFIG_SKILL_COUNT" != "$SKILL_DIRS" ]; then
    echo "[DESINCRONIZADO] project_config skills_total=$CONFIG_SKILL_COUNT vs real=$SKILL_DIRS"
  fi
fi
```

### C.3 - Validacion de enlaces internos

```bash
find docs/ -name "*.md" -type f 2>/dev/null | while read mdfile; do
  grep -oP '\[.*?\]\(\K[^)]+' "$mdfile" 2>/dev/null | while read link; do
    if [[ "$link" != http* ]] && [[ "$link" != "#"* ]]; then
      LINK_DIR=$(dirname "$mdfile")
      TARGET=$(realpath -m "$LINK_DIR/$link" 2>/dev/null || echo "$link")
      if [ ! -e "$TARGET" ] && [ ! -e "$link" ]; then
        echo "[ENLACE_ROTO] $mdfile -> $link"
      fi
    fi
  done
done
```

### C.4 - Conteo de Edge Functions

```bash
if [ -d "supabase/functions" ]; then
  FUNC_COUNT=0
  for func_dir in supabase/functions/*/; do
    func_name=$(basename "$func_dir")
    if [ "$func_name" != "_shared" ]; then
      FUNC_COUNT=$((FUNC_COUNT + 1))
    fi
  done
  echo "[INFO] Edge Functions encontradas: $FUNC_COUNT"

  if [ -f ".agent/skills/project_config.yaml" ]; then
    CONFIG_FUNC_COUNT=$(grep -oP 'functions_deployed:\s*\K\d+' .agent/skills/project_config.yaml)
    if [ -n "$CONFIG_FUNC_COUNT" ] && [ "$CONFIG_FUNC_COUNT" != "$FUNC_COUNT" ]; then
      echo "[DESINCRONIZADO] project_config functions_deployed=$CONFIG_FUNC_COUNT vs real=$FUNC_COUNT"
    fi
  fi
fi
```

## Fase D: Reporte de Sincronizacion

Objetivo: consolidar hallazgos y acciones en un bloque unico.

## Template Obligatorio

```markdown
---
## DocuGuard Report v2.1
**Sesion:** [FECHA_HORA]
**Fases completadas:** [N] de 4

### Resumen Ejecutivo
| Metrica | Valor |
|---------|-------|
| Archivos escaneados | [N] |
| Violaciones de seguridad | [N] |
| Docs fantasma | [N] |
| Code huerfano | [N] |
| Desincronizaciones corregidas | [N] |
| Enlaces rotos | [N] |
| Estado freshness | [OK/STALE/WARN] |

### Bloqueantes (requieren accion)
- [Lista o "Ninguno"]

### Advertencias
- [Lista o "Ninguno"]

### Acciones Realizadas
- [Lista de correcciones automaticas aplicadas]

### Conteos Verificados
- Skills: [N]
- Edge Functions: [N]
- Archivos de evidencia: [N]
- Tests (si disponible): [N passed / N total]

### Clasificacion de Cambios
| Item | Categoria | Accion Tomada |
|------|-----------|---------------|
| [nombre] | REAL/DOC_FANTASMA/CODE_HUERFANO/DESINCRONIZADO/A_CREAR/PROPUESTA_FUTURA | [Descripcion] |
---
```

## Quality Gates (PASS/FAIL)

| # | Gate | PASS | FAIL |
|---|---|---|---|
| QG1 | Seguridad | 0 `console.log` + 0 secretos hardcodeados | >=1 hallazgo |
| QG2 | Freshness | `ESTADO_ACTUAL.md` <= 7 dias | >7 dias |
| QG3 | Consistencia | 0 `DOC_FANTASMA` + 0 `CODE_HUERFANO` sin resolver | >=1 sin resolver |
| QG4 | Enlaces | 0 enlaces rotos en `docs/` | >=1 enlace roto |
| QG5 | Reporte | Reporte fase D completo | Reporte incompleto |

Resultado:
- ALL PASS: cierre documental correcto.
- ANY FAIL: dejar pendientes como primera tarea de proxima sesion.
- QG1 FAIL: bloqueante.

## Resolucion de Conflictos entre Docs

Priorizar por jerarquia:
1. Codigo fuente
2. `docs/ESTADO_ACTUAL.md`
3. `docs/API_README.md`
4. `docs/ESQUEMA_BASE_DATOS_ACTUAL.md`
5. `README.md`

Si hay empate: priorizar timestamp mas reciente.
Registrar decision en `docs/DECISION_LOG.md`.

## Manejo de Errores

| Error | Accion |
|---|---|
| `rg` no disponible | usar `grep` |
| archivo no existe | marcar `[NO ENCONTRADO]` y continuar |
| `env_audit.py` falla | fallback manual de variables |
| `docs/` no existe | crear estructura base con warning |
| permiso denegado | reportar archivo y continuar |

## Senales de Parada Inmediata

- Deteccion de operacion destructiva en progreso.
- Mas de 20 `DOC_FANTASMA` (requiere auditoria mayor).
- Loop de la misma correccion aplicado 2+ veces.
