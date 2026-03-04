# DATA_HANDLING_POLICY.md — Mini Market System

> Politica de manejo de datos para el sistema Mini Market.
> Ultima actualizacion: 2026-03-04

---

## 1. Clasificacion de datos

| Nivel | Descripcion | Ejemplos | Control de acceso |
|-------|-------------|----------|-------------------|
| **Publico** | Datos visibles sin autenticacion | Catalogo de productos, precios de venta | RLS: lectura publica |
| **Interno** | Datos operativos accesibles por roles autenticados | Stock, movimientos de deposito, ordenes de compra | RLS: roles `admin`, `deposito`, `ventas` |
| **Sensible** | Datos personales (PII) de clientes/personal | Nombres, telefonos, emails, direcciones | RLS: roles `admin`, `ventas` |
| **Altamente sensible** | Datos financieros y imagenes con PII | Cuentas corrientes, imagenes de facturas OCR | RLS: roles `admin`; audit trail obligatorio |
| **Auditoria** | Registros de acciones del sistema | `facturas_ingesta_eventos`, `audit_log`, `cron_jobs_execution_log` | Solo `service_role`; lectura `admin` |

## 2. Tablas y sensibilidad

| Tabla | Sensibilidad | PII | Retencion |
|-------|-------------|-----|-----------|
| `productos` | Publico | No | Indefinida (soft-delete via `activo=false`) |
| `proveedores` | Interno | Contacto comercial | Indefinida (soft-delete via `activo=false`) |
| `stock_deposito` | Interno | No | Indefinida |
| `movimientos_deposito` | Interno | No | Indefinida (kardex contable) |
| `clientes` | Sensible | Si (nombre, telefono, email, direccion) | Indefinida; sujeto a derecho al olvido |
| `personal` | Sensible | Si (datos laborales vinculados a auth.users) | Indefinida |
| `pedidos` + `detalle_pedidos` | Sensible | Nombre/telefono cliente | 2 anos activo + archivo |
| `cuentas_corrientes_movimientos` | Altamente sensible | Ref. cliente financiero | 5 anos (requisito contable) |
| `facturas_ingesta` + imagenes | Altamente sensible | Imagenes pueden contener PII/CUIT | 2 anos activo; imagenes 1 ano post-aplicacion |
| `facturas_ingesta_items` | Interno | No | Vinculado a factura padre |
| `precios_compra` | Interno | No | Indefinida (historico de costos) |
| `audit_log` | Auditoria | Ref. usuario_id | 1 ano minimo |
| `cron_jobs_execution_log` | Auditoria | No | 30 dias (cron maintenance) |
| `tareas_pendientes` | Interno | Nombre asignado | Indefinida |

## 3. Retencion y limpieza

### 3.1 Politicas activas

| Dato | Retencion | Mecanismo |
|------|-----------|-----------|
| Logs de ejecucion cron | 30 dias | `job_maintenance_cleanup` (Domingo 04:00 UTC) |
| Backups de base de datos | 7 dias | GitHub Actions artifact retention (`BACKUP_RETENTION_DAYS`) |
| Materialized views (metricas) | Refresh periodico | `refresh_tareas_metricas()` |

### 3.2 Politicas pendientes de implementar

| Dato | Retencion objetivo | Estado |
|------|-------------------|--------|
| Imagenes de facturas en Storage | 1 ano post-aplicacion | **PENDIENTE** — requiere cron de limpieza |
| Audit log | 1 ano | **PENDIENTE** — requiere cron de archivado |
| Pedidos entregados/cancelados > 2 anos | Archivo frio | **PENDIENTE** |

## 4. Backup y recuperacion

### 4.1 Estrategia actual

- **Frecuencia:** Diario a las 03:00 UTC (GitHub Actions)
- **Script:** `scripts/db-backup.sh`
- **Formato:** `pg_dump` comprimido
- **Almacenamiento:** GitHub Artifacts (7 dias)
- **Cifrado:** En transito (TLS); en reposo (GitHub storage encryption)

### 4.2 Objetivos de recuperacion

