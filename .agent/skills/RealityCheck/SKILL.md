---
name: RealityCheck
description: Mentor ultra-realista que analiza el proyecto desde producción real. Detecta gaps entre documentación y código, valida flujos E2E, identifica production killers y evalúa viabilidad con ojo crítico.
---

# RealityCheck Skill (Mentor Ultra-Realista)

> **Filosofía:** *"Si el usuario no puede completar su tarea en 3 clicks o menos, algo está mal."*
> 
> Este skill prioriza la **experiencia real del usuario** sobre la perfección técnica.
> Un sistema técnicamente perfecto que nadie puede usar, es un fracaso.

---

## 1. Objetivo Principal

**Evaluar si el sistema es USABLE y FUNCIONAL en producción real**, mediante:

| Prioridad | Análisis | Pregunta Clave |
|-----------|----------|----------------|
| 🥇 **P0** | Flujos de Usuario | ¿El usuario puede completar su tarea? |
| 🥈 **P1** | Experiencia Frontend | ¿Es ágil, simple, sin fricción? |
| 🥉 **P2** | Confiabilidad Backend | ¿Los datos fluyen correctamente? |
| 4️⃣ **P3** | Seguridad | ¿Es seguro sin sacrificar usabilidad? |
| 5️⃣ **P4** | Documentación | ¿Coincide con la realidad? |

---

## 2. Configuración del Proyecto

**⚠️ OBLIGATORIO:** Antes de ejecutar, lee `.agent/skills/project_config.yaml`

| Variable Config | Path Real | Uso |
|-----------------|-----------|-----|
| `{{paths.frontend_src}}` | `minimarket-system/src` | React App |
| `{{paths.backend_src}}` | `supabase/functions` | Edge Functions |
| `{{paths.docs}}` | `docs` | Documentación |
| `{{paths.tests_root}}` | `tests` | Archivos de prueba |
| `{{policies.retry_max}}` | `2` | Intentos máximos |

### Páginas del Sistema (9 totales)

| Página | Archivo | Propósito Usuario | Hook Asociado |
|--------|---------|-------------------|---------------|
| Dashboard | `Dashboard.tsx` | Ver estado general, tareas urgentes | `useDashboardStats` |
| Depósito | `Deposito.tsx` | Registrar entradas/salidas | `useDeposito` |
| Kardex | `Kardex.tsx` | Ver historial de movimientos | `useKardex` |
| Login | `Login.tsx` | Autenticarse | `useAuth` |
| Productos | `Productos.tsx` | CRUD de productos | `useProductos` |
| Proveedores | `Proveedores.tsx` | Gestionar proveedores | `useProveedores` |
| Rentabilidad | `Rentabilidad.tsx` | Ver análisis de rentabilidad | `useRentabilidad` |
| Stock | `Stock.tsx` | Ver niveles de inventario | `useStock` |
| Tareas | `Tareas.tsx` | Gestionar tareas pendientes | `useTareas` |

---

## 3. Criterios de Activación

| ✅ USAR cuando... | ❌ NO USAR cuando... |
|-------------------|----------------------|
| "¿Un empleado podría usar esto?" | Solo revisando código sin contexto UX |
| Pre-demo a cliente/stakeholder | Bug puntual aislado |
| Validar flujo completo de usuario | Cambios solo en documentación |
| Verificar UX antes de release | Proyecto aún en prototipo |
| Post-implementación de feature | Análisis de sintaxis (usar linting) |

---

## 4. Inputs Requeridos

| Input | Valores | Default | Ejemplo |
|-------|---------|---------|---------|
| **Scope** | `full`, `page:<nombre>`, `flow:<nombre>` | `full` | `page:Deposito` |
| **Depth** | `quick` (5min), `standard` (15min), `deep` (30min) | `standard` | `quick` |
| **Focus** | `ux`, `completeness`, `security`, `all` | `ux` | `focus ux` |

---

## 5. Protocolo de Ejecución

### FASE A: Análisis de Flujos de Usuario (PRIORIDAD MÁXIMA) ⭐

**A.1 - Mapear Flujos Críticos del Negocio**

| # | Flujo | Usuario | Frecuencia | Criticidad |
|---|-------|---------|------------|------------|
| 1 | Login → Dashboard | Todos | Diaria | 🔴 CRÍTICA |
| 2 | Registrar Entrada de Stock | Depósito | Diaria | 🔴 CRÍTICA |
| 3 | Registrar Salida de Stock | Depósito | Diaria | 🔴 CRÍTICA |
| 4 | Consultar Stock Actual | Todos | Constante | 🔴 CRÍTICA |
| 5 | Crear/Editar Producto | Admin | Semanal | 🟡 ALTA |
| 6 | Ver Tareas Pendientes | Todos | Diaria | 🟡 ALTA |
| 7 | Consultar Kardex | Admin | Ocasional | 🟢 MEDIA |
| 8 | Análisis Rentabilidad | Admin | Semanal | 🟢 MEDIA |

