# Setup E2E Testing con Docker

## Requisitos
- Docker y Docker Compose instalados
- Puerto 54322 disponible (PostgreSQL)

## Instrucciones

### 1. Iniciar DB Local
```bash
docker-compose -f docker-compose.e2e.yml up -d
```

### 2. Verificar que DB está corriendo
```bash
docker ps | grep minimarket-db
```

### 3. Ejecutar tests E2E
```bash
npx vitest run --config vitest.e2e.config.ts
```

### 4. Parar DB
```bash
docker-compose -f docker-compose.e2e.yml down
```

## Notas
- Las migraciones se aplican automáticamente desde `supabase/migrations/`
- Los tests E2E están en `tests/e2e/`
- El config usa tokens JWT de demo (solo para local)
