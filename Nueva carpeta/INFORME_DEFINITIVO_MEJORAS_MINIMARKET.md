# INFORME DEFINITIVO — Mini Market System (Una Sucursal)
**Objetivo:** Entregar al agente implementador (GitHub Copilot Agent / Antigravity Planning / Codex) un documento **autosuficiente** para:  
1) **Verificar** el estado real del proyecto (código + DB + flujos) vs. este informe.  
2) **Detectar gaps** y fricción de UX/operación.  
3) **Diseñar una planificación ejecutable** para implementar mejoras priorizadas para un **mini market** (no multi-sucursal).

**Fecha:** 2026-02-06  
**Alcance:** Operación retail de una sola tienda + depósito.  
**Restricción guía:** Maximizar **simplicidad operativa**, **mínima fricción**, **bajo costo fijo**, y cambios incrementales con evidencia.

---

## 0) Fuente de verdad y regla de trabajo

### 0.1 Fuente de verdad
- **Fuente de verdad real:** el **código implementado**, **migraciones**, **esquema DB**, y **edge functions** actuales.
- Este informe usa como contexto una descripción previa del sistema (módulos, stack, métricas, pantallas).  
**Regla:** el agente debe tratar esa descripción como **hipótesis** hasta confirmarla con evidencia del repo.

### 0.2 Definición de éxito
- El sistema permite operar **más rápido** (menos pasos), con **menos errores**, y con **mejor visibilidad** para el dueño.
- Las alertas pasan de “informar” a **accionar** (crear pedido, sugerir acción, cerrar tareas).
- Se cierra el “loop” inventario↔ventas↔compras de forma simple.

---

## 1) Diagnóstico guiado (lo que el agente debe verificar en el proyecto real)

> Resultado esperado de esta sección: un **Documento de Evidencia** (o issue) con: “Qué existe”, “Qué no existe”, “Qué funciona”, “Qué está roto”, “Qué duele”.

### 1.1 Evidencia mínima (comandos/acciones sugeridas)
**Repo**
- Confirmar árbol real del repo: frontend, funciones, scripts, docs, CI.
- Enumerar rutas de pantallas/routers del frontend y su menú visible por rol.
- Enumerar edge functions / API gateway endpoints y contratos (OpenAPI si existe).

**DB / Supabase**
- Listar tablas críticas: productos, categorías, stock, movimientos, precios, proveedores, tareas, reservas, alertas, etc.
- Confirmar si existen: **ventas**, **caja**, **lotes/vencimientos por lote**, **mermas**, **conteos cíclicos**.
- Confirmar RLS/policies por tabla y rol (admin/deposito/ventas).

**Operación real**
- Reproducir 3 flujos base:  
  1) Alta producto → ingreso mercadería → stock OK.  
  2) Cambio de precio → historial OK → margen OK.  
  3) Stock bajo → alerta OK → (¿qué acción habilita?).

**Testing**
- Ejecutar suite de tests y registrar evidencia: unit/integration/e2e (si existen).
- Validar que los tests no den “falsos PASS” (p.ej. mocks excesivos sin asserts).

> Nota: Si el repo ya tiene “Reality Check UX”, tomarlo como input, pero verificar que esté alineado al UI actual.

---

## 2) Problemas típicos en mini market (enfoque y por qué importan)

1) **Stock se desincroniza** si no se descuenta por venta real o si los ingresos/egresos se registran tarde.  
2) **El dueño decide rápido**: necesita “qué comprar hoy”, “qué está por vencer”, “qué subió de costo”, “qué me deja margen”.  
3) **El operador necesita 1 paso**: escanear → acción → listo (sin navegar 5 pantallas).  
4) **Vencimientos**: sin lotes, FEFO se vuelve “manual” y se pierde mercadería.  
5) **Shrinkage/mermas**: si no se registra, la rentabilidad es ficción.

---

## 3) Recomendaciones definitivas (priorizadas) — “Alto impacto / baja fricción”

### PRIORIDAD P0 (máximo impacto, debería ir primero)
#### P0.1 Búsqueda/Escáner universal + Acciones rápidas
**Qué es:** un componente global (header o modal) que acepta:
- Código de barras (scanner)
- Texto (búsqueda)

**Al detectar un producto:** mostrar acciones rápidas:
- **Vender** (si existe POS/MVP)
- **Ingreso** (recepción)
- **Egreso** (ajuste/salida)
- **Cambiar precio**
- **Ver stock**
- **Vencimientos (si hay lotes)**

**Objetivo UX:** reducir navegación. El operador no debería “pensar pantallas”, sólo “acción”.

**Criterios de aceptación**
- 80% de operaciones diarias se completan sin entrar a “detalle de producto”.
- Teclado/escáner: navegar sin mouse (enter/tab) para velocidad.

---