**A.2 - Checklist de Flujo (Por cada flujo crítico)**

```markdown
## Checklist: [NOMBRE DEL FLUJO]

### Usabilidad (Lo que el usuario experimenta)
- [ ] ¿Cuántos clicks requiere? (Target: ≤3)
- [ ] ¿Hay indicador de loading visible?
- [ ] ¿Hay mensaje de éxito claro?
- [ ] ¿Los errores son comprensibles?
- [ ] ¿Formulario con validación inmediata?
- [ ] ¿Navegable con teclado (Tab, Enter)?
- [ ] ¿Responsive en móvil?

### Completitud E2E
- [ ] Frontend: ¿Página/componente existe?
- [ ] Frontend: ¿Usa React Query hook?
- [ ] API: ¿Endpoint existe y responde?
- [ ] API: ¿Errores descriptivos?
- [ ] DB: ¿Datos de prueba disponibles?

### Feedback Visual
- [ ] Loading state visible
- [ ] Éxito con mensaje positivo
- [ ] Error con acción sugerida
- [ ] Estado vacío con guía
```

---

### FASE B: Auditoría de Experiencia Frontend 🎨

**B.1 - Checklist UX por Página**

Para cada página en `{{paths.frontend_src}}/pages/`:

```markdown
## UX Audit: [PÁGINA]

### Estados de Carga
| Estado | Implementado | Patrón Esperado |
|--------|--------------|-----------------|
| Loading | ✅/❌ | `isLoading ? <Spinner>` |
| Error | ✅/❌ | `isError ? <ErrorMessage>` |
| Vacío | ✅/❌ | `data.length === 0 ? <Empty>` |
| Éxito | ✅/❌ | Toast o mensaje inline |

### Formularios (si aplica)
| Aspecto | Estado |
|---------|--------|
| Validación cliente | ✅/❌ |
| Validación servidor | ✅/❌ |
| Campos requeridos marcados | ✅/❌ |
| Botón disabled durante submit | ✅/❌ |
| Limpieza post-submit exitoso | ✅/❌ |

### Navegación
| Aspecto | Estado |
|---------|--------|
| Contexto claro (dónde estoy) | ✅/❌ |
| Acciones principales visibles | ✅/❌ |
| Retorno a página anterior | ✅/❌ |
```

**B.2 - Detectar Anti-Patrones de UX**

```bash
# Debug olvidado en código
rg "console\.(log|debug)" {{paths.frontend_src}}/pages/ -g "*.tsx"

# Textos hardcoded en inglés (app es español)
rg "(Loading|Error|Submit|Cancel|Success)" {{paths.frontend_src}}/pages/ -g "*.tsx"

# Loading genérico sin contexto
rg "Cargando\.\.\." {{paths.frontend_src}}/pages/ -g "*.tsx"

# Errores vagos
rg "(Error al|Algo salió mal|Ocurrió un error)" {{paths.frontend_src}}/pages/ -g "*.tsx"

# Console.log en producción (prohibido por policies)
rg "{{policies.forbidden_patterns[0]}}" {{paths.frontend_src}}/ -g "*.tsx"
```

**B.3 - Métricas de Usabilidad**

| Métrica | Óptimo | Aceptable | Problemático |
|---------|--------|-----------|--------------|
| Clicks para tarea común | ≤3 | 4-5 | >5 |
| Tiempo respuesta visual | <200ms | <1s | >1s |
| Mensajes error útiles | 100% | >80% | <80% |
| Loading states | 100% | >90% | <90% |
| Mobile-friendly | 100% | >80% | <80% |

---

### FASE C: Simulación de Usuario Real 🧪

**C.1 - Escenario: Empleado registra entrada de mercadería**

