# Hoja de Ruta / Checklist (30 pasos) — Mini Market System

**Propósito:** documento **autosuficiente** para ejecutar en modo planning (Antigravity) o por un agente (GitHub Copilot).  
**Contexto:** repo `aidrive_genspark`, entorno híbrido (local + Supabase).  
**Fecha de creación:** 2026-01-27.

---

## Reglas de seguridad (obligatorias)
- **Nunca** exponer secretos en commits, logs o docs.  
- `.env.test` es **local** y debe estar en `.gitignore`.  
- `SUPABASE_SERVICE_ROLE_KEY` **nunca** va al frontend.

---

## Prerrequisitos (antes de iniciar)
- Node.js 20+, pnpm, npm, deno, supabase CLI.  
- Docker funcionando (para Supabase local).  
- Archivo `.env.test` con **SUPABASE_URL**, **SUPABASE_ANON_KEY**, **SUPABASE_SERVICE_ROLE_KEY**, **API_PROVEEDOR_SECRET**, **TEST_PASSWORD**.

---

## Checklist (30 pasos)

> Cada paso incluye **qué hacer**, **cómo hacerlo**, y **qué cuenta como DONE**.  
> **Regla de oro:** si un paso falla, **NO marques DONE**; registra el error y detén el flujo o vuelve al paso anterior.

### Cómo marcar DONE (criterio uniforme)
- **DONE** = comando ejecutado + salida esperada + evidencia mínima (log/captura/archivo actualizado).
- Si un paso es manual (panel/web), DONE requiere **captura o nota** con fecha/hora.

### Evidencia mínima requerida (por grupo)
- **Instalación/Build/Lint/Typecheck:** salida del comando o log corto con timestamp.
- **Tests:** cantidad de tests passing + duración (copiar resumen de consola).
- **Supabase local:** `supabase status` y nota sobre servicios detenidos.
- **Rollback staging:** captura del panel con timestamp aplicado + nota del motivo.
- **Documentación:** diff o referencia al archivo actualizado.

1. [ ] **Validar rama**: estar en `main` o `staging`.  
   - Comando: `git branch --show-current`  
   - DONE: salida muestra `main` o `staging`.

2. [ ] **Sincronizar repo**: asegurar historial limpio.  
   - Comando: `git status -sb`  
   - DONE: no hay cambios **o** se registran cambios locales como excepción explícita.

3. [ ] **Validar dependencias backend**.  
   - Comando: `npm install`  
   - DONE: instalación completa sin errores.

4. [ ] **Validar dependencias frontend**.  
   - Comando: `cd minimarket-system && pnpm install --prefer-offline`  
   - DONE: instalación completa sin errores.  
   - Nota: volver a raíz con `cd ..` antes del siguiente paso si aplica.

5. [ ] **Lint frontend**.  
   - Comando: `cd minimarket-system && pnpm run lint`  
   - DONE: 0 errores y 0 warnings.

6. [ ] **Typecheck frontend**.  
   - Comando: `cd minimarket-system && npx tsc --noEmit`  
   - DONE: sin errores de TypeScript.

7. [ ] **Build frontend prod**.  
   - Comando: `cd minimarket-system && pnpm run build:prod`  
   - DONE: `minimarket-system/dist/` generado sin errores.

8. [ ] **Unit tests backend**.  
   - Comando: `npm run test:unit`  
   - DONE: 100% passing; anotar cantidad total.

9. [ ] **Coverage**.  
   - Comando: `npm run test:coverage`  
   - DONE: `coverage/` generado + % global registrado en docs.

10. [ ] **Integration tests local**.  
   - Comando: `bash scripts/run-integration-tests.sh`  
   - DONE: 38/38 passing.  
   - Advertencia: reinicia DB local; **no ejecutar** si hay datos locales críticos.

11. [ ] **Security tests reales**.  
   - Comando: `RUN_REAL_TESTS=true npm run test:security`  
   - DONE: 15/15 passing.  
   - Nota: requiere `.env.test` válido.

12. [ ] **Performance tests reales**.  
   - Comando: `RUN_REAL_TESTS=true npm run test:performance`  
   - DONE: 6/6 passing.

