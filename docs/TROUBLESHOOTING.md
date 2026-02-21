# Troubleshooting Operativo

Estado: Activo
Audiencia: Operador + soporte interno
Ultima actualizacion: 2026-02-21
Fuente de verdad: docs/ESTADO_ACTUAL.md
Owner documental: Soporte interno

> Basado en estado real del repo segun FactPack 2026-02-21.

## Objetivo
Resolver incidentes frecuentes de operacion sin depender de memoria tribal.

## Procedimiento Paso A Paso
### Protocolo corto (siempre)
1. Identificar pantalla/ruta afectada.
2. Registrar hora, accion y mensaje exacto.
3. Intentar accion una segunda vez.
4. Aplicar solucion de la tabla de incidentes.
5. Si no se resuelve, escalar con evidencia minima.

## Incidentes Frecuentes (Top 15)
| ID | Sintoma | Causa probable | Accion inmediata | Escalar cuando |
|---|---|---|---|---|
| T01 | No puedo iniciar sesion | Credenciales invalidas o sesion expirada | Reintentar login y validar usuario correcto | Falla continua en todos los usuarios |
| T02 | Redirige a Dashboard al abrir modulo | Rol sin permiso | Verificar acceso por rol | El rol deberia tener acceso y no lo tiene |
| T03 | POS no agrega producto al escanear | Codigo no existe o mal lectura | Buscar por nombre/SKU y validar catalogo | Ningun producto entra por scanner |
| T04 | Boton Cobrar no avanza | Carrito vacio o error de negocio | Revisar items, metodo de pago y mensajes | Error se repite con carrito valido |
| T05 | Fiado no permite cobro | Cliente no seleccionado | Seleccionar cliente en modal | Cliente seleccionado y sigue bloqueado |
| T06 | No aparece FAB de faltantes | Ruta `/pos` o `/pocket` | Ir a `/cuaderno` o usar busqueda global | Tampoco aparece en rutas con Layout |
| T07 | Faltante no se guarda | Error de red o validacion | Reintentar, simplificar texto, revisar conexion | Se repite 3 veces |
| T08 | Duplicados de faltantes | Mismo registro reportado varias veces | Revisar tab `Todos` antes de guardar | Crece en masa sin control |
| T09 | Cuaderno vacio inesperado | Filtro/tab incorrecto o sin datos | Cambiar tabs y revisar `Resueltos` | Se esperaba data y no aparece en ningun tab |
| T10 | Alertas no actualizan | Cache temporal o backend degradado | Refrescar vista y reabrir drawer | Sigue igual luego de refresco |
| T11 | Dashboard sin datos | Query fallida o sesion con problemas | Reintentar desde boton de error | Mismo error en varias cuentas |
| T12 | Error 401/403 en API | Token invalido o rol insuficiente | Relogin y repetir accion | Persiste con usuario valido |
| T13 | Error 500 en endpoint | Falla backend puntual | Capturar requestId y hora | Se mantiene >15 min |
| T14 | Tests de integracion no corren | `.env.test` faltante/incompleto | Ejecutar `--dry-run` y completar variables | Con `.env.test` correcto sigue fallando |
| T15 | Links de docs rotos | Drift documental | Ejecutar validador de links | Afecta docs operativas criticas |

## Comandos De Diagnostico Rapido
```bash
# Estado de links documentales
node scripts/validate-doc-links.mjs

# Prerrequisitos de integracion (sin ejecutar suite)
bash scripts/run-integration-tests.sh --dry-run

# Prerrequisitos de E2E (sin ejecutar suite)
bash scripts/run-e2e-tests.sh --dry-run

# Calidad base frontend
pnpm -C minimarket-system lint
pnpm -C minimarket-system build
```

Health checks manuales (requieren URL de proyecto):
```bash
curl -i "$SUPABASE_URL/functions/v1/api-minimarket/health"
curl -i "$SUPABASE_URL/functions/v1/api-proveedor/health"
```

## Errores Comunes
1. Cambiar muchas variables a la vez y perder trazabilidad.
2. Ejecutar comandos de test real sin `.env.test` valido.
3. Confundir rutas con y sin `Layout` para funciones de UI.
4. Asumir que un error de permisos es fallo de codigo.

## Verificacion
Checklist de salida del incidente:
- [ ] Problema reproducido o descartado
- [ ] Causa probable identificada
- [ ] Accion aplicada
- [ ] Resultado comprobado
- [ ] Evidencia guardada (mensaje/requestId/comando)

## Escalacion
Nivel 1 - Turno:
- Resolver con tabla Top 15.

Nivel 2 - Responsable interno:
- Validar runbook y monitoreo.
- Definir si hay impacto de negocio.

Nivel 3 - Soporte tecnico:
- Escalar con evidencia: ruta, endpoint, requestId, hora, comandos ejecutados, resultado.
- Registrar impacto en `docs/closure/OPEN_ISSUES.md` si aplica.
