# Manual De Uso - Mini Market System

Estado: Activo
Audiencia: Dueno + staff de turno
Ultima actualizacion: 2026-02-21
Fuente de verdad: docs/ESTADO_ACTUAL.md
Owner documental: Operacion + Producto

> Referencia de metricas y conteos: segun FactPack 2026-02-21 (rama `main`, 14 Edge Functions, 22 skills, 201 archivos markdown en `docs/`).

## Objetivo
Este manual explica como operar el sistema en el dia a dia sin conocimientos tecnicos. El foco inicial es:
- Vender rapido desde POS (`/pos`)
- Registrar faltantes en el momento (`/cuaderno`)
- Resolver faltantes para compra/reposicion (`/cuaderno`, tabs por proveedor)

## Mapa De Flujos Criticos
| Flujo | Ruta principal | Resultado esperado |
|---|---|---|
| Venta en caja | `/pos` | Venta registrada y stock descontado |
| Registrar faltante | FAB/Busqueda/Alertas -> `/cuaderno` | Faltante guardado con prioridad y proveedor sugerido |
| Gestionar faltantes | `/cuaderno` | Pendientes resueltos o reasignados |

## Procedimiento Paso A Paso
### Flujo 1 - Registrar una venta
1. Entrar a `Dashboard` y tocar `Vender` (abre `/pos`).
2. Escanear codigo o escribir codigo/SKU y presionar `Enter`.
3. Verificar que el producto aparezca en carrito.
4. Ajustar cantidad con botones `+` y `-`.
5. Elegir metodo de pago:
   - `Efectivo`
   - `Tarjeta`
   - `Fiado` (requiere seleccionar cliente)
6. Tocar `Cobrar`.
7. Confirmar mensaje de exito (`Venta registrada` o `Venta idempotente`).

Resultado esperado:
- Ticket cobrado.
- Stock actualizado.
- Dashboard reflejara cambios en siguientes recargas.

### Flujo 2 - Anotar faltante desde operacion real
Opciones validas (equivalentes):
1. Boton flotante `Anotar faltante` (FAB) en pantallas con `Layout`.
2. Busqueda global -> accion rapida `Anotar faltante`.
3. Alertas de stock bajo -> boton `Anotar faltante`.

Pasos:
1. Escribir texto simple, por ejemplo: `Falta pan lactal`.
2. Revisar vista previa (accion, prioridad y posible proveedor).
3. Si aparece aviso de duplicado, decidir si guardar igual.
4. Confirmar envio.

Resultado esperado:
- Registro en `productos_faltantes`.
- Si prioridad es `alta`, el flujo crea recordatorio asociado (segun estado vigente D-147/D-148).

Nota operativa:
- El FAB no aparece en rutas standalone `/pos` y `/pocket` porque no renderizan `Layout`.

### Flujo 3 - Gestionar faltantes por proveedor
1. Entrar a `/cuaderno`.
2. Usar tabs:
   - `Todos`
   - `Por Proveedor`
   - `Resueltos`
3. En `Por Proveedor`:
   - Expandir grupo.
   - Marcar `resuelto`.
   - Editar observacion.
   - Reasignar proveedor.
   - Copiar resumen para compra.
4. Revisar seccion `Sin proveedor asignado` y reasignar si corresponde.

Resultado esperado:
- Lista de pendientes limpia.
- Resumen listo para compra/reposicion.

## Checklist De Cierre Diario (Operacion)
1. Validar que no quede ticket abierto en `/pos`.
2. Revisar faltantes pendientes en `/cuaderno`.
3. Marcar como resueltos los faltantes ya atendidos.
4. Reasignar faltantes sin proveedor.
5. Revisar alertas abiertas en campana de navegación.
6. Verificar tareas urgentes en dashboard/tareas.
7. Confirmar que no haya errores de login o permisos en turno.
8. Registrar notas de turno al cerrar sesion (bitacora).

## Errores Comunes
| Problema | Causa probable | Accion rapida |
|---|---|---|
| No puedo entrar a una pantalla | Rol sin permiso | Volver a Dashboard y pedir validacion de rol |
| `Cobrar` no avanza | Falta cliente en modo fiado o error de stock | Seleccionar cliente o ajustar carrito |
| No aparece el FAB de faltantes | Ruta actual es `/pos` o `/pocket` | Ir a `/cuaderno` o usar busqueda global |
| Producto no aparece al escanear | Codigo/SKU no cargado o mal leido | Probar busqueda por nombre y validar catalogo |
| Veo aviso de duplicado en faltante | Ya hay faltante similar reciente | Revisar tab `Todos` antes de guardar |

## Verificacion
Verificacion funcional minima (manual):
1. Venta demo en `/pos` con 1 producto.
2. Alta de faltante desde FAB o busqueda global.
3. Resolucion del faltante desde `/cuaderno`.

Verificacion tecnica de soporte (no bloquea uso diario):
```bash
pnpm -C minimarket-system lint
pnpm -C minimarket-system build
npm run test:unit
node scripts/validate-doc-links.mjs
```

## Escalacion
Nivel 1 (turno):
- Repetir flujo una vez.
- Capturar mensaje exacto en pantalla.

Nivel 2 (responsable interno):
- Revisar `docs/TROUBLESHOOTING.md` y `docs/OPERATIONS_RUNBOOK.md`.
- Ejecutar checks rapidos de salud.

Nivel 3 (tecnico):
- Adjuntar evidencia: ruta, hora, accion, mensaje de error, requestId (si aplica).
- Registrar issue en `docs/closure/OPEN_ISSUES.md` si impacta operacion real.
