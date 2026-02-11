---
name: DocuGuard
description: >
  Guardian de documentacion del proyecto. Sincroniza docs con codigo real,
  detecta desincronizaciones, elimina referencias fantasma, y genera reportes de estado.
  Opera como fase terminal obligatoria de cualquier sesion de trabajo.
role: CODEX->EXECUTOR
version: 2.0.0
impact: 1
chain: []
triggered_by: [CodeCraft, MigrationOps, RealityCheck, SecurityAudit, PerformanceWatch, APISync, EnvAuditOps, MegaPlanner, SendGridOps, SecretRotationOps, SentryOps, DependabotOps, UXFixOps, ProductionGate, CronFixOps]
---

# DocuGuard Skill v2.0

**ROL:** CODEX (fases 0-A: verificar, escanear) + EXECUTOR (fases B-D: sincronizar, corregir, reportar).
**REGLA DE ORO:** "Si no esta documentado, no existe. Si esta documentado pero no existe en codigo, es mentira."

---

## Guardrails

## 1. Guardrails (Inviolables)

1. **NO** imprimir secretos, tokens, JWTs ni API keys — solo referenciar por NOMBRE de variable.
2. **NO** usar comandos destructivos (`rm -rf`, `DROP`, `DELETE FROM`, `truncate`).
3. **NO** modificar codigo fuente — DocuGuard SOLO toca archivos `.md` dentro de `docs/` y `README.md` raiz.
4. **NO** eliminar archivos de documentacion — solo marcar como `[DEPRECADO: YYYY-MM-DD]` con fecha.
5. **NO** inventar informacion — si no se puede verificar contra el codigo, clasificar como `PROPUESTA_FUTURA`.
6. **SIEMPRE** preservar historial: nunca sobrescribir sin dejar registro del estado anterior.

---

## 2. Taxonomia de Clasificacion

Todo hallazgo se clasifica en exactamente UNA categoria:

| Categoria | Definicion | Accion |
|-----------|-----------|--------|
| `REAL` | Existe en codigo Y en documentacion — sincronizados | Ninguna |
| `DOC_FANTASMA` | Documentado pero NO existe en codigo | Marcar `[NO VERIFICADO]` + reportar |
| `CODE_HUERFANO` | Existe en codigo pero NO documentado | Documentar automaticamente |
| `DESINCRONIZADO` | Ambos existen pero difieren | Actualizar doc segun codigo |
| `A_CREAR` | Decision tomada, codigo pendiente de implementar | Documentar como "Pendiente" |
| `PROPUESTA_FUTURA` | Idea no verificable ni decidida | Registrar en DECISION_LOG como propuesta |

---

## 3. Reglas de Automatizacion

1. Ejecutar TODAS las fases automaticamente en secuencia sin pedir confirmacion.
2. Si encuentra patrones prohibidos (Fase A) -> BLOQUEAR y reportar.
3. Si encuentra desincronizacion -> CORREGIR automaticamente la documentacion.
4. Clasificar TODOS los cambios usando la taxonomia de la Seccion 2.
5. Generar reporte de sincronizacion al finalizar (Fase D).
6. **OBLIGATORIO:** Al final de CUALQUIER sesion de trabajo, actualizar `docs/ESTADO_ACTUAL.md`.
7. **FECHA STALE:** Si la fecha en la cabecera de `docs/ESTADO_ACTUAL.md` tiene >7 dias -> WARNING y actualizar.

---

## Activacion

## 4. Activacion

### Activar cuando:
- Codigo modificado o creado (cualquier `.ts`, `.tsx`, `.sql`, `.py`).
- Cambios en variables de entorno o secretos (nombres).
- Nuevo skill agregado o skill existente modificado.
- Auditoria de Pull Request.
- Final de CUALQUIER sesion de trabajo (obligatorio).
- Invocado explicitamente por usuario u otro skill.
- Schema de base de datos modificado.

### NO activar cuando:
- Refactor en progreso activo (codigo intencionalmente roto).
- Tareas exploratorias sin commits ni decisiones firmes.
- Sesion dedicada exclusivamente a lectura/analisis sin cambios.

