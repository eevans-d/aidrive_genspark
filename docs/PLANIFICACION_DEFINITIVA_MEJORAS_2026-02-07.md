# PLANIFICACION DEFINITIVA MEJORAS MINIMARKET (2026-02-07)

**Archivo a crear (por el agente ejecutor):** `docs/PLANIFICACION_DEFINITIVA_MEJORAS_2026-02-07.md`  
**Baseline / fuente de verdad:** working tree actual en `/home/eevan/ProyectosIA/aidrive_genspark` (2026-02-07). Hay cambios locales y archivos nuevos sin commit; NO asumir que `HEAD/main` contiene todo.

---

**Objetivo**
Plan ejecutable y compatible con el proyecto real para implementar mejoras priorizadas:

1. Arbitraje de precios en tiempo real (scraper Maxiconsumo) con “acción directa”.
2. Pocket Manager (depósito móvil) como PWA, cámara/scanner y 3 acciones gigantes.
3. POS MVP + Fiados/Cuenta Corriente vecinal.
4. Anti-mermas por caducidad: zona de oferta (sugerir + 1 clic) y etiquetas.
5. Bitácora digital de turno (nota al logout).
6. UX quick wins (semáforos, Ctrl+K/Scan & Action, optimistic UI).

---

**Reglas operativas para el agente ejecutor (Copilot/Antigravity)**
1. Verificar baseline antes de tocar nada:
   1. `git status --porcelain=v1` debe ser revisado y documentado en el PR/issue.
   2. Si el agente trabaja desde un clon limpio (Antigravity), estos archivos pueden NO existir aún: `minimarket-system/src/components/GlobalSearch.tsx`, `minimarket-system/src/components/AlertsDrawer.tsx`, `minimarket-system/src/hooks/useAlertas.ts`, `supabase/functions/api-minimarket/handlers/search.ts`. En ese caso, primero hay que incorporar esos cambios (commit/branch o sincronizar workspace) o adaptar el plan al estado del clon.
2. No ejecutar comandos destructivos (prohibido): `git reset --hard`, `git checkout -- <archivo>`, revertir cambios ajenos, “limpiar” working tree sin decisión explícita del dueño.
3. No reimplementar lo ya existente:
   1. Ya existe Ctrl+K + búsqueda global + escáner wedge.
   2. Ya existe drawer de alertas y hook `useAlertas`.
   3. Ya existe scraper Maxiconsumo y tablas de comparación/alertas.
4. Cada fase debe cerrar con:
   1. tests pasados (comandos abajo),
   2. actualización de docs mínimas (`docs/ESTADO_ACTUAL.md`, `docs/DECISION_LOG.md`, OpenAPI si cambió API),
   3. evidencia (logs de test / recuentos).

---

**Comandos de verificación (obligatorios)**
1. Backend (raíz):
   1. `npm run test:unit`
   2. `npm run test:integration`
   3. `npm run test:e2e`
2. Frontend:
   1. `pnpm -C minimarket-system lint`
   2. `pnpm -C minimarket-system build`
   3. `pnpm -C minimarket-system test:components`
3. Nota entorno:
   1. `deno` puede no estar disponible en algunos hosts; si no está, documentar y compensar con tests unitarios + revisión estática.

---

**Verificación intensiva (confirmada en repo real)**
1. Existe búsqueda global + Ctrl+K + escáner wedge:
   1. UI `minimarket-system/src/components/GlobalSearch.tsx`
   2. Hook `minimarket-system/src/hooks/useScanListener.ts`
   3. API `supabase/functions/api-minimarket/handlers/search.ts`
   4. Ruta en gateway `GET /search`
2. Existe drawer de alertas:
   1. UI `minimarket-system/src/components/AlertsDrawer.tsx`
   2. Hook `minimarket-system/src/hooks/useAlertas.ts`
   3. Consume `mv_stock_bajo`, `mv_productos_proximos_vencer`, `vista_alertas_activas`, `tareas_pendientes`
3. Existe scraper Maxiconsumo:
   1. `supabase/functions/scraper-maxiconsumo/*`
   2. Tablas: `precios_proveedor`, `comparacion_precios`, `alertas_cambios_precios`
4. Existe módulo Pedidos + Clientes base:
   1. Migraciones `supabase/migrations/20260206*.sql`
   2. UI `minimarket-system/src/pages/Pedidos.tsx`
