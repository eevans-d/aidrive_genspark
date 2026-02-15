# Security Audit Report
> Este archivo comenzó como un reporte de *dependencias* (2026-01-23). Se conserva el historial abajo.

**Última actualización:** 2026-02-15  

---

## Addendum 2026-02-15 — P0 Resueltos (RLS + search_path)

### Migración aplicada
- `supabase/migrations/20260215100000_p0_rls_internal_tables_and_search_path.sql`

### Correcciones
1. **RLS habilitado** en `circuit_breaker_state`, `rate_limit_state`, `cron_jobs_locks` (PART 1).
2. **Grants revocados** a `anon`/`authenticated` en las 3 tablas; solo `service_role` retiene acceso (PART 2).
3. **`search_path = public`** fijado en `sp_aplicar_precio(uuid, numeric, numeric)` (PART 3).

### Estado RLS post-fix (esperado tras `supabase db push`)
| Tabla | RLS Habilitado | Grants anon/authenticated | Estado |
|-------|----------------|---------------------------|--------|
| `circuit_breaker_state` | Si | Ninguno (REVOKE ALL) | **PROTEGIDA** |
| `rate_limit_state` | Si | Ninguno (REVOKE ALL) | **PROTEGIDA** |
| `cron_jobs_locks` | Si | Ninguno (REVOKE ALL) | **PROTEGIDA** |

### SECURITY DEFINER post-fix
| Funcion | search_path | Estado |
|---------|-------------|--------|
| `sp_aplicar_precio` | `public` | **CORREGIDA** |

### Evidencia
- Pre-fix: `docs/closure/EVIDENCIA_RLS_AUDIT_2026-02-13.log`
- Post-fix: `docs/closure/EVIDENCIA_RLS_AUDIT_2026-02-15_POST_FIX.md`
- Pendiente: evidencia remota post-`supabase db push` (re-ejecutar `scripts/rls_audit.sql`).

---

## Addendum 2026-02-15 — SecurityAudit Complementario (Full Audit)

### CRITICAL
- ~~**Tablas sin RLS habilitado (exposición potencial vía Data API/PostgREST):**~~
  - `circuit_breaker_state`
  - `rate_limit_state`
  - `cron_jobs_locks`
  - Evidencia: `docs/closure/EVIDENCIA_RLS_AUDIT_2026-02-13.log` (secciones 1, 3 y 6: RLS `DISABLED` + grants a `anon`/`authenticated`).
  - Estado en repo: no hay `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` para estas 3 tablas en `supabase/migrations/`.
  - ~~Recomendación: agregar migración de hardening que (1) habilite RLS y (2) revoque privilegios explícitos a `anon`/`authenticated` (defensa en profundidad).~~
  - **RESUELTO:** Migración `20260215100000_p0_rls_internal_tables_and_search_path.sql` (PART 1+2).

- ~~**SECURITY DEFINER sin `search_path` fijo (riesgo de `mutable search_path`):**~~
  - `public.sp_aplicar_precio(...)` se redefine sin `SET search_path = public` en `supabase/migrations/20260212100000_pricing_module_integrity.sql`.
  - Evidencia: `docs/closure/EVIDENCIA_RLS_AUDIT_2026-02-13.log` (sección 5: `sp_aplicar_precio` marcado como "⚠️ SIN search_path").
  - ~~Recomendación: agregar migración que aplique `ALTER FUNCTION ... SET search_path = public` después de la última redefinición.~~
  - **RESUELTO:** Migración `20260215100000_p0_rls_internal_tables_and_search_path.sql` (PART 3).

### HIGH
- **CORS wildcard** (`Access-Control-Allow-Origin: *`) en `supabase/functions/scraper-maxiconsumo/index.ts`.
  - Nota: el endpoint está protegido por `validateApiSecret`, pero el wildcard mantiene superficie browser abierta si el secret se filtra.

### MEDIUM
- **Fixtures con patrones tipo JWT/API keys en tests unitarios** (no son secretos reales, pero pueden disparar scanners):
  - `tests/unit/security-gaps.test.ts`
  - `tests/unit/strategic-high-value.test.ts`