```markdown
### Contexto
- Usuario: Empleado de depósito
- Tarea: Recibió 50 unidades de Coca-Cola del proveedor X
- Dispositivo: PC de escritorio

### Pasos del Usuario
1. Abre navegador → URL del sistema
2. Login con credenciales
3. Click en "Depósito" en menú lateral
4. Selecciona tipo "ENTRADA" (botón verde)
5. Busca producto "Coca-Cola" (autocomplete)
6. Ingresa cantidad: 50
7. Selecciona proveedor del dropdown
8. Click "REGISTRAR MOVIMIENTO"

### Puntos de Fricción a Verificar
| Paso | Qué revisar | Estado |
|------|-------------|--------|
| 2 | ¿Login recuerda sesión? | ✅/❌ |
| 4 | ¿Botones ENTRADA/SALIDA son claros? | ✅/❌ |
| 5 | ¿Búsqueda es rápida (<500ms)? | ✅/❌ |
| 5 | ¿Autocompletado muestra código barras? | ✅/❌ |
| 6 | ¿Input numérico tiene validación? | ✅/❌ |
| 8 | ¿Feedback inmediato al submit? | ✅/❌ |
| 8 | ¿Formulario se limpia tras éxito? | ✅/❌ |
```

**C.2 - Escenarios de Error**

| Prueba | Acción | Esperado | Estado |
|--------|--------|----------|--------|
| Cantidad inválida | Input "abc" | Validación inmediata | ✅/❌ |
| Producto inexistente | Buscar "xxxxx" | "No encontrado" | ✅/❌ |
| Stock insuficiente | Salida > stock | "Stock insuficiente" | ✅/❌ |
| Sin conexión | Offline | Error + retry | ✅/❌ |
| Sesión expirada | Token viejo | Redirect a login | ✅/❌ |

---

### FASE D: Validación Técnica Backend ⚙️

**D.1 - Contratos Frontend ↔ Backend (realidad actual)**

| Página | Hook | Fuente de datos principal | Gateway (si aplica) | Estado |
|--------|------|---------------------------|---------------------|--------|
| Dashboard | `useDashboardStats` | Supabase directo (`tareas_pendientes`, `stock_deposito`, `productos`) | — | ✅/❌ |
| Depósito | `useDeposito` | Supabase directo (`stock_deposito`, `movimientos_deposito`) | GET `/productos/dropdown`, GET `/proveedores/dropdown`, POST `/deposito/movimiento` | ✅/❌ |
| Kardex | `useKardex` | Supabase directo (`movimientos_deposito`) | GET `/productos/dropdown` | ✅/❌ |
| Productos | `useProductos` | Supabase directo (`productos`, `proveedores`, `precios_historicos`) | — | ✅/❌ |
| Proveedores | `useProveedores` | Supabase directo (`proveedores`, `productos`) | — | ✅/❌ |
| Rentabilidad | `useRentabilidad` | Supabase directo (`productos`) | GET `/proveedores/dropdown` | ✅/❌ |
| Stock | `useStock` | Supabase directo (`stock_deposito`) | — | ✅/❌ |
| Tareas | `useTareas` | Supabase directo (`tareas_pendientes`) | POST `/tareas`, PUT `/tareas/:id/completar`, PUT `/tareas/:id/cancelar` | ✅/❌ |

**D.2 - Production Killers (Solo los que afectan UX)**

```bash
# Timeouts que pueden bloquear UI
rg "(timeout|AbortController)" {{paths.backend_src}}/ -g "*.ts"

# Errores sin mensaje amigable
rg "throw new Error\(" {{paths.backend_src}}/ -g "*.ts"

# Catch vacíos (errores silenciosos)
rg "catch\s*\([^)]*\)\s*\{\s*\}" {{paths.backend_src}}/ -g "*.ts"

# Console.log en producción
rg "console\.log" {{paths.backend_src}}/ -g "*.ts" --glob '!*.test.ts'
```

---

### FASE E: Generar Reporte Centrado en Usuario

**Crear archivo:** `{{paths.docs}}/REALITY_CHECK_UX_[YYYY-MM-DD].md`

```markdown
# 🎯 RealityCheck UX Report

**Fecha:** [FECHA]
**Scope:** [full/page:X/flow:X]
**Depth:** [quick/standard/deep]

---

## 📊 Resumen Ejecutivo

| Métrica | Valor | Target |
|---------|-------|--------|
| **Score UX** | X/10 | ≥8 |
| **Flujos Funcionales** | X/8 | 8/8 |
| **Loading States** | X% | 100% |
| **Error Handling** | X% | 100% |
| **Mobile Ready** | ✅/⚠️/❌ | ✅ |

### Veredicto
🟢 LISTO PARA USUARIOS | 🟡 NECESITA PULIDO | 🔴 NO USAR AÚN

---

## 🔴 Blockers (Impiden uso real)

| # | Flujo | Problema | Impacto | Fix |
|---|-------|----------|---------|-----|

## 🟡 Fricciones (Molestan pero no bloquean)

| # | Página | Problema | Mejora |
|---|--------|----------|--------|

## 🟢 Quick Wins (Mejoras fáciles <2h)

| # | Cambio | Esfuerzo | Impacto |
|---|--------|----------|---------|

---

## 📋 Estado por Flujo/Página

| Elemento | Funciona | Clicks | Loading | Errores | Score |
|----------|----------|--------|---------|---------|-------|
| Login | ✅/❌ | X | ✅/❌ | ✅/❌ | X/10 |
| Dashboard | ✅/❌ | X | ✅/❌ | ✅/❌ | X/10 |
| Depósito | ✅/❌ | X | ✅/❌ | ✅/❌ | X/10 |
| ... | | | | | |

---

## 🎯 Plan de Acción Priorizado

1. **[BLOCKER]** ... | ~Xh
2. **[FRICCIÓN]** ... | ~Xh
3. **[QUICK WIN]** ... | ~Xh

---

## ✅ Lo que funciona bien
- [Aspectos positivos]
```