#### P0.2 Compras accionables: “Pedido borrador por proveedor”
**Qué es:** convertir “stock bajo mínimo” + “reposición sugerida” en un **pedido borrador** agrupado por proveedor, con:
- SKU/Producto
- Cantidad sugerida
- Costo estimado (último proveedor/scraping)
- Total por proveedor
- Ajuste manual + confirmación

**Reorden (concepto simple):** disparar cuando se alcanza el **reorder point**:  
ROP = (Demanda diaria promedio × Lead time) + Safety stock.  
Este enfoque es estándar en inventarios para evitar quiebres manteniendo buffer.

**Criterios de aceptación**
- Desde “Stock bajo” → botón “Generar pedido borrador”.
- El pedido se puede exportar (CSV/Texto) y enviar por WhatsApp/email.
- Registro auditable: quién aprobó, cuándo, qué se pidió.

---

#### P0.3 Recepción de mercadería ultra-rápida (flujo dedicado)
**Qué es:** pantalla/flujo “Recepción” (no “movimiento genérico”) optimizado para depósito:
- Seleccionar proveedor → escanear → cantidad → (opcional costo) → confirmar.
- Si no existe el producto: **Alta express** (3–4 campos) sin abandonar el flujo.
- Actualiza stock y, si se captura costo, alimenta márgenes.

**Criterios de aceptación**
- Recepción de 20 ítems en < 3 minutos con escáner.
- Alta express no exige completar “campos avanzados”.

---

### PRIORIDAD P1 (alto valor, requiere algo más de modelado)
#### P1.1 Vencimientos por lote + FEFO operativo
**Qué es:** manejar vencimientos por **lote/ingreso** (no sólo a nivel producto), para operar FEFO:
- En recepción: permitir ingresar fecha de vencimiento por lote (opcional por producto).
- En venta / sugerencias: priorizar consumo del lote con vencimiento más cercano (FEFO).

**Criterios de aceptación**
- Vista “Por vencer (7/30 días)” accionable: remarcar, liquidar, retirar, merma.
- Reporte de merma por vencimiento.

---

#### P1.2 Mermas (shrinkage) como primera clase
**Qué es:** un tipo de movimiento dedicado:
- merma por: vencido / rotura / robo / error / degustación / devolución proveedor
- impacto: stock y rentabilidad

**Criterios de aceptación**
- Dashboard del dueño incluye “merma semanal” y top productos con merma.
- Ajustes de stock requieren motivo (no ajustes silenciosos).

---

#### P1.3 Conteo cíclico (cycle count) simple
**Qué es:** conteo parcial regular para mantener precisión sin inventario completo:
- Selección guiada (Top rotación / alto valor / discrepancias)
- Registro de diferencias + causa
- Ajuste auditable

**Criterios de aceptación**
- “Conteo rápido” semanal de N productos sin cerrar el local.
- Mejora de exactitud de inventario (definir KPI inicial y meta).

---

### PRIORIDAD P2 (estratégico / preparar futuro sin sobrediseño)
#### P2.1 MVP de Caja/Venta rápida (si hoy no existe)
**Qué es:** un flujo POS mínimo que descuente stock de forma real:
- Escanear → ticket → cobrar (método pago básico) → cerrar venta
- Anulación/devolución con motivo
- Cierre diario de caja (resumen)

**Criterios de aceptación**
- Cada venta genera movimientos consistentes y auditables.
- Reconciliación simple: ventas del día vs. caja del día.

---

#### P2.2 Preparación para 2D/GS1 (sin cambiar todo)
**Qué es:** no “implementar 2D”, sino asegurar que el parser de códigos y el modelo de producto puedan evolucionar:
- Aceptar payloads más ricos (cuando llegue el momento) sin romper EAN/UPC.
- Guardar “raw scan” opcional para debugging.

---

## 4) Reducción de fricción (principios operativos aplicables ya)

### 4.1 Progressive Disclosure (mini market ≠ ERP)
- Mostrar **lo esencial primero**; lo avanzado en “expandir” o pestaña secundaria.
- Aplicar en: alta producto, proveedor, scraping stats, reportes.

**Objetivo:** menor curva de aprendizaje y menos errores.

### 4.2 Formularios de baja carga cognitiva
- Estructura clara, campos obligatorios mínimos, validación inline, feedback inmediato.
- Defaults inteligentes (última categoría, último proveedor, último margen).

### 4.3 Tablas operativas
- Edición inline (mínimo/máximo/margen/estado) sin abrir modales pesados.
- Acciones masivas: cambiar categoría, activar/desactivar, aplicar redondeo.

### 4.4 Alertas accionables (no ruido)
- Cada alerta debe tener “acción primaria”:  
  stock bajo → generar pedido;  
  vencimiento → liquidar/merma;  
  suba proveedor → sugerir nuevo precio/margen.