### Estado RLS (extracto, actualizado 2026-02-15)
| Tabla | RLS Habilitado | Policies | Estado |
|-------|----------------|----------|--------|
| `circuit_breaker_state` | Si (migración 20260215100000) | 0 (service_role only) | **PROTEGIDA** |
| `rate_limit_state` | Si (migración 20260215100000) | 0 (service_role only) | **PROTEGIDA** |
| `cron_jobs_locks` | Si (migración 20260215100000) | 0 (service_role only) | **PROTEGIDA** |

---

**Fecha:** 2026-01-23  
**Ejecutado por:** WS7.2 - Security Scan  

## Addendum 2026-02-12 — Seguridad Aplicativa (RLS/Roles)

**Objetivo:** cerrar la validación fina de RLS por rol (P1) y eliminar bypasses típicos (PostgREST/RPC).

### CRITICAL
- (none) No se detectaron tablas críticas sin RLS ni secretos hardcodeados en los cambios auditados.

### HIGH
- CORS wildcard detectado (revisar exposición real y restringir si hay consumo browser):
  - `supabase/functions/scraper-maxiconsumo/index.ts`
  - `supabase/functions/cron-jobs-maxiconsumo/index.ts`

### MEDIUM
- Normalización de rol legacy `jefe`:
  - Tratado como alias legacy de `admin` en FE/BE; en DB se normaliza `personal.rol` a roles canónicos.
  - Migración aplicada: `supabase/migrations/20260212130000_rls_fine_validation_lockdown.sql`.

### LOW
- Recomendación: mantener la batería `scripts/rls_fine_validation.sql` como verificación periódica antes de cada release (staging y luego prod).

### Evidencia (sin secretos)
- Auditoría RLS (post): `docs/closure/EVIDENCIA_RLS_AUDIT_2026-02-12.log`
- Validación fina (post, `write_tests=1`, 0 FAIL): `docs/closure/EVIDENCIA_RLS_FINE_2026-02-12.log`

---

## Resumen Ejecutivo

| Paquete | Vulnerabilidades | Severidad Máxima |
|---------|------------------|------------------|
| Raíz (`/`) | 0 | - |
| Frontend (`minimarket-system/`) | 1 | Moderate |
| Tests (`tests/`) | Sin lockfile | N/A |

---

## Detalle por Proyecto

### 1. Proyecto Raíz (`/`)

```
found 0 vulnerabilities
```

✅ **Sin vulnerabilidades detectadas**

---

### 2. Frontend (`minimarket-system/`)

```
# npm audit report

lodash  4.0.0 - 4.17.21
Severity: moderate
Lodash has Prototype Pollution Vulnerability in `_.unset` and `_.omit` functions
https://github.com/advisories/GHSA-xxjr-mmjv-4gpg

1 moderate severity vulnerability
```

**Análisis:**
- **Paquete afectado:** `lodash@4.17.21`
- **Dependencia de:** `recharts@2.15.4` (librería de gráficos)
- **Tipo:** Transitiva (no directa)
- **Severidad:** Moderate
- **Vulnerabilidad:** Prototype Pollution en `_.unset` y `_.omit`

**Riesgo en contexto:**
- `recharts` usa lodash internamente para manipulación de datos
- Las funciones `_.unset` y `_.omit` NO son llamadas directamente por el código del proyecto
- El vector de ataque requiere input malicioso controlado por usuario que llegue a estas funciones
- **Impacto real: BAJO** - La aplicación no expone rutas que permitan explotar esta vulnerabilidad

**Recomendación:**
1. Monitorear actualizaciones de recharts que actualicen lodash
2. No requiere acción inmediata dado el bajo riesgo
3. Considerar issue en recharts si persiste >6 meses

---

### 3. Tests (`tests/`)

- No tiene `package-lock.json`
- Las dependencias de test están en el `package.json` raíz
- ✅ Cubierto por audit del proyecto raíz

---

## Acciones Tomadas

1. ✅ Audit ejecutado en todos los proyectos
2. ✅ Vulnerabilidades documentadas
3. ✅ Análisis de riesgo realizado
4. ✅ Recomendaciones establecidas

## Próximo Audit

- **Programado:** Próxima iteración de mantenimiento
- **Trigger automático:** Cuando se actualicen dependencias

---

## Comandos de Referencia

```bash
# Ejecutar audit completo
npm audit                    # Raíz
cd minimarket-system && npm audit  # Frontend

# Fix automático (con precaución)
npm audit fix

# Ver árbol de dependencias
npm ls <paquete>
```

---

*Generado automáticamente por WS7.2*