5. Riesgos técnicos detectados que BLOQUEAN crecimiento (Fase 0):
   1. Permisos por ruta en frontend: `minimarket-system/src/lib/roles.ts` no incluye `/pedidos` y “ruta no configurada = libre”.
   2. Bug de ubicación depósito: `/deposito/movimiento` usa `motivo` como fallback de origen y `sp_movimiento_inventario` calcula `ubicacion=COALESCE(destino,origen,'Principal')`, contaminando `stock_deposito.ubicacion`.
   3. Scraper alertas: `tipo_cambio` puede salir mal porque deriva signo desde `diferencia_absoluta` (frecuentemente absoluta).

---

**Decisiones cerradas (no se deciden durante implementación)**
1. Arbitraje en POS: “alerta roja + confirmación explícita” (no bloqueo definitivo).
2. Anti-mermas: “sugerir + 1 clic” (no auto-aplicar).
3. Descuento sugerido anti-mermas: 30% OFF.
4. Umbral “comprar ahora”: caída de costo proveedor >= 10% vs comparación previa disponible.
5. Crédito fiado:
   1. `limite_credito` si está definido: se respeta.
   2. `limite_credito` NULL: no bloquea (equivale a “sin límite”), pero el UI debe mostrar warning visible para que el dueño lo configure.

---

**Fase 0 — Hardening previo (bloquea el resto)**
**Objetivo:** corregir seguridad/consistencia para evitar implementaciones “sobre arena”.

1. Permisos por rutas (deny-by-default)
   1. Cambiar `minimarket-system/src/lib/roles.ts`:
      1. Agregar rutas existentes: `/pedidos`.
      2. Preparar rutas nuevas: `/pos`, `/pocket`, `/clientes`.
      3. Cambiar `canAccessRoute()` para que “ruta no configurada” sea DENY (no allow).
   2. Observación:
      1. `Layout.tsx` usa `NAV_ITEMS` para mostrar/ocultar menú, pero `ProtectedRoute` usa `useUserRole().canAccess(path)`. Si `canAccessRoute` queda “open”, un usuario entra pegando URL.
   3. Done:
      1. Un usuario rol `usuario` no puede abrir `/pedidos` por URL.
   4. Tests:
      1. agregar tests unitarios para `canAccessRoute()` (roles vs rutas).

2. Bug de ubicación en movimientos de depósito
   1. Cambiar gateway `supabase/functions/api-minimarket/index.ts` en handler `POST /deposito/movimiento`:
      1. No usar `motivo` como fallback de `origen` para construir `ubicacion`.
      2. Para `entrada` sin destino: forzar `p_destino='Principal'`.
   2. Cambiar UI `minimarket-system/src/pages/Deposito.tsx`:
      1. En entradas (modo rápido y normal) enviar `destino='Principal'` explícito.
   3. Observación:
      1. No cambiar `sp_movimiento_inventario` para esto si puede resolverse en gateway/UI, porque la SP hoy ya está endurecida y tocada por hardening.
   4. Done:
      1. No se crean filas en `stock_deposito.ubicacion` con textos del motivo.
   5. Tests:
      1. Unit test del handler `/deposito/movimiento` asegurando `p_destino` correcto.

3. Roles: coherencia backend vs frontend (evitar “funciona a medias”)
   1. Hecho verificado:
      1. Frontend valida rol desde `personal` (`useVerifiedRole`).
      2. Gateway valida rol desde `app_metadata.role` (`supabase/functions/api-minimarket/helpers/auth.ts`).
   2. Tarea:
      1. Crear script nuevo `scripts/supabase-admin-sync-role.mjs`:
         1. Input: email + rol (`admin|deposito|ventas|usuario`).
         2. Acción: set `auth.users.app_metadata.role` (Admin API) y upsert en `public.personal` (`rol` y `activo=true`).
   3. Observación:
      1. Sin esta sincronización, se puede ver UI (RLS) pero fallar escrituras por gateway (403), o al revés.
   4. Done:
      1. Flujo de alta de usuario empleado queda documentado y reproducible.

4. Scraper alertas: dirección correcta aumento/disminución
   1. Cambiar `supabase/functions/scraper-maxiconsumo/alertas.ts`:
      1. Derivar signo desde `precio_actual - precio_proveedor` si `diferencia_absoluta` no tiene signo confiable.
   2. Observación:
      1. Esto impacta el drawer de alertas (sección Cambios de Precio) porque consume `vista_alertas_activas`.
   3. Done:
      1. Alerta “aumento/disminución” coincide con los números.

---

**Fase 1 — Arbitraje de Precios (acción directa con scraper)**
**Objetivo:** del dato a la acción: riesgo de pérdida y comprar ahora.

