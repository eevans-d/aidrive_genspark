# 📋 SUB-PLAN #4: Sistema de Cron Jobs

**Prioridad:** 🟡 P1  
**Estado:** ✅ Implementado  
**Componentes:** 10 Edge Functions auxiliares

---

## 📊 Resumen

| Aspecto | Estado | Detalle |
|---------|--------|---------|
| **Cron Jobs** | ✅ 5 | Orquestadores programados |
| **Alertas** | ✅ 2 | Stock bajo, vencimientos |
| **Otros** | ✅ 3 | Notificaciones, reportes, reposición |

---

## 📁 Edge Functions Auxiliares

### 🔄 Cron Jobs (Orquestación)

| Función | Propósito | Frecuencia |
|---------|-----------|------------|
| `cron-jobs-maxiconsumo` | Orquesta scraping | Programado |
| `cron-dashboard` | Actualiza métricas | Periódico |
| `cron-health-monitor` | Health checks | Cada 5 min |
| `cron-notifications` | Envío de alertas | Periódico |
| `cron-testing-suite` | Suite de tests | On-demand |

### 🔔 Sistema de Alertas

| Función | Propósito | Trigger |
|---------|-----------|---------|
| `alertas-stock` | Productos con stock bajo | Periódico |
| `alertas-vencimientos` | Productos por vencer | Diario |

### 📦 Automatización

| Función | Propósito | Frecuencia |
|---------|-----------|------------|
| `notificaciones-tareas` | Recordatorios | Periódico |
| `reportes-automaticos` | Generación reportes | Semanal |
| `reposicion-sugerida` | Sugerencias compra | Diario |

---

## 🏗️ Arquitectura: cron-jobs-maxiconsumo

```
cron-jobs-maxiconsumo/
├── index.ts (5KB)          # Entry point
├── orchestrator.ts (3KB)   # Coordinación de jobs
├── execution-log.ts (5KB)  # Log de ejecuciones
├── validators.ts (14KB)    # Validación de jobs
├── config.ts (2KB)         # Configuración
├── types.ts (1KB)          # Tipos TypeScript
└── jobs/ (4 jobs)          # Jobs individuales
```

### Flujo de Orquestación

```
Supabase Scheduler → cron-jobs-maxiconsumo/index
                            ↓
                    orchestrator.ts
                            ↓
            ┌───────────────┼───────────────┐
            ↓               ↓               ↓
        scraping        comparacion      alertas
            ↓               ↓               ↓
        [execution-log: registra resultado]
```

---

## 🧪 Tests Disponibles

| Módulo | Test | Estado |
|--------|------|--------|
| Health Monitor | `unit/cron-health-monitor.test.ts` | ✅ |
| Execution Log | `unit/cron-execution-log.test.ts` | ✅ |
| Handlers | `unit/cron-handlers.test.ts` | ✅ |
| Validators | `unit/cron-validators.test.ts` | ✅ |

---

## 🎯 Acciones Pendientes

| # | Acción | Prioridad | Esfuerzo |
|---|--------|-----------|----------|
| 1 | Dashboard de ejecuciones en frontend | 🟡 Media | ~4h |
| 2 | Retry automático con backoff | 🟢 Baja | ~3h |
| 3 | Alertas por fallo de cron | 🟡 Media | ~2h |

---

## ✅ Veredicto

**Estado:** FUNCIONAL  
**Score Técnico:** 8/10 (Bien estructurado con logging)  
**Score Confiabilidad:** 7/10 (Monitoreo básico)

---

*Sub-Plan generado por RealityCheck v3.1*