---

## 5. Protocolo de Ejecucion

### FASE 0: Preflight Check

**Objetivo:** Verificar que el entorno esta listo para operar.
**Input:** Estado del workspace.
**Output:** `READY` o `BLOCKED` con razon.

```bash
# 0.1 — Verificar estructura de docs existe
DIRS_REQUIRED=("docs" "docs/audit" "docs/closure")
for dir in "${DIRS_REQUIRED[@]}"; do
  if [ ! -d "$dir" ]; then
    echo "[WARN] Directorio $dir no existe — creando..."
    mkdir -p "$dir"
  fi
done

# 0.2 — Verificar archivos criticos existen
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
  echo "       Seran creados con template base en FASE B."
fi

# 0.3 — Verificar herramientas disponibles
command -v rg >/dev/null 2>&1 && SCAN_CMD="rg" || SCAN_CMD="grep"
echo "[INFO] Scanner: $SCAN_CMD"
```

### FASE A: Security & Pattern Scan

**Objetivo:** Detectar patrones prohibidos antes de continuar.
**Input:** Codebase completo.
**Output:** `CLEAN` o `BLOCKED` con lista de violaciones.

```bash
# Determinar herramienta de busqueda
SCAN_CMD="rg"
command -v rg >/dev/null 2>&1 || SCAN_CMD="grep -r"

# A.1 — Console.log / debug statements
if [ "$SCAN_CMD" = "rg" ]; then
  rg -l "console\.(log|debug|info)" supabase/functions/ --glob="*.ts" 2>/dev/null
  rg -l "console\.(log|debug|info)" minimarket-system/src/ --glob="*.{ts,tsx}" 2>/dev/null
else
  grep -rl "console\.\(log\|debug\|info\)" supabase/functions/ --include="*.ts" 2>/dev/null
  grep -rl "console\.\(log\|debug\|info\)" minimarket-system/src/ --include="*.ts" --include="*.tsx" 2>/dev/null
fi

# A.2 — Tokens/JWTs/API keys hardcodeados
if [ "$SCAN_CMD" = "rg" ]; then
  rg -l -e "ey[A-Za-z0-9\-_]{20,}\.[A-Za-z0-9\-_]{20,}" \
          -e "sk[-_]live[-_][A-Za-z0-9]{20,}" \
          -e "apikey\s*[:=]\s*['\"][A-Za-z0-9]" \
          supabase/functions/ minimarket-system/src/ --glob="*.{ts,tsx}" 2>/dev/null
else
  grep -rlE "ey[A-Za-z0-9\-_]{20,}\.[A-Za-z0-9\-_]{20,}" supabase/functions/ minimarket-system/src/ --include="*.ts" --include="*.tsx" 2>/dev/null
fi

# A.3 — Contrasenas hardcodeadas
if [ "$SCAN_CMD" = "rg" ]; then
  rg -l -e "password\s*[:=]\s*['\"][^'\"$]" \
          -e "secret\s*[:=]\s*['\"][^'\"$]" \
          supabase/functions/ --glob="*.ts" 2>/dev/null
else
  grep -rlE "password\s*[:=]\s*['\"][^'\"$]" supabase/functions/ --include="*.ts" 2>/dev/null
fi

# A.4 — URLs de produccion hardcodeadas (deberian ser env vars)
if [ "$SCAN_CMD" = "rg" ]; then
  rg -l "https://[a-z]+\.supabase\.co" supabase/functions/ --glob="*.ts" 2>/dev/null
else
  grep -rl "https://[a-z]*\.supabase\.co" supabase/functions/ --include="*.ts" 2>/dev/null
fi

# A.5 — TODOs y FIXMEs sin ticket asociado (WARNING, no bloqueante)
if [ "$SCAN_CMD" = "rg" ]; then
  rg -n "TODO|FIXME|HACK|XXX" supabase/functions/ minimarket-system/src/ --glob="*.{ts,tsx}" 2>/dev/null | head -20
else
  grep -rn "TODO\|FIXME\|HACK\|XXX" supabase/functions/ minimarket-system/src/ --include="*.ts" --include="*.tsx" 2>/dev/null | head -20
fi
```

