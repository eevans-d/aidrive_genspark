# EVIDENCIA SP-F — Utilidad Real

> Fecha: 2026-02-11
> Commit: `3b1a8b0`
> Ejecutor: Antigravity (Gemini)

---

## F1 — ¿RESUELVE EL PROBLEMA REAL?

**Pregunta central:** ¿Un dueño de minimarket puede gestionar su negocio diario con este sistema?

| Necesidad del negocio | Cubierta por | Estado | Gap | Prioridad |
|----------------------|-------------|--------|-----|-----------|
| **Saber cuánto tengo de cada producto** | Stock.tsx + Deposito.tsx + Kardex.tsx | ✅ | Stock y Kardex funcionales con ErrorMessage. Deposito sin ErrorMessage (toast.error). Datos correctos si migraciones aplicadas. | **P0** |
| **Vender con registro completo** | Pos.tsx + Pocket.tsx | ⚠️ | POS funcional (carrito → stock → kardex). Idempotencia UUID ✅. PERO: sin ErrorMessage, sin Skeleton, sin Layout. WhatsApp recibo BLOCKED. Pocket confunde error con vacío. | **P0** |
| **Gestionar clientes con CC** | Clientes.tsx + cuentasCorrientesApi | ⚠️ | CRUD clientes funcional. CC fiado con validación de límite. Sin ErrorMessage. Sin Skeleton. Dashboard muestra "dinero en la calle". | **P0** |
| **Comparar precios con proveedores** | scraper + insightsApi → Rentabilidad | ⚠️ | Scraping existe pero riesgo timeout Free plan (60s vs 300s). Formato moneda inconsistente en Rentabilidad (.toFixed()). | **P1** |
| **Recibir alertas** | alertas-stock + alertas-vencimientos + notificaciones-tareas | ❌ | 3 cron jobs sin auth → probable 401. alertas-vencimientos huérfana. Sin canal de entrega real (ni email, ni Slack, ni push). | **P1** |
| **Ver reportes de mi negocio** | Dashboard + Rentabilidad + reportes-automaticos | ⚠️ | Dashboard funcional con stats. Rentabilidad funcional. reportes-automaticos: cron sin auth + sin canal. Sin exportación PDF/CSV. | **P1** |

### Criterio F1

- ✅ **P0 Inventario:** PASS (Stock + Deposito + Kardex funcionales)
- ⚠️ **P0 Ventas:** PARCIAL (POS funcional pero gaps UX significativos)
- ⚠️ **P0 Clientes/CC:** PARCIAL (funcional pero sin ErrorMessage)
- ⚠️ **P1 Precios:** PARCIAL (riesgo timeout)
- ❌ **P1 Alertas:** FALLA (sin canal de entrega)
- ⚠️ **P1 Reportes:** PARCIAL (Dashboard OK, reportes automáticos rotos)

**Veredicto F1:** 1/3 P0 en ✅, 2/3 P0 en ⚠️, y 1/3 P1 en ❌ → **NO cumple criterio F1** (requiere 3/3 P0 en ✅ + 2/3 P1 en ✅ o ⚠️). Operaciones core son funcionales (⚠️) pero con gaps UX que impactan la confiabilidad percibida.

---

## F2 — ¿VALOR DESDE EL MINUTO 1?

