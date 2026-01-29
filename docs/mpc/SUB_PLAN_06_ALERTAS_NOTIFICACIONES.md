# 📋 SUB-PLAN #6: Alertas y Notificaciones

**Prioridad:** 🟢 P2  
**Estado:** ✅ Implementado  
**Funciones:** 4

---

## 📊 Resumen

| Función | Trigger | Propósito |
|---------|---------|-----------|
| `alertas-stock` | Cron | Stock bajo |
| `alertas-vencimientos` | Cron diario | Productos por vencer |
| `notificaciones-tareas` | Cron | Recordatorios de tareas |
| `reportes-automaticos` | Cron semanal | Generación de reportes |

---

## 🔔 alertas-stock

**Propósito:** Detectar productos con stock bajo el mínimo configurado.

**Flujo:**
```
Cron → SELECT productos WHERE stock < stock_minimo
     → INSERT INTO alertas
     → Notificar (email/push futuro)
```

---

## 📅 alertas-vencimientos

**Propósito:** Detectar productos próximos a vencer.

**Flujo:**
```
Cron diario → SELECT productos WHERE fecha_vencimiento < NOW() + 7 días
            → INSERT INTO alertas
            → Notificar
```

---

## 📋 notificaciones-tareas

**Propósito:** Recordatorios de tareas pendientes y urgentes.

---

## 📊 reportes-automaticos

**Propósito:** Generación automática de reportes semanales.

**Tipos de reporte:**
- Resumen ventas/stock
- Productos más vendidos
- Alertas generadas

---

## 🎯 Acciones Pendientes

| # | Acción | Prioridad | Esfuerzo |
|---|--------|-----------|----------|
| 1 | Integrar notificaciones push/email | 🟡 Media | ~6h |
| 2 | Dashboard de alertas en frontend | 🟡 Media | ~4h |
| 3 | Configuración de umbrales por usuario | 🟢 Baja | ~3h |

---

## ✅ Veredicto

**Estado:** FUNCIONAL  
**Score Técnico:** 7/10 (Básico pero funcional)  
**Mejora Principal:** Añadir canales de notificación

---

*Sub-Plan generado por RealityCheck v3.1*