**Decision automatica:**
- Si A.1-A.4 encuentran resultados -> `BLOCKED`. Reportar y NO continuar hasta resolucion.
- Si A.5 encuentra TODOs -> `WARNING`. Continuar pero incluir en reporte.

### FASE B: Sincronizacion Documental

**Objetivo:** Alinear documentacion con realidad del codigo.
**Input:** Resultados de Fase 0 + Fase A, cambios realizados en sesion.
**Output:** Archivos `.md` actualizados.

#### B.1 — Reality Check de Referencias

Antes de actualizar cualquier doc, verificar que lo referenciado EXISTE:

```bash
# Verificar que cada funcion documentada en API_README existe en el codigo
if [ -f "docs/API_README.md" ]; then
  for func_dir in supabase/functions/*/; do
    func_name=$(basename "$func_dir")
    if [ "$func_name" != "_shared" ]; then
      if ! grep -q "$func_name" docs/API_README.md 2>/dev/null; then
        echo "[CODE_HUERFANO] Funcion '$func_name' existe pero no esta documentada en API_README.md"
      fi
    fi
  done
fi

# Verificar que funciones documentadas existen en el codigo
if [ -f "docs/API_README.md" ]; then
  grep -oP '(?<=## |### )\S+' docs/API_README.md 2>/dev/null | while read func; do
    if [ ! -d "supabase/functions/$func" ] && [ ! -f "supabase/functions/$func/index.ts" ]; then
      echo "[DOC_FANTASMA] Funcion documentada '$func' no encontrada en codigo"
    fi
  done
fi
```

#### B.2 — Sincronizacion por Tipo de Cambio

| Si cambio... | Entonces actualizar... |
|---|---|
| `package.json` o `minimarket-system/package.json` | `README.md` (seccion dependencias, scripts) |
| `supabase/functions/*` | `docs/API_README.md` |
| Decision arquitectonica | `docs/DECISION_LOG.md` |
| Variables/secretos (nombres) | Ejecutar auditoria env (ver B.4) |
| `supabase/migrations/*.sql` | `docs/ESQUEMA_BASE_DATOS_ACTUAL.md` |
| `.agent/skills/*` | `docs/ESTADO_ACTUAL.md` (conteo de skills) |
| Cualquier cosa | `docs/ESTADO_ACTUAL.md` |

#### B.3 — Creacion de Archivos Faltantes

Si en FASE 0 se detectaron archivos faltantes, crear con template base:

```markdown
<!-- Template para docs/ESTADO_ACTUAL.md -->
# Estado Actual del Proyecto
> Ultima actualizacion: [FECHA_HOY]
> Actualizado por: DocuGuard v2.0

## Resumen
[PENDIENTE - Completar en proxima sesion]

## Componentes Activos
- [ ] Verificar y listar

## Metricas
- Tests: [PENDIENTE]
- Skills: [CONTAR desde .agent/skills/]
- Funciones Edge: [CONTAR desde supabase/functions/]
```

#### B.4 — Auditoria de Variables de Entorno

```bash
# Verificar que el script existe antes de ejecutar
if [ -f ".agent/scripts/env_audit.py" ]; then
  python3 .agent/scripts/env_audit.py --format markdown 2>/dev/null
else
  echo "[INFO] Script env_audit.py no encontrado."
  echo "       Ejecutando verificacion manual basica..."
  # Fallback: buscar .env.example vs variables usadas
  if [ -f ".env.example" ]; then
    echo "Variables en .env.example:"
    grep -oP '^[A-Z_]+' .env.example 2>/dev/null | sort
  fi
  echo "Variables referenciadas en Edge Functions:"
  grep -roP 'Deno\.env\.get\(["\x27]\K[^"\x27]+' supabase/functions/ 2>/dev/null | sort -u
  echo "Variables referenciadas en Frontend:"
  grep -roP 'import\.meta\.env\.\K[A-Z_]+' minimarket-system/src/ 2>/dev/null | sort -u
fi
```

