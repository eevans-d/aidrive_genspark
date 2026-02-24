# AUDIT_F5_ROUTING_UI_2026-02-24

## Objetivo
Verificar rutas productivas, componente asociado, control de acceso y estados UI.

## Comandos ejecutados
```bash
rg -n "ProtectedRoute|path=\"/" minimarket-system/src/App.tsx
rg -n "allowedRoles|canAccess\(" minimarket-system/src/components/Layout.tsx minimarket-system/src/lib/roles.ts
bash -lc 'routes=$(rg -o "lazy\(\(\) => import\(\x27\./pages/[A-Za-z]+\x27\)\)" minimarket-system/src/App.tsx | sed -E "s/.*\.\/pages\/(.*)\x27\)\).*/\1/" | sort -u); for page in $routes; do if [[ -f "minimarket-system/src/pages/${page}.test.tsx" || -f "minimarket-system/src/pages/${page}.test.ts" ]]; then echo "TEST_OK $page"; else echo "TEST_MISSING $page"; fi; done'
rg -n "ErrorBoundary|Skeleton|ErrorMessage|NotFound" minimarket-system/src/App.tsx minimarket-system/src/pages minimarket-system/src/components
```

## Salida relevante
- Todas las rutas productivas están envueltas en `ProtectedRoute` (`minimarket-system/src/App.tsx:83-233`).
- ACL explícita por rol:
  - `ROUTE_CONFIG` (`minimarket-system/src/lib/roles.ts:23-39`)
  - navegación `allowedRoles` (`minimarket-system/src/components/Layout.tsx:29-43`).
- Estados de carga/error/fallback presentes de forma amplia:
  - `ErrorBoundary` global (`minimarket-system/src/App.tsx:65`, `:240`)
  - `Skeleton*` y `ErrorMessage` en páginas críticas (`minimarket-system/src/pages/*`).
- Cobertura de páginas lazy:
  - `TEST_OK` en todas salvo `NotFound` (`TEST_MISSING NotFound`).

## Conclusión F5
Rutas productivas y controles de acceso están implementados consistentemente. Se detecta un gap menor de test en ruta fallback `NotFound`.

## Hallazgos F5
| ID | Severidad | Archivo:Linea | Hallazgo | Acción |
|---|---|---|---|---|
| A-008 | BAJO | `minimarket-system/src/App.tsx:30` | `NotFound` lazy route sin test dedicado | Agregar `minimarket-system/src/pages/NotFound.test.tsx` |