| Paso del primer uso | Funciona | UX | Fricción | Mejora sugerida |
|---------------------|----------|----|---------|-----------------| 
| Crear primer usuario | ⚠️ | Solo via Supabase dashboard (no hay registro self-service) | ALTA | No hay formulario de registro. Requiere admin con acceso a Supabase → no es self-service. | Agregar flujo de registro o documentar proceso claro. |
| Login | ✅ | Funcional. Redirige a `/` correctamente. div rojo para errores. | BAJA | Patrón de error funcional pero no estandarizado. | Adoptar ErrorMessage |
| Dashboard con 0 datos | ⚠️ | Skeleton ✅ durante carga. Pero con 0 datos → cards muestran "0" sin empty state explicativo. | MEDIA | Sin onboarding wizard. Sin indicación de "Empiece cargando productos". | Agregar empty state con call-to-action |
| Cargar primer producto | ⚠️ | Productos.tsx con ErrorMessage + Skeleton ✅. PERO: formulario de creación viable. | BAJA | Intuitivo si el operador encuentra la ruta. | — |
| Primera venta | ⚠️ | POS funciona con 1 producto. Solo `toast.error` para errores. Sin Layout → sin menú de navegación visible. | MEDIA | ¿Cómo vuelve al Dashboard? Sin botón "volver" explícito en POS. | Agregar botón de retorno |
| ¿Datos seed? | ❌ | BD vacía. Sin datos de ejemplo. | ALTA | Primera impresión con pantallas vacías. | Agregar seed data opcional |
| ¿Guía de primer uso? | ❌ | Sin onboarding wizard ni tutorial. Sin instrucciones en-app. | ALTA | Operador necesita instrucción externa. | Crear onboarding mínimo |
| ¿Funciones sin cron? | ✅ | Stock y POS funcionan sin cron jobs. Solo alertas y scraping dependen de cron. | BAJA | Funciones core son independientes. | — |

**Métrica TTFV (Time to First Value):** BLOCKED (requiere runtime). Estimación estática: con datos manuales (sin seed), un operador experto tardaría ~25-30 min para primer producto + primera venta + verificación en Kardex. **Excede umbral de 20 min** por falta de onboarding y datos seed.

---

## F3 — FUNCIONALIDAD QUE NADIE USARÁ

| Feature | Líneas | Usuario objetivo | ¿Minimarket lo necesita? | Veredicto | Acción |
|---------|--------|-----------------|------------------------|-----------|--------|
| `cron-testing-suite` | 1,424 | DevOps/QA | No en producción | **INNECESARIO** (dev-only) | DOCUMENTAR como herramienta dev |
| `cron-dashboard` | 1,283 | DevOps/Admin | Sin frontend → no accesible | **INNECESARIO** | DOCUMENTAR o ELIMINAR |
| `cron-health-monitor` | 958 | SRE | Sin trigger → no ejecuta | **INNECESARIO** pero potencialmente útil | CONECTAR con cron o DOCUMENTAR |
| `cron-notifications` | 1,282 | Sistema | Potencial si se conecta a canal real | **OVERKILL** en estado actual (solo simulación) | INVESTIGAR: conectar a SMTP/Slack real |
| `circuit-breaker.ts` | ~200 | Arquitecto | Overkill para ~200 tx/día | **OVERKILL** pero conservar como seguro | CONSERVAR |
| `audit.ts` | ~150 | Compliance | 1/13 funciones lo usa | **OVERKILL** | CONSERVAR pero evaluar adopción |
| `anti-detection.ts` + `cookie-jar.ts` | ~300 | Scraper | Necesario si Maxiconsumo bloquea | **NECESARIO** | CONSERVAR |
| `api-minimarket/routers/` | 1,023 | Nadie (ghost code) | Ghost code — NUNCA importado | **INNECESARIO** | ELIMINAR |
| `docs/closure/` | 42 archivos | Desarrollo | Históricos de sesión | **INNECESARIO** post-producción | ARCHIVAR |
| Rate-limit RPC-backed | 273 | Arquitecto | Sofisticado para MVP | **OVERKILL** pero bien implementado | CONSERVAR |

### Resumen F3

| Categoría | Líneas total | Archivos |
|-----------|-------------|---------|
| INNECESARIO | ~4,688 + 42 docs | 4 EFs + routers/ + closure |
| OVERKILL (conservar) | ~1,905 | circuit-breaker, audit, rate-limit, cron-notifications |
| NECESARIO | ~300 | anti-detection, cookie-jar |

**Total potencialmente innecesario en producción:** ~4,688 líneas de código + 42 archivos docs de closure.
