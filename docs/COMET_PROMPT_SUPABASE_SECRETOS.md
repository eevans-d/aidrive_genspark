# 🛰️ COMET Prompt — Obtención segura de secretos desde Supabase (v1.1)

**Proyecto:** `aidrive_genspark` (Mini Market System)  
**Objetivo:** Recuperar **solo** secretos pendientes **desde Supabase**, aplicarlos en el entorno correcto **sin exponer valores** y dejar evidencia documental **solo de estado**.

---

## 🎯 Rol y alcance
Eres COMET con acceso operativo al **Dashboard de Supabase**. Debes:
- Identificar secretos pendientes.
- Obtenerlos desde Supabase (si existen ahí).
- Aplicarlos en local/CI/Edge Functions **sin imprimirlos**.
- Actualizar docs **solo con estado**, nunca valores.

**No hagas:**
- No publiques secretos en chat, docs, logs ni commits.
- No guardes secretos en archivos versionados.
- No inventes valores si no están en Supabase.

---

## 📚 Fuentes de verdad (leer primero)
1. `docs/SECRETOS_REQUERIDOS_Y_VALIDACION.md`
2. `docs/OBTENER_SECRETOS.md`
3. `docs/ESTADO_ACTUAL.md`
4. `docs/mpc/C2_SUBPLAN_E9_v1.1.0.md`

---

## ✅ Checklist operativo (obligatorio)

### A) Pre‑flight
- [ ] Tienes acceso al proyecto Supabase correcto (ref/URL en `docs/ESTADO_ACTUAL.md`).
- [ ] Leíste inventario de secretos y marcaste cuáles están **pendientes**.
- [ ] Confirmaste que `.env` está en `.gitignore`.

### B) Obtención desde Supabase
- [ ] **Project Settings → API**: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.
- [ ] **Project Settings → Database → Connection string**: `DATABASE_URL` (preferir pooler si aplica).
- [ ] **Project Settings → Edge Functions → Secrets**: `API_PROVEEDOR_SECRET`, `ALLOWED_ORIGINS`.

### C) Aplicación segura
- [ ] Guardaste secretos en `.env` / `.env.test` / secretos de CI **sin imprimir valores**.
- [ ] Verificaste que ningún secreto quedó en archivos versionados.

### D) Documentación (solo estado)
- [ ] `docs/SECRETOS_REQUERIDOS_Y_VALIDACION.md` actualizado (✅/⚠️ + fecha + fuente “Supabase”).
- [ ] `docs/OBTENER_SECRETOS.md` actualizado (rutas y pasos si cambiaron).
- [ ] `docs/DECISION_LOG.md` actualizado (registro de obtención/rotación **sin valores**).

### E) Validaciones mínimas (sin exponer valores)
- [ ] `./migrate.sh status staging` (si hay acceso).
- [ ] `scripts/run-integration-tests.sh --dry-run`.
- [ ] `rg -n "SUPABASE_SERVICE_ROLE_KEY" minimarket-system` → **0 resultados**.
- [ ] `git ls-files -z | xargs -0 rg -n "eyJ[A-Za-z0-9_-]{10,}"` → **sin tokens reales**.

---

## 🔍 Paso a paso (resumen)
1. Releer inventario y marcar pendientes.
2. Obtener desde Supabase **solo** los secretos pendientes.
3. Aplicarlos en local/CI/Edge Functions **sin exponer valores**.
4. Actualizar documentación con estado.
5. Ejecutar validaciones mínimas.
6. Reportar resultados y bloqueadores.

---

## 🧾 Plantilla de salida (obligatoria)

```
### Secretos obtenidos (sin valores)
- SUPABASE_URL ✅ (Supabase Settings > API)
- SUPABASE_ANON_KEY ✅ (Supabase Settings > API)
- SUPABASE_SERVICE_ROLE_KEY ✅ (Supabase Settings > API)
- DATABASE_URL ✅ (Supabase Settings > Database)
- API_PROVEEDOR_SECRET ✅ (Supabase Edge Functions > Secrets)
- ALLOWED_ORIGINS ✅ (Supabase Edge Functions > Secrets)

### Documentación actualizada
- docs/SECRETOS_REQUERIDOS_Y_VALIDACION.md ✅
- docs/OBTENER_SECRETOS.md ✅
- docs/DECISION_LOG.md ✅

### Validaciones
- migrate.sh status staging ✅/⚠️
- run-integration-tests --dry-run ✅/⚠️

### Bloqueadores
- Ninguno / [listar secretos faltantes con nombre exacto]
```

---

## 🚫 Regla de oro
**Nunca** pegues valores secretos en chat, docs o commits. Solo reporta **estado**.
