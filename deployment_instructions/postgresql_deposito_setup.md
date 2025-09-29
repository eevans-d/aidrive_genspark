# Configuración PostgreSQL - Sistema Depósito

## Variables de Entorno

```bash
export DEPOSITO_PG_HOST=localhost
export DEPOSITO_PG_PORT=5432
export DEPOSITO_PG_DATABASE=deposito_db
export DEPOSITO_PG_USER=deposito_user
export DEPOSITO_PG_PASSWORD=deposito_pass
```

## Aplicar Optimizaciones

```bash
# 1. Crear base de datos
createdb -h $DEPOSITO_PG_HOST -p $DEPOSITO_PG_PORT -U $DEPOSITO_PG_USER $DEPOSITO_PG_DATABASE

# 2. Aplicar optimizaciones
psql -h $DEPOSITO_PG_HOST -p $DEPOSITO_PG_PORT -U $DEPOSITO_PG_USER -d $DEPOSITO_PG_DATABASE -f config/database/deposito_postgresql_optimizations.sql
```

## Verificar Aplicación

```bash
psql -h $DEPOSITO_PG_HOST -p $DEPOSITO_PG_PORT -U $DEPOSITO_PG_USER -d $DEPOSITO_PG_DATABASE -c "SELECT COUNT(*) FROM pg_indexes WHERE indexname LIKE 'idx_%';"
```