1. DB (migración)
   1. Crear `vista_arbitraje_producto`:
      1. Fuente: `comparacion_precios` (filtrar por `fuente='maxiconsumo'` si aplica).
      2. Calcular por `producto_id`:
         1. `costo_proveedor_actual = precio_proveedor` (última comparación).
         2. `costo_proveedor_prev` (comparación previa).
         3. `delta_costo_pct`.
         4. `precio_venta_actual = productos.precio_actual`.
         5. `margen_vs_reposicion = (precio_venta_actual - costo_proveedor_actual)/precio_venta_actual*100`.
         6. flags `riesgo_perdida`, `margen_bajo`.
   2. Crear `vista_oportunidades_compra`:
      1. Fuente stock: `mv_stock_bajo` (MVP; es materializada y puede estar hasta 1h desfasada).
      2. Condición: stock bajo y `delta_costo_pct <= -10`.
   3. Observación:
      1. `comparacion_precios` guarda historial 30 días y se reescribe periódicamente. Si no hay “previo”, no hay delta; tratar como “sin señal”, no como oportunidad.

2. Backend (`api-minimarket`)
   1. Agregar `handlers/insights.ts`:
      1. `GET /insights/arbitraje` (riesgo pérdida).
      2. `GET /insights/compras` (comprar ahora).
      3. `GET /insights/producto/{id}` (payload unificado para POS y Pocket).
   2. Observación:
      1. Seguir patrón existente de respuestas (`ok`/`fail`), requestId y role-check.

3. Frontend
   1. `minimarket-system/src/components/AlertsDrawer.tsx`:
      1. Sección “Riesgo de pérdida” con CTA “Verificar precio”.
      2. Sección “Comprar ahora” con CTA “Crear recordatorio”.
   2. Acción MVP “Crear recordatorio”:
      1. Crear `tareas_pendientes` con datos JSON (producto_id, delta, costo proveedor).
   3. Admin action “Aplicar costo y recalcular”:
      1. Llamar `POST /precios/aplicar` con `precio_compra=costo_proveedor_actual`.
   4. Observación:
      1. Hoy el frontend no tiene wrapper `preciosApi` en `minimarket-system/src/lib/apiClient.ts`; se debe crear.

4. Done
   1. Si `costo_proveedor_actual > precio_venta_actual`, se ve alerta crítica y un modal explica el riesgo.
   2. Si stock bajo y baja >= 10%, aparece “Comprar ahora” y crea recordatorio.
   3. Admin puede aplicar costo desde el modal sin navegar otras pantallas.

5. Tests
   1. Unit tests backend para endpoints insights.
   2. Component tests del drawer mostrando nuevas secciones y CTA.

---

**Fase 2 — POS MVP + Fiados / Cuenta Corriente**
**Objetivo:** ventas rápidas, descuento real de stock, y fiado vecinal con control.

1. DB (migraciones)
   1. Extender `public.clientes`:
      1. `limite_credito numeric(12,2) null`
      2. `whatsapp_e164 text null`
      3. `link_pago text null`
   2. Ajustar RLS de `clientes`:
      1. Agregar rol `ventas` a INSERT/UPDATE (mantener DELETE solo admin).
      2. Restricción: `limite_credito` editable solo por admin (en SP o policy específica).
   3. Crear `ventas`, `venta_items`, `cuentas_corrientes_movimientos`.
   4. Crear vistas:
      1. `vista_cc_saldos_por_cliente`
      2. `vista_cc_resumen`
   5. Observación crítica:
      1. El sistema ya usa idempotencia en reservas (`Idempotency-Key`). POS debe copiar ese patrón: clave idempotente por venta para evitar duplicados por reintentos.

2. RPCs (obligatorio, atómico)
   1. `sp_procesar_venta_pos(payload jsonb)`:
      1. SECURITY DEFINER + `SET search_path = public`.
      2. Check rol interno con `has_personal_role`.
      3. Idempotencia: si existe venta con `idempotency_key`, retornar esa.
      4. Lock stock por producto y validar disponibilidad (restando `stock_reservado` activa).
      5. Insert `ventas` + `venta_items`.
      6. Decrementar `stock_deposito` (ubicación `Principal`).
      7. Insert `movimientos_deposito` con `tipo_movimiento='venta'`.
      8. Si método `cuenta_corriente`: insertar cargo en ledger.
      9. Si `riesgo_perdida=true` y no viene `confirmar_riesgo=true`: levantar error tipificado `LOSS_RISK_CONFIRM_REQUIRED`.
   2. `sp_registrar_pago_cc(payload jsonb)`:
      1. Inserta movimiento negativo y retorna saldo.