---

## 5) Diseño mínimo de datos (para que el agente lo adapte al esquema real)

> El agente debe mapear esto a tablas existentes o proponer migraciones mínimas.

### 5.1 Nuevas entidades (si no existen)
- **sales** / **sale_items** (POS): ticket, total, método pago, usuario, timestamp.
- **inventory_lots**: producto, proveedor, fecha_vencimiento, qty_in, qty_out, costo.
- **waste_events** (mermas): producto/lote, qty, motivo, usuario, timestamp.
- **cycle_counts**: sesión, items contados, diferencia, causa, usuario.

### 5.2 Reglas
- Todo cambio de stock debe quedar como **movimiento auditable**.
- Ajustes manuales requieren **motivo** (evitar “stock fantasma”).
- Soft delete: mantener históricos (ya se menciona que existe).

---

## 6) Plan de implementación sugerido (el agente debe convertirlo a roadmap real)

### Fase 0 — Verificación y mapa de realidad (obligatorio)
**Salida:** informe de evidencia + mapa de módulos existentes + listado de gaps.  
- Confirmar si ya existe “ventas/caja”.
- Confirmar si vencimientos son por producto o por lote.
- Confirmar si “pedido borrador” puede implementarse sin tocar scraping.

### Fase 1 — Quick wins UX (P0.1)
- Búsqueda/Escáner universal + acciones rápidas.
- Tablas operativas con edición inline donde duela.
- Alertas con CTA (call-to-action) real.

### Fase 2 — Compras y Recepción (P0.2 + P0.3)
- Pedido borrador por proveedor (mínimo) + export/envío.
- Recepción rápida + alta express.
- Lead time por proveedor (simple, editable).

### Fase 3 — Lotes/Vencimientos + Mermas (P1.1 + P1.2)
- Modelar lotes y FEFO.
- Mermas con motivos y dashboards.

### Fase 4 — Cycle count + POS MVP (P1.3 + P2.1)
- Conteos cíclicos guiados.
- POS mínimo si no existe (o fortalecer lo existente).

---

## 7) Criterios de aceptación globales (Definition of Done)

**UX / Operación**
- Operador completa: recepción / ajuste / consulta / (venta si aplica) en ≤ 3 pasos.
- Flujos críticos compatibles con escáner (enter/tab) y mobile.

**Consistencia**
- Stock y movimientos consistentes (sin “saltos”).
- Auditoría completa: quién, qué, cuándo, por qué.

**Calidad**
- Tests relevantes agregados/actualizados por cada feature.
- No degradar performance (queries/indices) en stock y productos.

**Seguridad**
- RLS y roles validados para nuevas tablas/funciones.
- No exponer endpoints críticos a roles incorrectos.

---

## 8) Riesgos y mitigaciones

1) **POS cambia todo** → Mitigar con MVP y feature flag; si ya existe POS, fortalecerlo.  
2) **Lotes agregan complejidad** → Mitigar: lotes sólo para categorías perecederas (configurable).  
3) **Scraping inestable** → Mitigar: cache, fallbacks, “último costo válido”, y no bloquear operación por fallo de scraping.  
4) **Demasiadas pantallas** → Mitigar: escáner universal + progressive disclosure + rutas por rol.

---

## 9) Entregables que el agente debe producir

1) **Informe de verificación**: estado real vs. este documento (con evidencia).  
2) **Backlog priorizado** (épicas → historias → criterios de aceptación) basado en P0/P1/P2.  
3) **Plan por fases** con estimación cualitativa (S/M/L) y dependencias.  
4) **Mapa de cambios**: DB migraciones, endpoints, UI pantallas/componentes, tests.  
5) **Checklist de release**: pruebas, seguridad, rollback/backup.

---

## 10) Referencias externas (para justificar decisiones)
> Colocar estos enlaces en el plan del agente como “fundamentos”, no como dependencia del proyecto.

```text
Progressive Disclosure (Nielsen Norman Group): https://www.nngroup.com/articles/progressive-disclosure/
Reducir carga cognitiva en formularios (Nielsen Norman Group): https://www.nngroup.com/articles/4-principles-reduce-cognitive-load/
Reorder point (ROP) y safety stock (ISM): https://www.ism.ws/logistics/reorder-point-formula-and-examples/
FEFO (First Expired First Out) explicación: https://www.shipbob.com/blog/fefo/
Cycle counts (Shopify Retail): https://www.shopify.com/retail/cycle-count
Shrinkage (CFI): https://corporatefinanceinstitute.com/resources/accounting/inventory-shrinkage/
2D barcodes retail POS guideline (GS1): https://ref.gs1.org/guidelines/2d-in-retail/
GS1 Sunrise 2027 (GS1 US): https://www.gs1us.org/industries-and-insights/by-topic/sunrise-2027
```
