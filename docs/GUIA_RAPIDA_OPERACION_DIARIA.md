# Guia Rapida De Operacion Diaria

Estado: Activo
Audiencia: Staff de turno
Ultima actualizacion: 2026-02-21
Fuente de verdad: docs/ESTADO_ACTUAL.md
Owner documental: Operacion

> Referencia de estado y conteos: segun FactPack 2026-02-21.

## Objetivo
Tener una guia corta para abrir turno, operar sin friccion y cerrar turno con control minimo.

## Procedimiento Paso A Paso
### A. Apertura de turno (5-10 min)
1. Iniciar sesion.
2. Ir a `Dashboard` (`/`).
3. Revisar rapido:
   - alertas (icono campana)
   - tareas urgentes
   - KPI de faltantes
4. Probar un flujo corto:
   - abrir `POS` (`/pos`)
   - volver a `Dashboard`

### B. Operacion durante turno
1. Ventas:
   - usar `/pos`
   - cobrar con metodo correcto
2. Faltantes:
   - registrar en el momento desde FAB o busqueda global
   - revisar en `/cuaderno`
3. Seguimiento:
   - si hay faltantes criticos, reasignar proveedor y dejar lista de compra

### C. Cierre de turno (10 min)
1. Confirmar que no quede ticket pendiente en `/pos`.
2. Revisar `/cuaderno` y resolver lo atendido.
3. Verificar alertas y tareas urgentes.
4. Dejar nota de bitacora al cerrar sesion si hubo incidencias.

## Tiempos Objetivo
| Tarea | Tiempo sugerido |
|---|---|
| Apertura | 5-10 min |
| Venta simple | < 1 min |
| Registrar faltante | 15-30 seg |
| Cierre de turno | 10 min |

## Errores Comunes
| Situacion | Accion inmediata |
|---|---|
| No encuentro producto en POS | Buscar por nombre o validar codigo de barras/SKU |
| No puedo cobrar en fiado | Seleccionar cliente primero |
| No aparece acceso a modulo | Puede ser permiso por rol |
| Se acumulan faltantes sin resolver | Usar tab `Por Proveedor` y copiar resumen de compra |

## Verificacion
Checklist rapido diario:
- [ ] Login ok
- [ ] POS abre
- [ ] Dashboard visible
- [ ] Cuaderno visible
- [ ] Alertas sin bloqueantes

Comando de soporte (si hay dudas de doc):
```bash
node scripts/validate-doc-links.mjs
```

## Escalacion
1. Operador de turno documenta problema puntual (pantalla + hora + accion).
2. Responsable interno revisa `docs/TROUBLESHOOTING.md`.
3. Si persiste, escalar a soporte tecnico con evidencia minima.