13. [ ] **Contract tests reales**.  
   - Comando: `RUN_REAL_TESTS=true npm run test:contracts`  
   - DONE: 11/11 passing.  
   - Nota: requiere `ALLOWED_ORIGINS` o `TEST_ORIGIN` configurado para evitar CORS.

14. [ ] **E2E backend smoke (local)**.  
   - Comando: `npm run test:e2e`  
   - DONE: 4/4 passing.  
   - Nota: requiere Supabase local operativo.

15. [ ] **E2E frontend (mocks)**.  
   - Comando: `cd minimarket-system && pnpm test:e2e:frontend`  
   - DONE: passing sin errores.

16. [ ] **E2E frontend auth real**.  
   - Comando: `cd minimarket-system && VITE_USE_MOCKS=false pnpm exec playwright test auth.real`  
   - DONE: 7/7 passing.  
   - Nota: requiere usuarios en Supabase Auth + `TEST_PASSWORD`.

17. [ ] **Deno check (Edge Functions)**.  
   - Comando: `deno check --no-lock --node-modules-dir=auto supabase/functions/**/index.ts`  
   - DONE: sin errores.

18. [ ] **Verificar estado Supabase local**.  
   - Comando: `supabase status`  
   - DONE: servicios activos o advertencias documentadas (imgproxy/pooler).

19. [ ] **Revisar logs de servicios detenidos**.  
   - Comando: `supabase logs`  
   - DONE: causa identificada o registrada como bloqueo.

20. [ ] **Auditar patrones prohibidos**.  
   - Comando: `rg -n "console\\.log" supabase/functions` y `rg -n "ey[A-Za-z0-9-_=]{20,}" supabase/functions`  
   - DONE: sin hallazgos o hallazgos documentados y corregidos.

21. [ ] **Validar migraciones en staging**.  
   - Comando: `bash migrate.sh status staging`  
   - DONE: local/remote alineados.

22. [ ] **Planificar rollback staging** (PITR).  
   - Acción: obtener timestamp exacto del snapshot.  
   - DONE: timestamp documentado con fecha/hora UTC.

23. [ ] **Ejecutar rollback staging (manual en Supabase Dashboard)**.  
   - Acción: Settings → Database → Point in Time Recovery.  
   - DONE: rollback confirmado y registrado (captura o nota).  
   - Advertencia: **destructivo**; requiere confirmación explícita del owner.

24. [ ] **Revalidar healthcheck** (staging).  
   - Comando: `curl -s \"$SUPABASE_URL/functions/v1/api-minimarket/health\"`  
   - DONE: HTTP 200.

25. [ ] **Revisar cobertura baja** (cron jobs).  
   - Acción: listar archivos con <10% y crear plan de tests.  
   - DONE: backlog con prioridades y archivos listados.

26. [ ] **Crear tests para cron-jobs-maxiconsumo**.  
   - Acción: agregar unit tests para `jobs/*` + `execution-log`.  
   - DONE: cobertura de cron sube >40% y tests pasan.

27. [ ] **Verificar hooks frontend clave**.  
   - Acción: testear `useDashboardStats`, `useKardex`, `useProductos`.  
   - DONE: cobertura sube y tests pasan.

28. [ ] **Actualizar documentación de build verification**.  
   - Archivo: `docs/closure/BUILD_VERIFICATION.md`  
   - DONE: fechas, comandos y resultados correctos.

29. [ ] **Actualizar estado actual**.  
   - Archivo: `docs/ESTADO_ACTUAL.md`  
   - DONE: métricas y fechas actuales.

30. [ ] **Commit + push**.  
   - Comandos: `git add -A && git commit -m \"docs: refresh roadmap checklist\" && git push`  
   - DONE: remoto actualizado con el commit correcto.  
   - Nota: si no hay cambios, **NO** commitear.

---

## Notas operativas
- Si un paso falla, registrar el error y volver al paso anterior.  
- No continuar con despliegues si los tests críticos fallan.  
- Prioridad inmediata: **rollback staging** + **subir cobertura**.
