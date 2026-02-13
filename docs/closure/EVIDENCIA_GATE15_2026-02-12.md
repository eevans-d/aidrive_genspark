# EVIDENCIA GATE 15 - Backup/Restore Operativo

**Fecha:** 2026-02-12
**Estado:** PASS

## Descripcion

Sistema de backup automatizado con retencion, scheduling via GitHub Actions,
y procedimiento de restore documentado con targets RTO/RPO.

## Archivos creados/modificados

| Archivo | Accion |
|---------|--------|
| `scripts/db-backup.sh` | MEJORADO - Retencion, compresion gzip, rotacion, logging |
| `scripts/db-restore-drill.sh` | CREADO - Script de drill de restore con medicion RTO |
| `.github/workflows/backup.yml` | CREADO - Backup diario automatizado (cron 03:00 UTC) |

## Automatizacion del backup

### Schedule
- **Frecuencia:** Diaria a las 03:00 UTC (cron en GitHub Actions)
- **Manual:** Tambien disponible via `workflow_dispatch`
- **Retencion:** 7 dias por defecto (configurable via `BACKUP_RETENTION_DAYS`)

### Almacenamiento
- **Primario:** GitHub Actions Artifacts (30 dias retencion)
- **Formato:** SQL comprimido con gzip (`.sql.gz`)
- **Rotacion:** Automatica - backups > 7 dias se eliminan del directorio local
- **Seguridad (nota):** los artifacts contienen dumps SQL completos. Para producción “full”, considerar cifrado previo a upload (o storage externo) y mantener el repo privado con acceso mínimo.

### Script mejorado (`scripts/db-backup.sh`)
- Compresion con gzip para reducir tamanho
- Rotacion automatica de archivos antiguos
- Logging con timestamps ISO 8601
- Medicion de duracion y tamanho
- Variable `BACKUP_RETENTION_DAYS` configurable

## Restore operativo

### Script de restore drill (`scripts/db-restore-drill.sh`)
- Requiere confirmacion explicita (`RESTORE_CONFIRMED=yes`)
- Soporta archivos `.sql.gz` y `.sql`
- Mide duracion para validar RTO
- Oculta credenciales en output

### Targets RTO/RPO

| Metrica | Target | Justificacion |
|---------|--------|---------------|
| **RPO** | 24 horas | Backup diario a las 03:00 UTC |
| **RTO** | < 15 minutos | Download artifact + gunzip + psql restore |

### Procedimiento de restore

```bash
# 1. Descargar backup desde GitHub Actions Artifacts
# 2. Restaurar:
RESTORE_CONFIRMED=yes SUPABASE_DB_URL=<url> ./scripts/db-restore-drill.sh ./backup_YYYYMMDD.sql.gz
```

## Validacion

| Check | Resultado |
|-------|-----------|
| Bash syntax (backup.sh) | PASS |
| Bash syntax (restore-drill.sh) | PASS |
| YAML syntax (backup.yml) | PASS |
| Scripts executable | PASS |

## Requisitos del owner para activacion

1. [ ] Configurar secret `SUPABASE_DB_URL` en GitHub repository settings
2. [ ] (Opcional) Configurar variable `BACKUP_RETENTION_DAYS` (default: 7)
3. [ ] Ejecutar manualmente el workflow `Scheduled Database Backup` para primer backup
4. [ ] Verificar que el artifact se genera correctamente
5. [ ] Realizar drill de restore contra base staging
6. [ ] (Recomendado) Confirmar que el repo es **privado** y que el acceso a artifacts está limitado a operadores autorizados