#### B.5 — Actualizacion de Evidencias de Auditoria

```bash
AUDIT_COUNT=$(ls docs/audit/EVIDENCIA_SP-*.md 2>/dev/null | wc -l)
if [ "$AUDIT_COUNT" -gt 0 ]; then
  echo "[INFO] $AUDIT_COUNT archivos de evidencia encontrados."
  for evidence in docs/audit/EVIDENCIA_SP-*.md; do
    UNRESOLVED=$(grep -c "\[ \]" "$evidence" 2>/dev/null || echo 0)
    RESOLVED=$(grep -c "\[x\]" "$evidence" 2>/dev/null || echo 0)
    echo "  $(basename $evidence): $RESOLVED resueltos, $UNRESOLVED pendientes"
  done
fi
```

### FASE C: Verificacion Cruzada

**Objetivo:** Garantizar consistencia entre TODOS los documentos.
**Input:** Docs actualizados de Fase B.
**Output:** Lista de inconsistencias encontradas (idealmente vacia).

#### C.1 — Freshness Check

```bash
if [ -f "docs/ESTADO_ACTUAL.md" ]; then
  DOC_DATE=$(grep -oP '\d{4}-\d{2}-\d{2}' docs/ESTADO_ACTUAL.md | head -1)
  if [ -n "$DOC_DATE" ]; then
    DAYS_OLD=$(( ($(date +%s) - $(date -d "$DOC_DATE" +%s 2>/dev/null || echo 0)) / 86400 ))
    if [ "$DAYS_OLD" -gt 7 ]; then
      echo "[STALE] ESTADO_ACTUAL.md tiene $DAYS_OLD dias de antiguedad (max: 7)"
      echo "        -> Actualizacion OBLIGATORIA"
    elif [ "$DAYS_OLD" -gt 5 ]; then
      echo "[WARN] ESTADO_ACTUAL.md tiene $DAYS_OLD dias — se acerca al limite"
    else
      echo "[OK] ESTADO_ACTUAL.md actualizado hace $DAYS_OLD dias"
    fi
  else
    echo "[WARN] No se encontro fecha en ESTADO_ACTUAL.md — agregar header con fecha"
  fi
fi
```

#### C.2 — Conteo de Skills

```bash
SKILL_DIRS=$(find .agent/skills -mindepth 1 -maxdepth 1 -type d 2>/dev/null | wc -l)
echo "[INFO] Skills encontrados: $SKILL_DIRS directorios"

# Verificar que docs referencien el numero correcto
if [ -f "docs/ESTADO_ACTUAL.md" ]; then
  DOC_SKILL_COUNT=$(grep -oP '\d+(?=\s*skills?)' docs/ESTADO_ACTUAL.md | head -1)
  if [ -n "$DOC_SKILL_COUNT" ] && [ "$DOC_SKILL_COUNT" != "$SKILL_DIRS" ]; then
    echo "[DESINCRONIZADO] Docs dicen $DOC_SKILL_COUNT skills, existen $SKILL_DIRS"
    echo "                 -> Corregir automaticamente"
  fi
fi

# Verificar project_config.yaml tambien
if [ -f ".agent/skills/project_config.yaml" ]; then
  CONFIG_SKILL_COUNT=$(grep -oP 'skills_total:\s*\K\d+' .agent/skills/project_config.yaml)
  if [ -n "$CONFIG_SKILL_COUNT" ] && [ "$CONFIG_SKILL_COUNT" != "$SKILL_DIRS" ]; then
    echo "[DESINCRONIZADO] project_config.yaml dice skills_total: $CONFIG_SKILL_COUNT, existen $SKILL_DIRS"
  fi
fi
```

#### C.3 — Validacion de Enlaces Internos

```bash
# Buscar referencias a archivos en todos los .md de docs/
find docs/ -name "*.md" -type f 2>/dev/null | while read mdfile; do
  grep -oP '\[.*?\]\(\K[^)]+' "$mdfile" 2>/dev/null | while read link; do
    # Ignorar URLs externas y anclas
    if [[ "$link" != http* ]] && [[ "$link" != "#"* ]]; then
      LINK_DIR=$(dirname "$mdfile")
      TARGET=$(realpath -m "$LINK_DIR/$link" 2>/dev/null || echo "$link")
      if [ ! -e "$TARGET" ] && [ ! -e "$link" ]; then
        echo "[ENLACE_ROTO] $mdfile -> $link (no encontrado)"
      fi
    fi
  done
done
```

