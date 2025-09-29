# Configuración PostgreSQL - Business Intelligence

## Variables de Entorno

```bash
export BI_PG_HOST=localhost
export BI_PG_PORT=5432
export BI_PG_DATABASE=business_intelligence
export BI_PG_USER=bi_user
export BI_PG_PASSWORD=password
```

## Aplicar Optimizaciones

```bash
# 1. Crear base de datos
createdb -h $BI_PG_HOST -p $BI_PG_PORT -U $BI_PG_USER $BI_PG_DATABASE

# 2. Aplicar optimizaciones
psql -h $BI_PG_HOST -p $BI_PG_PORT -U $BI_PG_USER -d $BI_PG_DATABASE -f config/database/bi_postgresql_indices.sql
```

## Verificar Aplicación

```bash
psql -h $BI_PG_HOST -p $BI_PG_PORT -U $BI_PG_USER -d $BI_PG_DATABASE -c "SELECT COUNT(*) FROM pg_indexes WHERE indexname LIKE 'idx_%';"
```
