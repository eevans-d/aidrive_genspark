# PERF_BASELINE_20260222.md

**Fecha:** 2026-02-22
**Autor:** Claude Code (automated)
**Proposito:** Baseline de performance versionado para Gate 17 del Production Gate Report.

---

## 1. Build Frontend (Vite 6.4.1)

| Metrica | Valor |
|---------|-------|
| Build time | 4.81 s |
| Modulos transformados | 2,848 |
| PWA precache entries | 27 (2,200.94 KiB) |
| Total JS (raw) | ~2,207 KB |
| Total JS (gzip) | ~479 KB |
| Total CSS (gzip) | 7.91 KB |

### Chunks principales (gzip)

| Chunk | Raw | Gzip |
|-------|-----|------|
| react | 487.46 KB | 127.25 KB |
| scanner (zxing/jsbarcode) | 457.28 KB | 116.76 KB |
| index (app entry) | 230.23 KB | 34.62 KB |
| vendor | 184.74 KB | 63.07 KB |
| supabase | 165.01 KB | 42.68 KB |
| Dashboard | 72.07 KB | 8.72 KB |
| CSS total | 45.13 KB | 7.91 KB |

### Estrategia de chunking

Manual chunks definidos en `vite.config.ts` via `build.rollupOptions.output.manualChunks`:
- `react`, `radix`, `supabase`, `charts`, `icons`, `scanner`, `vendor`
- Code-splitting por ruta (lazy loading de paginas)

---

## 2. Test Suite (Vitest)

| Metrica | Valor |
|---------|-------|
| Archivos de test | 78 |
| Tests totales | 1,640 |
| Tests passed | 1,640 (100%) |
| Tests failed | 0 |
| Duracion total | 26.76 s |
| Transform time | 1.81 s |
| Setup time | 4.60 s |
| Import time | 2.59 s |
| Execution time | 19.59 s |
| Coverage (lines) | 90.07% |

---

## 3. API Health Check (produccion)

Endpoint: `GET /functions/v1/api-minimarket/health`

| Intento | HTTP | Tiempo total | Tiempo conexion |
|---------|------|-------------|-----------------|
| 1 (cold) | 200 | 1.974 s | 0.086 s |
| 2 (warm) | 200 | 1.097 s | 0.077 s |
| 3 (warm) | 200 | 1.041 s | 0.081 s |

- **Latencia media (warm):** ~1.07 s
- **Cold start:** ~1.97 s
- **Nota:** Latencia incluye round-trip desde WSL2 a us-east-1.

---

## 4. Cron Jobs (produccion)

| Job | Schedule | Estado | Runs totales |
|-----|----------|--------|-------------|
| notificaciones-tareas_invoke | `0 */2 * * *` | active | parte de 409 |
| alertas-stock_invoke | `0 * * * *` | active | parte de 409 |
| reportes-automaticos_invoke | `0 8 * * *` | active | parte de 409 |
| maintenance_cleanup | `0 4 * * 0` | active | parte de 409 |
| daily_price_update | `0 2 * * *` | active | parte de 409 |
| weekly_trend_analysis | `0 3 * * 0` | active | parte de 409 |
| realtime_change_alerts | `*/15 * * * *` | active | parte de 409 |

- Total runs registrados en `cron.job_run_details`: **409**
- Status de ultimos 20 runs: **todos `succeeded`**

---

## 5. PWA / Caching

- `registerType: autoUpdate`
- Runtime caching para Supabase API: `NetworkFirst`, max 50 entries, TTL 5 min
- Precache de assets estaticos: js, css, html, svg, png, woff2

---

## 6. Observaciones y oportunidades

1. **scanner chunk (117 KB gz):** Mayor candidato a lazy-loading condicional (solo se usa en POS/inventario).
2. **No hay Lighthouse CI configurado.** Recomendado para futuras iteraciones.
3. **No hay Web Vitals integrado.** Considerar `web-vitals` para RUM en produccion.
4. **Health endpoint latencia:** 1.0-1.9s es aceptable para Edge Functions con cold start, pero monitorear si escala.

---

## Clasificacion

- **Datos de build/test:** REAL (medido en esta sesion)
- **Datos de API:** REAL (medido via curl a produccion)
- **Datos de cron:** REAL (verificado contra cron.job y cron.job_run_details en produccion)