#### C.4 — Conteo de Edge Functions

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

  # Verificar contra project_config.yaml
  if [ -f ".agent/skills/project_config.yaml" ]; then
    CONFIG_FUNC_COUNT=$(grep -oP 'functions_deployed:\s*\K\d+' .agent/skills/project_config.yaml)
    if [ -n "$CONFIG_FUNC_COUNT" ] && [ "$CONFIG_FUNC_COUNT" != "$FUNC_COUNT" ]; then
      echo "[DESINCRONIZADO] project_config.yaml dice functions_deployed: $CONFIG_FUNC_COUNT, existen $FUNC_COUNT"
    fi
  fi
fi
```

### FASE D: Reporte de Sincronizacion

**Objetivo:** Generar reporte estructurado con TODOS los hallazgos.
**Input:** Resultados acumulados de fases 0-C.
**Output:** Bloque de texto con formato estandar.

**Formato obligatorio del reporte:**

```markdown
---
## DocuGuard Report v2.0
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

---

## 6. Quality Gates (Pass/Fail)

Cada gate tiene criterio binario — no hay "parcialmente":

| # | Gate | Criterio de PASS | Criterio de FAIL |
|---|------|-----------------|-----------------|
| QG1 | Seguridad | 0 console.log + 0 secretos hardcodeados en backend | >=1 hallazgo -> BLOCKED |
| QG2 | Freshness | `ESTADO_ACTUAL.md` <= 7 dias de antiguedad | > 7 dias -> FAIL |
| QG3 | Consistencia | 0 DOC_FANTASMA + 0 CODE_HUERFANO sin resolver | >=1 sin resolver -> FAIL |
| QG4 | Enlaces | 0 enlaces rotos en `docs/` | >=1 roto -> WARN |
| QG5 | Reporte | Reporte generado con formato completo de Fase D | Reporte incompleto -> FAIL |

**Resultado final:**
- ALL PASS -> Sesion documentada correctamente
- ANY FAIL -> Reportar items pendientes como primera tarea de proxima sesion
- QG1 FAIL -> BLOQUEANTE — no cerrar sesion sin resolver

---

## 7. Anti-Loop / Stop-Conditions

### Limites Duros

- Maximo **3 iteraciones** por fase. Si no resuelve en 3 -> reportar como pendiente.
- Maximo **50 archivos** escaneados por busqueda. Si hay mas -> limitar y reportar.
- **NUNCA** quedarse esperando confirmacion manual.

### Resolucion de Conflictos entre Docs

Priorizar por jerarquia:
1. **Codigo fuente** (verdad absoluta)
2. `docs/ESTADO_ACTUAL.md`
3. `docs/API_README.md`
4. `docs/ESQUEMA_BASE_DATOS_ACTUAL.md`
5. `README.md`

En empate -> priorizar archivo con timestamp mas reciente.
Documentar TODA resolucion de conflicto en `docs/DECISION_LOG.md`.

### Manejo de Errores

| Error | Accion |
|-------|--------|
| Comando no encontrado (`rg`) | Usar `grep` como fallback |
| Archivo referenciado no existe | Marcar `[NO ENCONTRADO]` + continuar |
| Script `env_audit.py` falla | Ejecutar verificacion manual basica (B.4 fallback) |
| Directorio `docs/` no existe | Crear estructura base + WARNING |
| Permiso denegado | Reportar archivo + continuar con el resto |

### Senales de Parada Inmediata

- Deteccion de operacion destructiva en progreso -> STOP + ALERT.
- Mas de 20 DOC_FANTASMA -> Posible reestructuracion mayor -> STOP + reportar "se necesita auditoria completa".
- Loop detectado (misma correccion aplicada 2+ veces) -> STOP + reportar.