3. Backend (`api-minimarket`)
   1. Nuevos handlers:
      1. `handlers/ventas.ts` con `POST /ventas` (requiere `Idempotency-Key`) y `GET /ventas`/`GET /ventas/{id}`.
      2. `handlers/clientes.ts` con `GET/POST/PUT /clientes` (ventas/admin).
      3. `handlers/cuentas_corrientes.ts` con resumen y pagos.
   2. Observación:
      1. Gateway hoy valida rol vía `app_metadata.role`. Asegurar que los usuarios `ventas` tengan role en auth y en `personal`.
   3. OpenAPI:
      1. Actualizar `docs/api-openapi-3.1.yaml` y `docs/API_README.md`.

4. Frontend POS
   1. Nueva ruta `/pos` con layout propio sin sidebar.
   2. UX:
      1. input foco permanente para escáner.
      2. hotkeys (F1 efectivo, F2 cliente, ESC limpiar).
      3. ticket a la izquierda, totales y cobro a la derecha.
   3. Fiado:
      1. botón “Cargar a cliente”.
      2. badge deuda verde/amarillo/rojo usando vistas CC.
      3. WhatsApp: `wa.me` usando `whatsapp_e164`.
   4. Alerta roja:
      1. Si backend responde `LOSS_RISK_CONFIRM_REQUIRED`, mostrar alerta gigante y reintentar con `confirmar_riesgo=true`.

5. Done
   1. Venta simple con scanner < 15s.
   2. Stock baja y movimiento `venta` queda auditado.
   3. Fiado suma saldo; pago resta; dashboard “dinero en la calle” cuadra.

6. Tests
   1. Unit tests: idempotencia, stock insuficiente, riesgo pérdida confirm, límite crédito.
   2. Component tests POS: escaneo, hotkeys, confirmación riesgo, selección cliente.

---

**Fase 3 — Pocket Manager (PWA Depósito móvil)**
**Objetivo:** desde celular, escaneo cámara y 3 acciones sin navegación.

1. PWA
   1. Integrar `vite-plugin-pwa` en `minimarket-system/vite.config.ts`.
   2. Agregar manifest (standalone) e íconos.
   3. Observación:
      1. En código actual NO hay service worker ni manifest; la nota “PWA offline básico” en docs parece desalineada, así que se implementa desde cero.
      2. Cámara requiere “secure context”: `https` o `localhost`.

2. Ruta y UI `/pocket`
   1. Layout propio mobile-first.
   2. Rol permitido: `deposito|admin`.

3. Escaneo cámara
   1. Librería decidida: `@zxing/browser`.
   2. Fallback: input manual.

4. 3 botones gigantes
   1. Actualizar stock:
      1. POST `/deposito/movimiento` con `destino='Principal'` y `observaciones` “Pocket”.
   2. Imprimir etiqueta:
      1. MVP `window.print()` con CSS 58mm.
      2. Barcode render con `jsbarcode` (SVG).
      3. Observación:
         1. Impresión “bluetooth térmica” directa desde web suele ser limitada; el MVP debe ser “print” estándar.
   3. Verificar precio:
      1. consume `GET /insights/producto/{id}`.
      2. semáforo: rojo si riesgo pérdida o margen bajo.

5. Done
   1. En móvil abre y permite scan en <= 2 taps.
   2. Movimiento stock < 10s.
   3. Etiqueta imprimible en tamaño estable.

6. Tests
   1. Component tests con fallbacks sin cámara.
   2. Unit tests de formateo barcode y template etiqueta.

---

**Fase 4 — Anti-mermas: Zona de Oferta (caducidad accionable)**
**Objetivo:** convertir alerta de vencimiento en salida de mercadería.

1. Limitación confirmada (importante)
   1. Existe índice único `(producto_id, ubicacion)` en `stock_deposito`.
   2. Por lo tanto, no hay lotes reales múltiples por producto/ubicación en el modelo actual. La oferta será “por stock_id” pero en la práctica “por producto/ubicación”.

2. DB
   1. Crear `ofertas_stock` (activa/inactiva, descuento_pct, precio_oferta).
   2. Vista `vista_ofertas_sugeridas`:
      1. fuente `mv_productos_proximos_vencer`
      2. condición `dias_hasta_vencimiento <= 7` y `cantidad_actual > 0`
      3. sugiere 30% y calcula precio redondeado.