| Metrica | Objetivo | Estado |
|---------|----------|--------|
| **RPO** (Recovery Point Objective) | 24 horas | Cumplido (backup diario) |
| **RTO** (Recovery Time Objective) | 4 horas | Estimado (no probado formalmente) |

### 4.3 Procedimiento de restauracion

1. Descargar backup mas reciente de GitHub Artifacts
2. `pg_restore` contra instancia Supabase
3. Verificar integridad: `SELECT count(*) FROM productos`, clientes, stock
4. Re-ejecutar `REFRESH MATERIALIZED VIEW tareas_metricas`
5. Validar Edge Functions contra datos restaurados

## 5. Control de acceso

### 5.1 Roles y permisos (RLS)

| Rol | Acceso datos | Tablas sensibles |
|-----|-------------|-----------------|
| `admin` | Lectura/escritura completa | Todas |
| `deposito` | Stock, movimientos, productos, proveedores | No: clientes, cuentas corrientes |
| `ventas` | Pedidos, clientes, ventas POS, cuentas corrientes | No: proveedores internos |
| `service_role` | Bypass RLS (solo backend/cron) | Audit log, cron execution |

### 5.2 Principio de minimo privilegio

- Edge Functions usan JWT del usuario (no service_role) para queries RLS
- Service role solo para: audit logging, cron jobs, circuit breaker/rate limit
- `SECURITY DEFINER` con `SET search_path = public` en todas las funciones

## 6. Datos personales y derechos del titular

### 6.1 PII almacenado

- **Clientes:** nombre, telefono, email, direccion, whatsapp_e164, link_pago
- **Personal:** datos vinculados a auth.users (email, metadata)
- **Pedidos:** cliente_nombre, cliente_telefono (copia denormalizada)

### 6.2 Derecho al olvido (borrado)

Procedimiento para solicitudes de borrado de datos personales:

1. Verificar identidad del solicitante
2. Soft-delete del registro `clientes` (`activo = false`)
3. Anonimizar datos denormalizados en `pedidos` (reemplazar nombre/telefono con "ANONIMIZADO")
4. Mantener registros financieros (`cuentas_corrientes_movimientos`) con referencia anonimizada por requisito contable
5. Eliminar imagenes de facturas asociadas al proveedor del cliente (si aplica)
6. Registrar en `audit_log` la accion de borrado

### 6.3 Portabilidad

- Exportar datos del cliente en formato JSON via endpoint dedicado (pendiente de implementar)
- Incluir: datos personales, historial de pedidos, saldo cuenta corriente

## 7. Terceros y procesamiento externo

| Proveedor | Datos procesados | Proposito | Ubicacion |
|-----------|-----------------|-----------|-----------|
| Supabase (AWS) | Base de datos completa | Hosting PostgreSQL | US/EU (segun proyecto) |
| Google Cloud Vision | Imagenes de facturas | OCR extraction | US (GCP) |
| GitHub Actions | Backups cifrados | CI/CD + backup | US (Azure) |

## 8. Cumplimiento

| Framework | Estado | Notas |
|-----------|--------|-------|
| GDPR | **No evaluado** | Aplicable si hay usuarios EU |
| Ley 25.326 (Argentina) | **Parcial** | RLS implementado; falta registro de bases ante AAIP |
| PCI-DSS | **No aplica** | No se procesan datos de tarjeta directamente |

## 9. Incidentes de seguridad

### 9.1 Clasificacion

| Severidad | Ejemplo | Tiempo de respuesta |
|-----------|---------|-------------------|
| Critica | Exfiltracion de datos PII | Inmediato (< 1 hora) |
| Alta | Acceso no autorizado detectado | < 4 horas |
| Media | Falla de backup | < 24 horas |
| Baja | Warning de RLS en logs | Siguiente sprint |

### 9.2 Procedimiento

1. Detectar via audit log / alertas
2. Contener: revocar tokens, desactivar funcion afectada
3. Evaluar impacto y datos comprometidos
4. Notificar titulares si aplica (PII comprometido)
5. Documentar en `INCIDENT_LOG.md` y post-mortem
6. Remediar y verificar

---

> **Revision:** Este documento debe revisarse trimestralmente o ante cambios significativos en el esquema de datos.