---

## 6. Quality Gates

| Gate | Criterio | Check |
|------|----------|-------|
| Flujos verificados | Todos los 🔴 CRÍTICOS probados | [ ] |
| UX por página | 9 páginas tienen checklist | [ ] |
| Escenarios simulados | ≥3 escenarios de usuario | [ ] |
| Reporte generado | Con score y plan acción | [ ] |

---

## 7. Anti-Loop / Stop-Conditions

| Condición | Acción |
|-----------|--------|
| >15 páginas en scope | Preguntar cuál módulo primero |
| Sin datos de prueba en DB | Reportar como Blocker #1 |
| >20 blockers encontrados | STOP, reportar "proyecto no listo" |
| Tests E2E no ejecutables | Continuar con análisis visual |
| Más de 30 min en modo `deep` | Generar reporte parcial |

**Retry Max:** `{{policies.retry_max}}` intentos antes de reportar bloqueo.

### Plantilla REPORTE DE BLOQUEO

> **🛑 BLOQUEO REALITYCHECK**
> * **Scope Analizado:** [SCOPE]
> * **Fases Completadas:** X de 5
> * **Razón del Bloqueo:** [Demasiados issues / Sin datos / Entorno caído]
> * **Último Progreso:** [Qué se logró antes del bloqueo]
> * **Acción Requerida:** [Usuario debe decidir X / Arreglar Y primero]

---

## 8. Integración con Otras Skills

```
CodeCraft (crea feature)
    ↓
RealityCheck: "¿El usuario puede usarlo?"
    ↓
Si UX OK → TestMaster → DeployOps
Si UX malo → Fix primero → RealityCheck
```

| Desde | Trigger | RealityCheck hace |
|-------|---------|-------------------|
| CodeCraft | Post-feature | Quick check del módulo |
| DeployOps | Pre-prod | Standard check obligatorio |
| TestMaster | Coverage bajo | Identificar qué probar |

---

## 9. Comandos Rápidos

| Necesidad | Comando |
|-----------|---------|
| Pre-demo (5 min) | `RealityCheck quick flow:login,dashboard` |
| Nueva página (15 min) | `RealityCheck standard page:Deposito` |
| Pre-release (30 min) | `RealityCheck deep full, focus ux` |
| Solo seguridad | `RealityCheck standard, focus security` |

---

## 10. Ejemplos de Invocación

### Quick Check Pre-Demo
```
"RealityCheck quick, focus ux"

Execution:
1. Verificar Login funciona
2. Dashboard carga sin errores
3. Flujo principal (depósito) responde

Output: Lista de máximo 3 blockers críticos
```

### Validar Nueva Página
```
"RealityCheck standard page:Deposito"

Execution:
1. Checklist UX completo de la página
2. Simulación de escenario principal
3. Verificación de estados (loading/error/vacío)

Output: Informe detallado de la página
```

### Auditoría Pre-Release
```
"RealityCheck deep full, focus ux"

Execution:
1. Las 5 fases completas
2. Todas las páginas auditadas
3. Todos los flujos simulados

Output: Reporte completo con score y plan
```

---

## 11. Mentalidad del Mentor

> **Pregunta siempre:** *"¿Mi abuela podría usar esto?"*
> 
> - Si necesitas explicar algo → La UI no es clara
> - Si el usuario espera >2 segundos → Es lento
> - Si el error dice "Error 500" → Es inútil
> - Si hay que scrollear para ver el botón → Está mal ubicado
> - Si el usuario no sabe qué pasó → Falta feedback

**El sistema más seguro y bien arquitecturado del mundo es INÚTIL si el usuario no puede completar su tarea.**
