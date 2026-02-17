# Protocolo de Contraste para Nueva Sesion IA

- Fecha: `2026-02-17`
- Objetivo: que cualquier agente nuevo pueda contrastar de forma repetible el reporte preprod (estado en progreso) contra la obra objetivo final (estado meta de produccion).

---

## 1) Orden de lectura obligatorio

1. `docs/closure/CONTINUIDAD_SESIONES.md`
2. `docs/ESTADO_ACTUAL.md`
3. `docs/closure/OPEN_ISSUES.md`
4. `docs/closure/REPORTE_AUDITORIA_PREPRODUCCION_DEFINITIVO_2026-02-16.md`
5. `docs/closure/OBRA_OBJETIVO_FINAL_PRODUCCION/README.md`
6. `docs/closure/OBRA_OBJETIVO_FINAL_PRODUCCION/MATRIZ_CONTRASTE_PREPROD_VS_OBJETIVO.md`

---

## 2) Comandos de verificacion obligatorios (sin secretos)

```bash
git status --short
git ls-files | wc -l
find supabase/functions -mindepth 1 -maxdepth 1 -type d ! -name '_shared' | wc -l
find supabase/migrations -maxdepth 1 -type f -name '*.sql' | wc -l

python3 - <<'PY'
from pathlib import Path
import yaml
for f in ['docs/api-openapi-3.1.yaml','docs/api-proveedor-openapi-3.1.yaml']:
    try:
        yaml.safe_load(Path(f).read_text())
        print(f'{f}: OK')
    except Exception as e:
        print(f'{f}: ERROR -> {str(e).splitlines()[0]}')
PY

python3 - <<'PY'
import re
from pathlib import Path
s = Path('supabase/functions/api-minimarket/index.ts').read_text()
lit = re.findall(r"if \(path === '([^']+)' && method === '([A-Z]+)'\)", s)
mat = re.findall(r"if \(path\.match\((/\^.*?\$/)\) && method === '([A-Z]+)'\)", s)
print('api-minimarket literal_ops=', len(lit))
print('api-minimarket regex_ops=', len(mat))
print('api-minimarket total_guards=', len(lit) + len(mat))
PY

python3 - <<'PY'
import yaml
from pathlib import Path
spec = yaml.safe_load(Path('docs/api-proveedor-openapi-3.1.yaml').read_text())
spec_paths = set(spec.get('paths', {}).keys())
runtime = {'/precios','/productos','/comparacion','/sincronizar','/status','/alertas','/estadisticas','/configuracion','/health'}
print('spec_only=', sorted(spec_paths - runtime))
print('runtime_only=', sorted(runtime - spec_paths))
PY

node scripts/validate-doc-links.mjs
ls -1t test-reports/quality-gates_*.log | head -1
```

Notas:
- No imprimir tokens/JWT/secretos (solo nombres de variables).
- No usar comandos destructivos de git.
- Si `PyYAML` faltara, marcar `NO ACCESIBLE - REQUIERE REVISION MANUAL`.

---

## 3) Procedimiento de contraste

1. Completar la matriz eje por eje (`ALINEADO`, `PARCIAL`, `NO_ALINEADO`, `NO_APLICA`).
2. En cada eje no alineado/parcial registrar:
   - causa tecnica exacta,
   - ruta afectada (codigo o docs),
   - criterio objetivo incumplido.
3. Resolver contradicciones por jerarquia:
   - codigo fuente,
   - `docs/ESTADO_ACTUAL.md`,
   - `docs/API_README.md`,
   - paquete `OBRA_OBJETIVO_FINAL_PRODUCCION`,
   - reporte preprod historico.
4. Si el reporte preprod dice algo que ya no coincide con codigo actual, marcarlo como `HALLAZGO HISTORICO SUPERADO` (no borrarlo sin dejar traza).

---

## 4) Priorizacion obligatoria de cierre

1. Seguridad y contratos (`api-proveedor`, auth, RLS, metodos HTTP).
2. Calidad reproducible (quality gates con integration real).
3. Operacion productiva (backup, restore drill, monitoreo, continuidad).
4. Performance y mejoras no bloqueantes.

---

## 5) Plantilla de salida para el agente IA

```markdown
# Resultado de Contraste (YYYY-MM-DD HH:MM UTC)

## Resumen
- Ejes alineados: X/18
- Ejes parciales: Y/18
- Ejes no alineados: Z/18
- Veredicto: ALINEADO / PARCIAL / NO ALINEADO

## Hallazgos criticos
1. [descripcion] - [ruta]

## Hallazgos importantes
1. [descripcion] - [ruta]

## Hallazgos menores
1. [descripcion] - [ruta]

## Hallazgos historicos superados (si aplica)
1. [descripcion previa] -> [estado actual verificado]

## Acciones para acercar la pintura a la obra
1. [accion]
2. [accion]
3. [accion]
```

---

## 6) Criterio final de exito

El contraste se considera cerrado cuando:

1. La matriz queda sin ejes `NO_ALINEADO`.
2. Ejes criticos `4`, `5`, `12` y `18` quedan `ALINEADO`.
3. `docs/ESTADO_ACTUAL.md` y `docs/closure/OPEN_ISSUES.md` reflejan el mismo veredicto operativo sin contradicciones.
