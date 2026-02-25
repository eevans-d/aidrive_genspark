# AUDIT_F5_ROUTING_UI_2026-02-25

## Objetivo
Confirmar rutas funcionales, control de acceso por rol y estados de fallback UI.

## Comandos ejecutados
```bash
rg -n "ProtectedRoute|path=\"/|ErrorBoundary|SkeletonCard|NotFound" minimarket-system/src/App.tsx
rg -n "ROUTE_CONFIG|canAccessRoute|PUBLIC_ROLES" minimarket-system/src/lib/roles.ts
nl -ba minimarket-system/src/components/Layout.tsx | sed -n '28,44p'
node - <<'NODE'
const fs = require('fs');
const app = fs.readFileSync('minimarket-system/src/App.tsx','utf8');
const roles = fs.readFileSync('minimarket-system/src/lib/roles.ts','utf8');
const routeRegex = /path="([^"]+)"/g;
const appPaths = new Set(); let m; while ((m = routeRegex.exec(app))) appPaths.add(m[1]);
const cfgMatch = roles.match(/ROUTE_CONFIG:\s*Record<[^>]+>\s*=\s*\{([\s\S]*?)\};/);
const cfgPaths = new Set(); if (cfgMatch){ const keyRegex = /'([^']+)'\s*:/g; let k; while ((k = keyRegex.exec(cfgMatch[1]))) cfgPaths.add(k[1]); }
const ignore = new Set(['/login','*']);
console.log(JSON.stringify({missing_in_route_config:[...appPaths].filter(p=>!ignore.has(p) && !cfgPaths.has(p)),extra_in_route_config:[...cfgPaths].filter(p=>!appPaths.has(p))},null,2));
NODE
bash -lc 'routes=$(rg -o "lazy\(\(\) => import\(\x27\./pages/[A-Za-z]+\x27\)\)" minimarket-system/src/App.tsx | sed -E "s/.*\.\/pages\/(.*)\x27\)\).*/\1/" | sort -u); for page in $routes; do if [[ -f "minimarket-system/src/pages/${page}.test.tsx" || -f "minimarket-system/src/pages/${page}.test.ts" ]]; then echo "TEST_OK $page"; else echo "TEST_MISSING $page"; fi; done'
```

## Salida relevante
- Todas las rutas productivas protegidas por `ProtectedRoute`.
- ACL FE consistente:
  - `ROUTE_CONFIG` (`minimarket-system/src/lib/roles.ts:23-39`)
  - `canAccessRoute` deny-by-default (`:44-50`)
  - navegación por `allowedRoles` (`minimarket-system/src/components/Layout.tsx:28-44`).
- Verificación estructural ruta vs ACL: sin diferencias (`missing_in_route_config=[]`, `extra_in_route_config=[]`).
- Fallback global presente:
  - `ErrorBoundary` (`minimarket-system/src/App.tsx:65`)
  - `Skeleton` de carga (`:67-75`)
  - `NotFound` para wildcard (`:30`, `:233`).
- Cobertura de páginas lazy:
  - `TEST_MISSING NotFound`.

## Conclusión F5
Routing y control de acceso están consistentes en rutas productivas. Gap menor de cobertura: falta test dedicado para fallback `NotFound`.

## Hallazgos F5
| ID | Severidad | Archivo:Linea | Hallazgo | Acción |
|---|---|---|---|---|
| A-009 | BAJO | `minimarket-system/src/App.tsx:30` | Ruta fallback `NotFound` sin test dedicado | Agregar `minimarket-system/src/pages/NotFound.test.tsx` (smoke + render seguro) |
