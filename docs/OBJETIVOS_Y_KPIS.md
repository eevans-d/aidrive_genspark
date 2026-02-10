# Objetivos y KPIs - Mini Market System

**Fecha:** 2026-02-10  
**Estado:** Vigente (revisar si el alcance del negocio cambia)

## 1) Objetivos (qué buscamos lograr)

1. **Operación diaria simple y rápida** (depósito + ventas + administración) sin fricción innecesaria.
2. **Inventario confiable** (stock, movimientos, reservas) para evitar quiebres y sobre-stock.
3. **Rentabilidad y control** (precios, márgenes, historial, ofertas anti-mermas) con visibilidad accionable.
4. **Trazabilidad** (bitácora/auditoría) de acciones relevantes.
5. **Base técnica operable** (CI verde, deploy/rollback documentado, hardening básico, RLS P0).

## 2) KPIs (cómo medimos)

> Nota: estos KPIs son medibles. Donde aplique, el baseline debe completarse con datos reales (staging/prod).

| KPI | Definición | Fuente sugerida | Frecuencia | Meta inicial |
|-----|------------|-----------------|------------|--------------|
| Stock accuracy | % de coincidencia entre stock sistema vs conteo físico | Conteos cíclicos + movimientos | Semanal | >= 95% |
| Stockouts | Cantidad de quiebres (stock=0 con demanda) | Ventas + stock | Semanal | Tendencia a la baja |
| Tiempo de recepción | Tiempo para registrar una recepción (pedido -> stock actualizado) | UI + auditoría | Diario | <= 3 min / 20 ítems (con escáner) |
| Latencia de actualización de precios | Tiempo desde cambio de costo/proveedor hasta precio aplicado | Logs gateway + DB | Diario | <= 24h |
| Merma | Valor/qty de merma por semana | Movimientos/Ofertas | Semanal | Medir y reducir |
| Alertas accionadas | % de alertas que terminan en acción (pedido/ajuste/oferta) | Bitácora + tareas | Semanal | >= 70% |
| Incidentes P0 | Incidentes que bloquean operación | Runbook/Incident log | Mensual | 0 |
| CI green rate | % de runs en `main` que pasan | GitHub Actions | Semanal | >= 95% |

## 3) No-objetivos (por ahora)

- Multi-sucursal y conciliaciones contables avanzadas tipo ERP.
- Analítica avanzada fuera del alcance operativo (se evaluará cuando haya datos).

