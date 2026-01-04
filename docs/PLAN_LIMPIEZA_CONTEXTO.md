# 🧹 PLAN DE LIMPIEZA Y REDUCCIÓN DE CONTEXTO

**Fecha:** 4 de enero de 2026  
**Objetivo:** Reducir contexto innecesario para optimizar análisis de Codex  
**Impacto logrado:** -34 MB, -125 archivos legacy

---

## 📊 ESTADO ACTUAL

| Carpeta | Tamaño | Archivos | Estado |
|---------|--------|----------|--------|
| `_archive/` | 34 MB | 125 | ✅ ELIMINADO |
| `test/` | 24 KB | 2 | ✅ CONSOLIDADO en tests/ |
| `tests/` | 1.8 MB | ~50 | ✅ DESTINO |

---

## ✅ PASO 1: ELIMINAR `_archive/` (COMPLETADO)

**Justificación:**
- Contiene solo documentación legacy marcada como "no usar"
- Las fuentes de verdad actuales están en `docs/`
- Todo está respaldado en git history

**Comando:**
```bash
rm -rf _archive/
```

**Verificación:**
```bash
ls -la | grep archive  # No debe aparecer
```

---

## ✅ PASO 2: CONSOLIDAR `test/` → `tests/` (COMPLETADO)

**Archivos a mover:**
- `test/edge-functions.test.js` → `tests/e2e/edge-functions.test.js`
- `test/setup.js` → `tests/setup-edge.js`

**Comandos:**
```bash
mkdir -p tests/e2e
mv test/edge-functions.test.js tests/e2e/
mv test/setup.js tests/setup-edge.js  # Renombrar para evitar conflicto
rm -rf test/
```

**Verificación (post-ejecución):**
```bash
ls tests/e2e/  # Debe mostrar edge-functions.test.js
ls test/       # Debe fallar (no existe)
```

---

## ✅ PASO 3: LIMPIAR CONFIGS DUPLICADAS

**Evaluar y unificar:**
- `jest.config.js` (raíz) vs `tests/jest.config.js`
- `vitest.config.ts` (raíz)

**Decisión:** Mantener Vitest como framework principal (más moderno, compatible con Vite).

---

## ✅ PASO 4: ACTUALIZAR `.gitignore`

Agregar:
```
# Legacy eliminado
_archive/
```

---

## ✅ PASO 5: ACTUALIZAR DOCUMENTACIÓN

Archivos a actualizar:
- `docs/PROMPTS_CODEX_MINIMARKET.md` - Eliminar referencias a _archive
- `.github/copilot-instructions.md` - Actualizar estructura
- `README.md` (si menciona _archive)

---

## 📈 RESULTADO ESPERADO

| Métrica | Antes | Después | Reducción |
|---------|-------|---------|-----------|
| Archivos legacy | 125 | 0 | -100% |
| Tamaño contexto | ~36 MB | ~2 MB | -94% |
| Carpetas de tests | 2 | 1 | -50% |
| Confusión potencial | Alta | Baja | ✅ |

---

## 🚀 EJECUTAR AHORA

```bash
# Todo en un solo bloque
cd /home/eevan/ProyectosIA/aidrive_genspark

# Paso 1: Eliminar archive
rm -rf _archive/

# Paso 2: Consolidar tests
mkdir -p tests/e2e
mv test/edge-functions.test.js tests/e2e/
mv test/setup.js tests/setup-edge.js
rm -rf test/

# Paso 3: Verificar
echo "=== Verificación ==="
ls -la | grep -E "archive|test"
ls tests/e2e/
echo "=== Limpieza completada ==="
```

---

*Plan generado: 4 de enero de 2026*
