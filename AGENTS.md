# 🤖 Guía para Agentes IA

**Proyecto:** Mini Market System  
**Última actualización:** 2026-01-23  

---

## 📍 Estado Rápido

| Métrica | Valor |
|---------|-------|
| **Avance Global** | 95% (pendientes WS7.5 + rollback probado + inventario/validacion de secretos) |
| **Build** | ✅ Passing |
| **Tests** | 668 passing (646 unit incl frontend + 15 security + 7 e2e auth real) |
| **Frontend** | 90% (React Query + Gateway) |
| **Gateway** | 100% (26 endpoints desplegados) |
| **Supabase** | ✅ Producción configurada |

---

## 🎯 Próximos Pasos

Plan definitivo **completado con pendientes P1** (WS7.5 y rollback probado). Ver estado consolidado en `docs/ESTADO_ACTUAL.md`.
Plan modular vigente: `docs/mpc/C1_MEGA_PLAN_v1.1.0.md`.

---

## 🧭 Rol del Director (Codex) y Ejecutores

**Director (Codex):**
- Diseña y actualiza planificación modular (mega plan + subplanes).
- Detecta inconsistencias y actualiza documentación/evidencias.
- No ejecuta tareas operativas salvo pedido explícito.

**Ejecutores (juniors/otros agentes):**
- Ejecutan tareas siguiendo la plantilla y condiciones definidas en `docs/mpc/C1_MEGA_PLAN_v1.1.0.md`.
- Registran evidencia y actualizan `docs/CHECKLIST_CIERRE.md` y `docs/DECISION_LOG.md`.
- No improvisan comandos ni flujos fuera del plan.

---

## 📂 Estructura del Proyecto

```
aidrive_genspark/
├── minimarket-system/        # Frontend React + Vite + TypeScript
│   ├── src/pages/            # 9 páginas (8 con data; Login no aplica)
│   ├── src/hooks/queries/    # 8 custom hooks
│   └── src/lib/apiClient.ts  # Cliente para gateway
├── supabase/
│   ├── functions/            # 13 Edge Functions desplegadas
│   │   ├── api-minimarket/   # Gateway principal (26 endpoints)
│   │   ├── api-proveedor/    # API proveedor (9 endpoints)
│   │   ├── scraper-maxiconsumo/
│   │   ├── cron-*/           # Jobs programados
│   │   └── _shared/          # Módulos compartidos
│   └── migrations/           # 10 migraciones aplicadas
├── tests/                    # Unit, E2E, Performance, Security
└── docs/                     # Documentación (21+ archivos)
```

---

## 📚 Documentación Esencial

| Archivo | Propósito |
|---------|-----------|
| `docs/ESTADO_ACTUAL.md` | **FUENTE DE VERDAD** - Estado y avance |
| `docs/PLAN_PENDIENTES_DEFINITIVO.md` | **PLAN ACTUAL** - ✅ completado |
| `docs/ROADMAP.md` | Plan rolling 90 días |
| `docs/OBTENER_SECRETOS.md` | Credenciales Supabase |
| `docs/SECRETOS_REQUERIDOS_Y_VALIDACION.md` | Inventario y validación de secretos |
| `docs/ARCHITECTURE_DOCUMENTATION.md` | Arquitectura técnica |

---

## ⚡ Comandos Frecuentes

```bash
# Frontend
cd minimarket-system && npm run dev    # Desarrollo
cd minimarket-system && npm run build  # Build producción

# Tests
npm run test:unit                      # Tests unitarios

# Git
git status && git add -A && git commit -m "msg" && git push origin main
```

---

## 🎯 Próximas Tareas Priorizadas

- Completar WS7.5 roles server-side (tabla/claims; eliminar fallback a `user_metadata`).
- Probar rollback en staging (OPS-SMART-1) y guardar evidencia.
- Completar inventario/validacion de secretos (M10) y registrar owners.
- Mantener mantenimiento y observabilidad.

---

## 🧭 Cómo obtener contexto en una nueva sesión

1. Leer `docs/ESTADO_ACTUAL.md` (fuente de verdad).
2. Confirmar checklist final en `docs/CHECKLIST_CIERRE.md`.
3. Revisar decisiones vigentes en `docs/DECISION_LOG.md`.
4. Validar credenciales y usuarios staging en `docs/OBTENER_SECRETOS.md`.
5. Verificar estado del repo:
  - `git status --short`
  - `git log -1 --oneline`
6. Si se tocan E2E:
  - `cd minimarket-system && VITE_USE_MOCKS=false pnpm exec playwright test auth.real`

---

## ⚠️ Advertencias Importantes

1. **NO crear archivos duplicados** - Verificar si ya existe
2. **NO usar console.log en supabase/functions** - Usar `createLogger()` de `_shared/logger.ts`
3. **Writes via Gateway** - Frontend NO escribe directo a Supabase
4. **Verificar build** - Siempre ejecutar `npm run build` después de cambios
5. **Documentar decisiones** - Actualizar `DECISION_LOG.md`

---

## 🔑 Variables de Entorno

```bash
# Producción
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
ALLOWED_ORIGINS=https://dominio.com
API_PROVEEDOR_SECRET=secret-here

# Desarrollo
VITE_API_GATEWAY_URL=/api-minimarket
```

---

## 📊 Patrones de Código

### Frontend - React Query Hook
```typescript
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

export function useXxx() {
  return useQuery({
    queryKey: ['xxx'],
    queryFn: async () => {
      const { data, error } = await supabase.from('xxx').select('*')
      if (error) throw error
      return data
    },
    staleTime: 1000 * 60 * 2,
  })
}
```

### Frontend - Mutación via Gateway
```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { xxxApi } from '../lib/apiClient'

const mutation = useMutation({
  mutationFn: (params) => xxxApi.create(params),
  onSuccess: () => queryClient.invalidateQueries({ queryKey: ['xxx'] })
})
```

### Gateway - Nuevo Endpoint
```typescript
if (path === '/xxx' && method === 'POST') {
  checkRole(['admin', 'supervisor'])
  const body = await parseJsonBody<{ field: string }>()
  if (body instanceof Response) return body
  
  const result = await insertTable(supabaseUrl!, 'xxx', body, requestHeaders())
  if (!result.success) return respondFail('INSERT_ERROR', result.error, 500)
  
  await logAudit('XXX_CREATED', 'xxx', result.data?.id, { field: body.field })
  return respondOk(result.data, 201)
}
```

---

*Este archivo es la guía rápida para agentes IA. Para detalles, ver docs/ARCHITECTURE_DOCUMENTATION.md*
