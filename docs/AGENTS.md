# 🤖 Guía para Agentes IA

**Proyecto:** Mini Market System  
**Última actualización:** 2026-02-04  

---

## 📍 Estado Rápido

| Métrica | Valor |
|---------|-------|
| **Avance Global** | ⚠️ Cierre condicionado (pendientes re‑abiertos 2026-02-02) |
| **Build** | Último reporte documentado 2026-02-04 (ver `docs/closure/BUILD_VERIFICATION.md`) |
| **Tests** | Conteos en repo en `docs/ESTADO_ACTUAL.md` |
| **Frontend** | 9 páginas, 8 hooks React Query (Depósito usa useQuery inline; Login sin hook) |
| **Gateway** | 34 endpoints en código (`api-minimarket`) |
| **Supabase** | Confirmaciones 2026-02-01 re‑abiertas 2026-02-02 (ver `docs/ESTADO_ACTUAL.md`) |
| **Agent Skills** | ✅ TestMaster, DeployOps, DocuGuard, CodeCraft, RealityCheck activos |

---

## 🎯 Próximos Pasos

Plan vigente: **Hoja de Ruta MADRE** en `docs/HOJA_RUTA_MADRE_2026-01-31.md` (cierre condicionado).  
Estado consolidado: `docs/ESTADO_ACTUAL.md`.  
Plan modular: `docs/mpc/C1_MEGA_PLAN_v1.1.0.md` (histórico).  
Siguiente enfoque: cerrar pendientes críticos y luego monitoreo según `docs/OPERATIONS_RUNBOOK.md`.

---

## 🚀 Inicio Rápido (futuras sesiones)

1) **Leer estado actual:** `docs/ESTADO_ACTUAL.md`  
2) **Leer plan vigente:** `docs/HOJA_RUTA_MADRE_2026-01-31.md`  
3) **Auditoría RLS/Advisor:** `docs/AUDITORIA_RLS_EJECUTADA_2026-01-31.md`  
4) **Decisiones vigentes:** `docs/DECISION_LOG.md`  
5) **Checklist de cierre:** `docs/CHECKLIST_CIERRE.md`  
6) **Si toca Security Advisor WARN:** `docs/PLAN_MITIGACION_WARN_STAGING_2026-01-31.md`  

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

## 🧩 Habilidades/Skills (contexto agentes)

- Usar skills **solo si el agente lo soporta** y **solo cuando la tarea lo requiere**.  
- Si se requiere crear/instalar skills, documentar en `docs/DECISION_LOG.md` y actualizar `docs/ESTADO_ACTUAL.md`.  
- Si el entorno no soporta skills, proceder con los documentos base (Hoja de Ruta MADRE).

## 📂 Estructura del Proyecto

```
aidrive_genspark/
├── minimarket-system/        # Frontend React + Vite + TypeScript
│   ├── src/pages/            # 9 páginas (Rentabilidad, Kardex, etc.)
│   ├── src/hooks/queries/    # 8 custom hooks
│   └── src/lib/apiClient.ts  # Cliente para gateway
├── supabase/
│   ├── functions/            # 13 Edge Functions en repo
│   │   ├── api-minimarket/   # Gateway principal (34 endpoints)
│   │   ├── api-proveedor/    # API proveedor (9 endpoints)
│   │   ├── scraper-maxiconsumo/
│   │   ├── cron-*/           # Jobs programados
│   │   └── _shared/          # Módulos compartidos
│   └── migrations/           # 23 migraciones versionadas
├── tests/                    # Unit, E2E, Performance, Security
└── docs/                     # Documentación (ver HOJA_RUTA_MADRE)
```

---

## 📚 Documentación Esencial

| Archivo | Propósito |
|---------|-----------|
| `docs/ESTADO_ACTUAL.md` | **FUENTE DE VERDAD** - Estado y avance |
| `docs/HOJA_RUTA_MADRE_2026-01-31.md` | **PLAN ACTUAL** - checklist único y ruta a 100% |
| `docs/AUDITORIA_RLS_EJECUTADA_2026-01-31.md` | Evidencia RLS + Advisor (Partes 1-8) |
| `docs/PLAN_MITIGACION_WARN_STAGING_2026-01-31.md` | Plan operativo para WARN residual |
| `docs/archive/ROADMAP.md` | Plan histórico (archivado) |
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

- Licencia definitiva definida (MIT, `ORIGEN•AI`).
- Leaked password protection (Auth) **requiere plan Pro** (decisión actual: diferir hasta producción).
- Confirmar que el `From Email` de SMTP (Auth) sea un sender verificado real en SendGrid (si se usa en producción).
- Mantener evidencia actualizada en `docs/ESTADO_ACTUAL.md` y `docs/closure/*`.

---

## 🧭 Cómo obtener contexto en una nueva sesión

1. Leer `docs/ESTADO_ACTUAL.md` (fuente de verdad).
2. Leer `docs/HOJA_RUTA_MADRE_2026-01-31.md` (plan vigente).
3. Leer `docs/AUDITORIA_RLS_EJECUTADA_2026-01-31.md` (RLS + Advisor).
4. Confirmar checklist final en `docs/CHECKLIST_CIERRE.md`.
5. Revisar decisiones vigentes en `docs/DECISION_LOG.md`.
6. Validar credenciales y usuarios staging en `docs/OBTENER_SECRETOS.md`.
7. Verificar estado del repo:
  - `git status --short`
  - `git log -1 --oneline`
8. Si se tocan E2E:
  - `cd minimarket-system && VITE_USE_MOCKS=false pnpm exec playwright test auth.real`

---

## ⚠️ Advertencias Importantes

1. **NO crear archivos duplicados** - Verificar si ya existe
2. **NO usar console.log en supabase/functions** - Usar `createLogger()` de `_shared/logger.ts`
3. **Writes via Gateway** - Frontend NO escribe directo a Supabase, **excepto** alta inicial en `personal` durante `signUp` (AuthContext)
4. **Verificar build** - Siempre ejecutar `npm run build` después de cambios
5. **Documentar decisiones** - Actualizar `DECISION_LOG.md`

---

## 🔑 Variables de Entorno

```bash
# Producción
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173 # ejemplo local; en producción usar dominio real (confirmación usuario 2026-02-01, valor no expuesto)
API_PROVEEDOR_SECRET=secret-here

# Desarrollo
VITE_API_GATEWAY_URL=/api-minimarket
```

---

## 🤖 Herramientas de Agente (Skills)

El proyecto cuenta con "Skills" estandarizados para agentes, ubicados en `.agent/skills/`. **Debes usarlos obligatoriamente**.

| Skill | Ubicación | Propósito |
|-------|-----------|-----------|
| **TestMaster** | `.agent/skills/TestMaster/SKILL.md` | Ejecución de tests, debugging inteligente y cobertura. |
| **DeployOps** | `.agent/skills/DeployOps/SKILL.md` | Despliegues seguros en Supabase (Edge Functions/DB) y gestión de secretos. |
| **DocuGuard** | `.agent/skills/DocuGuard/SKILL.md` | Mantenimiento de documentación y reglas del proyecto. |
| **CodeCraft** | `.agent/skills/CodeCraft/SKILL.md` | Estandarización de Features (Scaffold, Tests, Patterns). |
| **RealityCheck** | `.agent/skills/RealityCheck/SKILL.md` | Mentor ultra-realista: valida flujos UX, detecta gaps doc↔código, audita pre-release. |

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