3. Backend
   1. `GET /ofertas/sugeridas`
   2. `POST /ofertas/aplicar` (idempotente por stock_id si ya existe activa)
   3. `POST /ofertas/{id}/desactivar`

4. Frontend
   1. `AlertsDrawer` en “Vencimientos” agrega CTA “Aplicar 30% OFF”.
   2. POS respeta `precio_oferta` si hay oferta activa.
   3. Pocket imprime etiqueta “OFERTA 30%”.

5. Done
   1. Sugerencia aparece para <= 7 días.
   2. 1 clic aplica oferta y POS cobra precio oferta.
   3. Se puede desactivar sin tocar precio base.

6. Tests
   1. Unit tests: cálculo precio oferta y idempotencia.
   2. Component tests CTA y render precio oferta.

---

**Fase 5 — Bitácora Digital (nota de turno al logout)**
**Objetivo:** comunicación asíncrona dueño-equipo.

1. DB
   1. Crear `bitacora_turnos` con RLS:
      1. INSERT: roles base.
      2. SELECT: admin (y opcional staff si se decide luego).

2. Backend
   1. `POST /bitacora`
   2. `GET /bitacora` (admin)

3. Frontend
   1. Interceptar “Salir” en `minimarket-system/src/components/Layout.tsx`:
      1. Modal no bloqueante “¿Algo que reportar?”
      2. “Guardar y salir” debe enviar nota ANTES de ejecutar `supabase.auth.signOut()`.
      3. Si falla el POST, permitir “Salir sin nota” y loggear error.

4. Done
   1. Popup aparece siempre al logout (con opción skip).
   2. Dashboard admin muestra últimas notas.

5. Tests
   1. Component test del modal logout.
   2. Unit tests del endpoint bitácora.

---

**Fase 6 — UX Quick Wins (sin reescritura)**
**Objetivo:** reducir fricción y mejorar percepción de velocidad.

1. Optimistic UI (React Query)
   1. `minimarket-system/src/pages/Tareas.tsx`:
      1. create/complete/cancel con `onMutate`, rollback `onError`, revalidación `onSettled`.
   2. `minimarket-system/src/pages/Deposito.tsx`:
      1. feedback inmediato consistente (toast) y estado UI predecible.
   3. Observación:
      1. No hacer optimistic en operaciones que puedan fallar por stock insuficiente sin manejar rollback visible.

2. Semáforos
   1. `minimarket-system/src/pages/Rentabilidad.tsx`:
      1. fondo suave rojo para margen negativo, amarillo para bajo mínimo.
   2. `/clientes`:
      1. deuda verde/amarillo/rojo según porcentaje del límite.

3. “Scan & Action” desde Ctrl+K
   1. Evolucionar `GlobalSearch` para que al seleccionar un producto abra un modal de acciones:
      1. Verificar precio (insights).
      2. Ir a POS (si rol ventas/admin).
      3. Ir a Depósito/Pocket (si rol deposito/admin).
      4. Imprimir etiqueta.

4. Done
   1. Mutaciones críticas se sienten instantáneas.
   2. Semáforos reducen errores sin leer números.
   3. Scanner permite ejecutar acción sin navegar menús.

5. Tests
   1. Component tests de optimistic tasks.
   2. Smoke de navegación Ctrl+K.

---

**Observaciones transversales (para no implementar mal)**
1. RLS y SECURITY DEFINER:
   1. Toda SP nueva debe incluir `SECURITY DEFINER` y `SET search_path = public` para evitar WARN del Security Advisor.
   2. Toda SP que “bypassea” RLS debe chequear rol interno con `has_personal_role`.
2. Roles consistentes:
   1. POS requiere rol `ventas` real en auth (`app_metadata.role`) y en `personal`.
3. Idempotencia:
   1. `POST /ventas` debe requerir `Idempotency-Key`, igual que `/reservas`.
4. Caducidad:
   1. El modelo actual no soporta FEFO por lotes reales; documentar esa limitación en el release.
5. PWA y cámara:
   1. En producción debe estar en HTTPS; en staging también si se prueba cámara.

---

**Checklist de documentación al cerrar cada fase**
1. `docs/ESTADO_ACTUAL.md`:
   1. fecha
   2. qué se cerró
   3. evidencia tests
2. `docs/DECISION_LOG.md`:
   1. registrar nuevas decisiones (ej: D-064 “POS idempotente”, D-065 “PWA ZXing”, etc).
3. `docs/api-openapi-3.1.yaml` y `docs/API_README.md`:
   1. actualizar si se agregan endpoints.

---

**Fin del documento**
