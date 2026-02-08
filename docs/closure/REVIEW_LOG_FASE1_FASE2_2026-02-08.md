# REVIEW_LOG_FASE1_FASE2_2026-02-08

Auditoria/QA de cierre **FASE 1** y **FASE 2** (roadmap `docs/HOJA_RUTA_ACTUALIZADA_2026-02-08.md`).

Reglas aplicadas: no destructivo, sin secretos en logs, sin reescritura de historia, evidencia auditable en este archivo.

---

## PRELIGHT (baseline antes de tocar nada)

### date

```bash
date 
```

```
Sun Feb  8 06:04:47 UTC 2026
```

### git status --porcelain=v1

```bash
git status --porcelain=v1 
```

```
 M docs/closure/EXECUTION_LOG_2026-02-08_ROADMAP.md
?? docs/closure/REVIEW_LOG_FASE1_FASE2_2026-02-08.md
```

### git rev-parse --abbrev-ref HEAD

```bash
git rev-parse --abbrev-ref HEAD 
```

```
feat/roadmap-exec-20260208
```

### git rev-parse HEAD

```bash
git rev-parse HEAD 
```

```
f909478d0ddb77f23ef752a3eb0d2eb6d31aa0b7
```

### git log -n 10 --oneline --decorate

```bash
git log -n 10 --oneline --decorate 
```

```
f909478 (HEAD -> feat/roadmap-exec-20260208, origin/feat/roadmap-exec-20260208) feat: FASE 4 release readiness — smoke tests, observabilidad, secretos checklist
dc57704 feat: FASE 3 UX — alta producto, cambio precio, ajuste stock, acciones alertas
926513e feat: FASE 1-2 hardening — auth resilience, shared rate limit, circuit breaker, api-proveedor allowlist
338b30b (origin/chore/closure-prep-20260202, chore/closure-prep-20260202) docs: make db push non-interactive in Claude prompt
6e81f87 docs: link Claude Code executor prompt in estado actual
1a36bd1 docs: refine roadmap and add Claude Code executor prompt
c7df903 docs: clarify roadmap baseline commit
85ab94a docs: add updated roadmap + checklist (2026-02-08)
6584a1b chore: post-plan verification, docs, and stock MV refresh RPC
feb0d62 feat: add ofertas_stock table and related RPCs for managing stock offers
```

### supabase --version

```bash
supabase --version 
```

```
2.72.7
A new version of Supabase CLI is available: v2.75.0 (currently installed v2.72.7)
We recommend updating regularly for new features and bug fixes: https://supabase.com/docs/guides/cli/getting-started#updating-the-supabase-cli
```

### supabase migration list --linked

```bash
supabase migration list --linked 
```

```
Initialising login role...
Connecting to remote database...

  
   Local          | Remote         | Time (UTC)          
  ----------------|----------------|---------------------
   20250101000000 | 20250101000000 | 2025-01-01 00:00:00 
   20251103       | 20251103       | 20251103            
   20260104020000 | 20260104020000 | 2026-01-04 02:00:00 
   20260104083000 | 20260104083000 | 2026-01-04 08:30:00 
   20260109060000 | 20260109060000 | 2026-01-09 06:00:00 
   20260109070000 | 20260109070000 | 2026-01-09 07:00:00 
   20260109090000 | 20260109090000 | 2026-01-09 09:00:00 
   20260110000000 | 20260110000000 | 2026-01-10 00:00:00 
   20260110100000 | 20260110100000 | 2026-01-10 10:00:00 
   20260116000000 | 20260116000000 | 2026-01-16 00:00:00 
   20260131000000 | 20260131000000 | 2026-01-31 00:00:00 
   20260131020000 | 20260131020000 | 2026-01-31 02:00:00 
   20260131034034 | 20260131034034 | 2026-01-31 03:40:34 
   20260131034328 | 20260131034328 | 2026-01-31 03:43:28 
   20260202000000 | 20260202000000 | 2026-02-02 00:00:00 
   20260202083000 | 20260202083000 | 2026-02-02 08:30:00 
   20260204100000 | 20260204100000 | 2026-02-04 10:00:00 
   20260204110000 | 20260204110000 | 2026-02-04 11:00:00 
   20260204120000 | 20260204120000 | 2026-02-04 12:00:00 
   20260206000000 | 20260206000000 | 2026-02-06 00:00:00 
   20260206010000 | 20260206010000 | 2026-02-06 01:00:00 
   20260206020000 | 20260206020000 | 2026-02-06 02:00:00 
   20260206030000 | 20260206030000 | 2026-02-06 03:00:00 
   20260206235900 | 20260206235900 | 2026-02-06 23:59:00 
   20260207000000 | 20260207000000 | 2026-02-07 00:00:00 
   20260207010000 | 20260207010000 | 2026-02-07 01:00:00 
   20260207020000 | 20260207020000 | 2026-02-07 02:00:00 
   20260207030000 | 20260207030000 | 2026-02-07 03:00:00 
   20260208000000 | 20260208000000 | 2026-02-08 00:00:00 
   20260208010000 | 20260208010000 | 2026-02-08 01:00:00 
   20260208020000 |                | 2026-02-08 02:00:00 
   20260208030000 |                | 2026-02-08 03:00:00 

A new version of Supabase CLI is available: v2.75.0 (currently installed v2.72.7)
We recommend updating regularly for new features and bug fixes: https://supabase.com/docs/guides/cli/getting-started#updating-the-supabase-cli
```

### supabase functions list (names/versions/verify_jwt)

```bash
bash -lc supabase\ functions\ list\ --project-ref\ dqaygmjpzoqjjrywdsxi\ --output\ json\ \|\ jq\ -r\ \'.\[\].name\ +\ \"\\t\"\ +\ \"v\"\ +\ \(\ .version\|tostring\ \)\ +\ \"\\tverify_jwt=\"\ +\ \(\ .verify_jwt\|tostring\ \)\'\ \|\ sort 
```

```
A new version of Supabase CLI is available: v2.75.0 (currently installed v2.72.7)
We recommend updating regularly for new features and bug fixes: https://supabase.com/docs/guides/cli/getting-started#updating-the-supabase-cli
jq: error (at <stdin>:166): Cannot index array with string "verify_jwt"
```

### supabase secrets list (names only)

```bash
bash -lc supabase\ secrets\ list\ --project-ref\ dqaygmjpzoqjjrywdsxi\ --output\ json\ \|\ jq\ -r\ \'.\[\].name\'\ \|\ sort 
```

```
A new version of Supabase CLI is available: v2.75.0 (currently installed v2.72.7)
We recommend updating regularly for new features and bug fixes: https://supabase.com/docs/guides/cli/getting-started#updating-the-supabase-cli
ALLOWED_ORIGINS
API_PROVEEDOR_SECRET
NOTIFICATIONS_MODE
SENDGRID_API_KEY
SMTP_FROM
SMTP_HOST
SMTP_PASS
SMTP_PORT
SMTP_USER
SUPABASE_ANON_KEY
SUPABASE_DB_URL
SUPABASE_SERVICE_ROLE_KEY
SUPABASE_URL
```

## AISLAMIENTO (git worktree)

Se crea worktree limpio para evitar mezclar cambios ajenos del working tree original.

Worktree: `/home/eevan/ProyectosIA/aidrive_genspark__review_fase1_fase2_20260208`

### pwd

```bash
pwd 
```

```
/home/eevan/ProyectosIA/aidrive_genspark__review_fase1_fase2_20260208
```

### git status --porcelain=v1

```bash
git status --porcelain=v1 
```

```
?? docs/closure/REVIEW_LOG_FASE1_FASE2_2026-02-08.md
```

### git rev-parse --abbrev-ref HEAD

```bash
git rev-parse --abbrev-ref HEAD 
```

```
review/fase1-fase2-20260208
```

### git rev-parse HEAD

```bash
git rev-parse HEAD 
```

```
f909478d0ddb77f23ef752a3eb0d2eb6d31aa0b7
```

## WORKTREE STATUS (review branch)

```bash
git status --porcelain=v1 
```

```
 M supabase/functions/_shared/circuit-breaker.ts
 M supabase/functions/api-minimarket/index.ts
 M supabase/functions/api-proveedor/index.ts
?? docs/closure/REVIEW_LOG_FASE1_FASE2_2026-02-08.md
```

## WORKTREE DIFF STAT

```bash
git diff --stat 
```

```
 supabase/functions/_shared/circuit-breaker.ts |  56 ++++++++++
 supabase/functions/api-minimarket/index.ts    | 151 +++++++++++++++++---------
 supabase/functions/api-proveedor/index.ts     |  17 ++-
 3 files changed, 167 insertions(+), 57 deletions(-)
```

## WORKTREE DIFF (FASE1-2 fixes)

```bash
bash -lc git\ diff\ --\ supabase/functions/api-minimarket/index.ts\ supabase/functions/_shared/circuit-breaker.ts\ supabase/functions/api-proveedor/index.ts 
```

```
diff --git a/supabase/functions/_shared/circuit-breaker.ts b/supabase/functions/_shared/circuit-breaker.ts
index 7bb0edb..72edd4f 100644
--- a/supabase/functions/_shared/circuit-breaker.ts
+++ b/supabase/functions/_shared/circuit-breaker.ts
@@ -180,6 +180,62 @@ export async function recordCircuitBreakerEvent(
   }
 }
 
+/**
+ * Check circuit breaker state using shared RPC (cross-instance).
+ * Falls back to the in-memory breaker if RPC is not available.
+ */
+export async function checkCircuitBreakerShared(
+  key: string,
+  serviceRoleKey: string,
+  supabaseUrl: string,
+  fallbackBreaker: CircuitBreaker,
+  options: Partial<CircuitBreakerOptions> = {},
+): Promise<{ state: CircuitState; allows: boolean }> {
+  if (cbRpcAvailable === false) {
+    return { state: fallbackBreaker.getState(), allows: fallbackBreaker.allowRequest() };
+  }
+
+  try {
+    const opts = { ...DEFAULT_OPTIONS, ...options };
+    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/sp_circuit_breaker_check`, {
+      method: 'POST',
+      headers: {
+        'Content-Type': 'application/json',
+        apikey: serviceRoleKey,
+        Authorization: `Bearer ${serviceRoleKey}`,
+      },
+      body: JSON.stringify({
+        p_key: key,
+        p_open_timeout_seconds: Math.ceil(opts.openTimeoutMs / 1000),
+      }),
+    });
+
+    if (response.status === 404) {
+      cbRpcAvailable = false;
+      return { state: fallbackBreaker.getState(), allows: fallbackBreaker.allowRequest() };
+    }
+
+    if (!response.ok) {
+      return { state: fallbackBreaker.getState(), allows: fallbackBreaker.allowRequest() };
+    }
+
+    cbRpcAvailable = true;
+    const rows = await response.json();
+    const row = Array.isArray(rows) ? rows[0] : rows;
+
+    if (!row) {
+      return { state: fallbackBreaker.getState(), allows: fallbackBreaker.allowRequest() };
+    }
+
+    return {
+      state: row.current_state as CircuitState,
+      allows: row.allows_request,
+    };
+  } catch {
+    return { state: fallbackBreaker.getState(), allows: fallbackBreaker.allowRequest() };
+  }
+}
+
 // Exported for testing
 export function _resetCbRpcAvailability(): void {
   cbRpcAvailable = undefined;
diff --git a/supabase/functions/api-minimarket/index.ts b/supabase/functions/api-minimarket/index.ts
index 77cbf29..b6f37fd 100644
--- a/supabase/functions/api-minimarket/index.ts
+++ b/supabase/functions/api-minimarket/index.ts
@@ -21,7 +21,7 @@ import {
   isAppError,
 } from '../_shared/errors.ts';
 import { FixedWindowRateLimiter, withRateLimitHeaders, buildRateLimitKey, checkRateLimitShared } from '../_shared/rate-limit.ts';
-import { getCircuitBreaker } from '../_shared/circuit-breaker.ts';
+import { getCircuitBreaker, checkCircuitBreakerShared, recordCircuitBreakerEvent } from '../_shared/circuit-breaker.ts';
 import { auditLog, extractAuditContext } from '../_shared/audit.ts';
 
 // Import modular helpers
@@ -111,11 +111,13 @@ const FUNCTION_BASE_PATH = '/api-minimarket';
 const rateLimiter = new FixedWindowRateLimiter(60, 60_000);
 
 // Circuit breaker for external service calls
-const circuitBreaker = getCircuitBreaker('api-minimarket-db', {
+const CIRCUIT_BREAKER_KEY = 'api-minimarket-db';
+const CIRCUIT_BREAKER_OPTIONS = {
   failureThreshold: 5,
   successThreshold: 2,
   openTimeoutMs: 30_000,
-});
+} as const;
+const circuitBreaker = getCircuitBreaker(CIRCUIT_BREAKER_KEY, CIRCUIT_BREAKER_OPTIONS);
 
 // ============================================================================
 // HELPER FUNCTIONS
@@ -201,41 +203,6 @@ Deno.serve(async (req) => {
     return preflightResponse;
   }
 
-  // ========================================================================
-  // RATE LIMITING (shared cross-instance via RPC, fallback in-memory)
-  // Key: user:{uid}:ip:{ip} > user:{uid} > ip:{ip}
-  // ========================================================================
-  // Rate limit key is built AFTER auth, so we need to defer it.
-  // For now use IP-only key; after auth, we'll refine if user is known.
-  const preAuthRateLimitKey = buildRateLimitKey(null, clientIp);
-  const { result: rateLimitResult, headers: rateLimitHeaders } = rateLimiter.checkWithHeaders(preAuthRateLimitKey);
-  responseHeaders = withRateLimitHeaders(responseHeaders, rateLimitResult, rateLimiter.getLimit());
-
-  if (!rateLimitResult.allowed) {
-    logger.warn('RATE_LIMIT_EXCEEDED', { requestId, clientIp });
-    return fail(
-      'RATE_LIMIT_EXCEEDED',
-      'Too many requests. Please try again later.',
-      429,
-      responseHeaders,
-      { requestId },
-    );
-  }
-
-  // ========================================================================
-  // CIRCUIT BREAKER CHECK
-  // ========================================================================
-  if (!circuitBreaker.allowRequest()) {
-    logger.warn('CIRCUIT_BREAKER_OPEN', { requestId, state: circuitBreaker.getState() });
-    return fail(
-      'SERVICE_UNAVAILABLE',
-      'Service temporarily unavailable. Please try again later.',
-      503,
-      responseHeaders,
-      { requestId },
-    );
-  }
-
   const url = new URL(req.url);
   const path = normalizePathname(url.pathname);
   const method = req.method;
@@ -247,12 +214,18 @@ Deno.serve(async (req) => {
     timestamp: new Date().toISOString(),
   };
 
+  // Keep these in the outer scope so catch{} can make breaker decisions safely.
+  let supabaseUrl: string | undefined;
+  let supabaseAnonKey: string | undefined;
+  let serviceRoleKey: string | undefined;
+
   try {
     // ======================================================================
     // CONFIGURATION CHECK
     // ======================================================================
-    const supabaseUrl = Deno.env.get('SUPABASE_URL');
-    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
+    supabaseUrl = Deno.env.get('SUPABASE_URL') || undefined;
+    supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || undefined;
+    serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || undefined;
 
     if (!supabaseUrl || !supabaseAnonKey) {
       throw toAppError(
@@ -262,6 +235,30 @@ Deno.serve(async (req) => {
       );
     }
 
+    // ======================================================================
+    // CIRCUIT BREAKER CHECK (semi-persistent via RPC, fallback in-memory)
+    // ======================================================================
+    const breakerStatus = serviceRoleKey
+      ? await checkCircuitBreakerShared(
+        CIRCUIT_BREAKER_KEY,
+        serviceRoleKey,
+        supabaseUrl,
+        circuitBreaker,
+        CIRCUIT_BREAKER_OPTIONS,
+      )
+      : { state: circuitBreaker.getState(), allows: circuitBreaker.allowRequest() };
+
+    if (!breakerStatus.allows) {
+      logger.warn('CIRCUIT_BREAKER_OPEN', { requestId, state: breakerStatus.state });
+      return fail(
+        'SERVICE_UNAVAILABLE',
+        'Service temporarily unavailable. Please try again later.',
+        503,
+        responseHeaders,
+        { requestId },
+      );
+    }
+
     // ======================================================================
     // AUTHENTICATION - Using user JWT, NOT service role
     // ======================================================================
@@ -279,6 +276,29 @@ Deno.serve(async (req) => {
       }
     }
 
+    // ======================================================================
+    // RATE LIMITING (shared cross-instance via RPC, fallback in-memory)
+    // Key: user:{uid}:ip:{ip} > user:{uid} > ip:{ip}
+    // ======================================================================
+    const rateLimitKey = buildRateLimitKey(user?.id, clientIp);
+    const limit = rateLimiter.getLimit();
+    const rateLimitResult = serviceRoleKey
+      ? await checkRateLimitShared(rateLimitKey, limit, 60, serviceRoleKey, supabaseUrl, rateLimiter)
+      : rateLimiter.check(rateLimitKey);
+
+    responseHeaders = withRateLimitHeaders(responseHeaders, rateLimitResult, limit);
+
+    if (!rateLimitResult.allowed) {
+      logger.warn('RATE_LIMIT_EXCEEDED', { requestId, clientIp, key: rateLimitKey });
+      return fail(
+        'RATE_LIMIT_EXCEEDED',
+        'Too many requests. Please try again later.',
+        429,
+        responseHeaders,
+        { requestId },
+      );
+    }
+
     // Helper: Check role (throws if unauthorized)
     const checkRole = (allowedRoles: readonly string[]) => {
       requireRole(user, allowedRoles);
@@ -298,6 +318,18 @@ Deno.serve(async (req) => {
       options: { message?: string; extra?: Record<string, unknown> } = {},
     ) => {
       circuitBreaker.recordSuccess();
+      if (serviceRoleKey) {
+        void recordCircuitBreakerEvent(
+          CIRCUIT_BREAKER_KEY,
+          'success',
+          serviceRoleKey,
+          supabaseUrl,
+          circuitBreaker,
+          CIRCUIT_BREAKER_OPTIONS,
+        ).catch(() => {
+          // Best-effort: don't break the request if the shared RPC is unavailable.
+        });
+      }
       return ok(data, status, responseHeaders, { requestId, ...options });
     };
 
@@ -334,7 +366,6 @@ Deno.serve(async (req) => {
 
     // Helper: Create Supabase client for audit logging (uses service role)
     const createAuditClient = async () => {
-      const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
       if (!serviceRoleKey) {
         logger.warn('AUDIT: No service role key available for audit logging');
         return null;
@@ -2032,18 +2063,32 @@ Deno.serve(async (req) => {
     // RUTA NO ENCONTRADA
     // ====================================================================
 
-    return respondFail('NOT_FOUND', `Ruta no encontrada: ${method} ${path}`, 404);
-  } catch (error) {
-    // Record failure for circuit breaker
-    circuitBreaker.recordFailure();
-
-    const appError = isAppError(error)
-      ? error
-      : toAppError(error, 'API_ERROR', getErrorStatus(error));
-
-    logger.error('API_MINIMARKET_ERROR', {
-      ...requestLog,
-      code: appError.code,
+	    return respondFail('NOT_FOUND', `Ruta no encontrada: ${method} ${path}`, 404);
+	  } catch (error) {
+	    const appError = isAppError(error)
+	      ? error
+	      : toAppError(error, 'API_ERROR', getErrorStatus(error));
+
+	    // Circuit breaker should not open on normal 4xx (bad request / not found / auth).
+	    // Only count real failures (network/5xx).
+	    if (appError.status >= 500) {
+	      if (serviceRoleKey && supabaseUrl) {
+	        await recordCircuitBreakerEvent(
+	          CIRCUIT_BREAKER_KEY,
+	          'failure',
+	          serviceRoleKey,
+	          supabaseUrl,
+	          circuitBreaker,
+	          CIRCUIT_BREAKER_OPTIONS,
+	        );
+	      } else {
+	        circuitBreaker.recordFailure();
+	      }
+	    }
+	
+	    logger.error('API_MINIMARKET_ERROR', {
+	      ...requestLog,
+	      code: appError.code,
       message: appError.message,
       status: appError.status,
     });
diff --git a/supabase/functions/api-proveedor/index.ts b/supabase/functions/api-proveedor/index.ts
index 034c569..9eeb6bd 100644
--- a/supabase/functions/api-proveedor/index.ts
+++ b/supabase/functions/api-proveedor/index.ts
@@ -247,10 +247,19 @@ Deno.serve(async (request: Request): Promise<Response> => {
     const corsResult = validateOrigin(request, allowedOrigins, corsOverrides);
     const corsHeaders = { ...corsResult.headers, 'x-request-id': requestId };
 
-    // Requiere encabezado Origin para evitar fallback permisivo
-    if (!corsResult.origin) {
-        logger.warn('CORS_MISSING_ORIGIN', { path: url.pathname, requestId });
-        return createCorsErrorResponse(requestId, corsHeaders);
+    // For browser requests, Origin header is required.
+    // Allow requests without Origin for server-to-server calls (A5).
+    const origin = request.headers.get('origin');
+    const requireOrigin = Deno.env.get('REQUIRE_ORIGIN') !== 'false';
+
+    if (requireOrigin && origin === null) {
+        const userAgent = request.headers.get('user-agent') || '';
+        const isBrowserLike = /mozilla|chrome|safari|firefox|edge|opera/i.test(userAgent);
+
+        if (isBrowserLike) {
+            logger.warn('CORS_MISSING_ORIGIN', { path: url.pathname, requestId, userAgent });
+            return createCorsErrorResponse(requestId, corsHeaders);
+        }
     }
 
     if (!corsResult.allowed) {
```

## npm ci (install deps for tests)

```bash
npm ci 
```

```

added 318 packages, and audited 319 packages in 15s

68 packages are looking for funding
  run `npm fund` for details

1 high severity vulnerability

To address all issues, run:
  npm audit fix

Run `npm audit` for details.
```

## TEST (A3) auth resilient

```bash
npm run test:unit -- tests/unit/auth-resilient.test.ts 
```

```

> workspace@1.0.0 test:unit
> vitest run tests/unit tests/unit/auth-resilient.test.ts


 RUN  v4.0.16 /home/eevan/ProyectosIA/aidrive_genspark__review_fase1_fase2_20260208

 ✓ tests/unit/strategic-high-value.test.ts (27 tests) 127ms
stderr | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeDailyPriceUpdate > debería retornar error si contexto es inválido
{"ts":"2026-02-08T06:24:35.317Z","level":"error","scope":"cron-jobs-maxiconsumo:job:daily-price-update","message":"VALIDATION_FAILED","field":"ctx.jobId","reason":"must be a non-empty string"}

stderr | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeDailyPriceUpdate > debería retornar error si supabaseUrl está vacío
{"ts":"2026-02-08T06:24:35.321Z","level":"error","scope":"cron-jobs-maxiconsumo:job:daily-price-update","message":"VALIDATION_FAILED","field":"supabaseUrl","reason":"must be a valid URL"}

stderr | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeDailyPriceUpdate > debería retornar error si serviceRoleKey está vacío
{"ts":"2026-02-08T06:24:35.323Z","level":"error","scope":"cron-jobs-maxiconsumo:job:daily-price-update","message":"VALIDATION_FAILED","field":"serviceRoleKey","reason":"must be a non-empty string"}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeDailyPriceUpdate > debería procesar correctamente cuando scraper responde OK
{"ts":"2026-02-08T06:24:35.325Z","level":"info","scope":"cron-jobs-maxiconsumo:job:daily-price-update","message":"JOB_START","requestId":"req-789","jobId":"test_job","runId":"run-456"}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeDailyPriceUpdate > debería procesar correctamente cuando scraper responde OK
{"ts":"2026-02-08T06:24:35.327Z","level":"info","scope":"cron-jobs-maxiconsumo:job:daily-price-update","message":"SCRAPING_COMPLETE","requestId":"req-789","jobId":"test_job","runId":"run-456","processed":50,"successful":45}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeDailyPriceUpdate > debería procesar correctamente cuando scraper responde OK
{"ts":"2026-02-08T06:24:35.328Z","level":"info","scope":"cron-jobs-maxiconsumo:job:daily-price-update","message":"JOB_COMPLETE","requestId":"req-789","jobId":"test_job","runId":"run-456","processed":50,"alerts":5,"duration":3}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeDailyPriceUpdate > debería manejar error del scraper
{"ts":"2026-02-08T06:24:35.329Z","level":"info","scope":"cron-jobs-maxiconsumo:job:daily-price-update","message":"JOB_START","requestId":"req-789","jobId":"test_job","runId":"run-456"}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeDailyPriceUpdate > debería manejar error del scraper
{"ts":"2026-02-08T06:24:35.330Z","level":"info","scope":"cron-jobs-maxiconsumo:job:daily-price-update","message":"JOB_COMPLETE","requestId":"req-789","jobId":"test_job","runId":"run-456","processed":0,"alerts":0,"duration":0}

stdout | tests/unit/scraper-storage-auth.test.ts > storage key separation runtime > usa readKey para lecturas y writeKey para inserciones/actualizaciones
{"ts":"2026-02-08T06:24:35.333Z","level":"info","scope":"scraper-maxiconsumo:storage","message":"BATCH_INSERT_SUCCESS","requestId":"rw-1","count":1}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeDailyPriceUpdate > debería manejar excepción durante ejecución
{"ts":"2026-02-08T06:24:35.333Z","level":"info","scope":"cron-jobs-maxiconsumo:job:daily-price-update","message":"JOB_START","requestId":"req-789","jobId":"test_job","runId":"run-456"}

stderr | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeDailyPriceUpdate > debería manejar excepción durante ejecución
{"ts":"2026-02-08T06:24:35.335Z","level":"error","scope":"cron-jobs-maxiconsumo:job:daily-price-update","message":"JOB_ERROR","requestId":"req-789","jobId":"test_job","runId":"run-456","error":"Network failure"}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeDailyPriceUpdate > debería calcular executionTimeMs correctamente
{"ts":"2026-02-08T06:24:35.336Z","level":"info","scope":"cron-jobs-maxiconsumo:job:daily-price-update","message":"JOB_START","requestId":"req-789","jobId":"test_job","runId":"run-456"}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeDailyPriceUpdate > debería calcular executionTimeMs correctamente
{"ts":"2026-02-08T06:24:35.337Z","level":"info","scope":"cron-jobs-maxiconsumo:job:daily-price-update","message":"SCRAPING_COMPLETE","requestId":"req-789","jobId":"test_job","runId":"run-456","processed":10,"successful":10}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeDailyPriceUpdate > debería calcular executionTimeMs correctamente
{"ts":"2026-02-08T06:24:35.338Z","level":"info","scope":"cron-jobs-maxiconsumo:job:daily-price-update","message":"JOB_COMPLETE","requestId":"req-789","jobId":"test_job","runId":"run-456","processed":10,"alerts":0,"duration":2}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeDailyPriceUpdate > debería llamar al endpoint correcto del scraper
{"ts":"2026-02-08T06:24:35.339Z","level":"info","scope":"cron-jobs-maxiconsumo:job:daily-price-update","message":"JOB_START","requestId":"req-789","jobId":"test_job","runId":"run-456"}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeDailyPriceUpdate > debería llamar al endpoint correcto del scraper
{"ts":"2026-02-08T06:24:35.339Z","level":"info","scope":"cron-jobs-maxiconsumo:job:daily-price-update","message":"SCRAPING_COMPLETE","requestId":"req-789","jobId":"test_job","runId":"run-456","processed":0,"successful":0}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeDailyPriceUpdate > debería llamar al endpoint correcto del scraper
{"ts":"2026-02-08T06:24:35.339Z","level":"info","scope":"cron-jobs-maxiconsumo:job:daily-price-update","message":"JOB_COMPLETE","requestId":"req-789","jobId":"test_job","runId":"run-456","processed":0,"alerts":0,"duration":0}

stderr | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeMaintenanceCleanup > debería retornar error si contexto es inválido
{"ts":"2026-02-08T06:24:35.342Z","level":"error","scope":"cron-jobs-maxiconsumo:job:maintenance","message":"VALIDATION_FAILED","field":"ctx.jobId","reason":"must be a non-empty string"}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeMaintenanceCleanup > debería limpiar registros antiguos correctamente
{"ts":"2026-02-08T06:24:35.343Z","level":"info","scope":"cron-jobs-maxiconsumo:job:maintenance","message":"JOB_START","requestId":"req-789","jobId":"test_job","runId":"run-456"}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeMaintenanceCleanup > debería limpiar registros antiguos correctamente
{"ts":"2026-02-08T06:24:35.343Z","level":"info","scope":"cron-jobs-maxiconsumo:job:maintenance","message":"LOGS_CLEANED","requestId":"req-789","jobId":"test_job","runId":"run-456","count":2}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeMaintenanceCleanup > debería limpiar registros antiguos correctamente
{"ts":"2026-02-08T06:24:35.343Z","level":"info","scope":"cron-jobs-maxiconsumo:job:maintenance","message":"JOB_COMPLETE","requestId":"req-789","jobId":"test_job","runId":"run-456","metrics":{"logs_deleted":2,"metrics_deleted":1,"alerts_deleted":0},"duration":0}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeMaintenanceCleanup > debería usar parámetros de retención personalizados
{"ts":"2026-02-08T06:24:35.343Z","level":"info","scope":"cron-jobs-maxiconsumo:job:maintenance","message":"JOB_START","requestId":"req-789","jobId":"test_job","runId":"run-456"}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeMaintenanceCleanup > debería usar parámetros de retención personalizados
{"ts":"2026-02-08T06:24:35.344Z","level":"info","scope":"cron-jobs-maxiconsumo:job:maintenance","message":"LOGS_CLEANED","requestId":"req-789","jobId":"test_job","runId":"run-456","count":0}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeMaintenanceCleanup > debería usar parámetros de retención personalizados
{"ts":"2026-02-08T06:24:35.344Z","level":"info","scope":"cron-jobs-maxiconsumo:job:maintenance","message":"JOB_COMPLETE","requestId":"req-789","jobId":"test_job","runId":"run-456","metrics":{"logs_deleted":0,"metrics_deleted":0,"alerts_deleted":0},"duration":0}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeMaintenanceCleanup > debería recomendar reducir retención si limpia muchos registros
{"ts":"2026-02-08T06:24:35.345Z","level":"info","scope":"cron-jobs-maxiconsumo:job:maintenance","message":"JOB_START","requestId":"req-789","jobId":"test_job","runId":"run-456"}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeMaintenanceCleanup > debería recomendar reducir retención si limpia muchos registros
{"ts":"2026-02-08T06:24:35.345Z","level":"info","scope":"cron-jobs-maxiconsumo:job:maintenance","message":"LOGS_CLEANED","requestId":"req-789","jobId":"test_job","runId":"run-456","count":500}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeMaintenanceCleanup > debería recomendar reducir retención si limpia muchos registros
{"ts":"2026-02-08T06:24:35.346Z","level":"info","scope":"cron-jobs-maxiconsumo:job:maintenance","message":"JOB_COMPLETE","requestId":"req-789","jobId":"test_job","runId":"run-456","metrics":{"logs_deleted":500,"metrics_deleted":400,"alerts_deleted":200},"duration":1}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeMaintenanceCleanup > debería manejar excepción durante ejecución
{"ts":"2026-02-08T06:24:35.347Z","level":"info","scope":"cron-jobs-maxiconsumo:job:maintenance","message":"JOB_START","requestId":"req-789","jobId":"test_job","runId":"run-456"}

stderr | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeMaintenanceCleanup > debería manejar excepción durante ejecución
{"ts":"2026-02-08T06:24:35.348Z","level":"error","scope":"cron-jobs-maxiconsumo:job:maintenance","message":"JOB_ERROR","requestId":"req-789","jobId":"test_job","runId":"run-456","error":"Database error"}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeMaintenanceCleanup > debería usar headers correctos para DELETE
{"ts":"2026-02-08T06:24:35.350Z","level":"info","scope":"cron-jobs-maxiconsumo:job:maintenance","message":"JOB_START","requestId":"req-789","jobId":"test_job","runId":"run-456"}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeMaintenanceCleanup > debería usar headers correctos para DELETE
{"ts":"2026-02-08T06:24:35.350Z","level":"info","scope":"cron-jobs-maxiconsumo:job:maintenance","message":"LOGS_CLEANED","requestId":"req-789","jobId":"test_job","runId":"run-456","count":0}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeMaintenanceCleanup > debería usar headers correctos para DELETE
{"ts":"2026-02-08T06:24:35.350Z","level":"info","scope":"cron-jobs-maxiconsumo:job:maintenance","message":"JOB_COMPLETE","requestId":"req-789","jobId":"test_job","runId":"run-456","metrics":{"logs_deleted":0,"metrics_deleted":0,"alerts_deleted":0},"duration":0}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeMaintenanceCleanup > debería calcular productsProcessed como total limpiado
{"ts":"2026-02-08T06:24:35.351Z","level":"info","scope":"cron-jobs-maxiconsumo:job:maintenance","message":"JOB_START","requestId":"req-789","jobId":"test_job","runId":"run-456"}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeMaintenanceCleanup > debería calcular productsProcessed como total limpiado
{"ts":"2026-02-08T06:24:35.351Z","level":"info","scope":"cron-jobs-maxiconsumo:job:maintenance","message":"LOGS_CLEANED","requestId":"req-789","jobId":"test_job","runId":"run-456","count":3}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeMaintenanceCleanup > debería calcular productsProcessed como total limpiado
{"ts":"2026-02-08T06:24:35.351Z","level":"info","scope":"cron-jobs-maxiconsumo:job:maintenance","message":"JOB_COMPLETE","requestId":"req-789","jobId":"test_job","runId":"run-456","metrics":{"logs_deleted":3,"metrics_deleted":2,"alerts_deleted":1},"duration":0}

stderr | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeRealtimeAlerts > debería retornar error si contexto es inválido
{"ts":"2026-02-08T06:24:35.352Z","level":"error","scope":"cron-jobs-maxiconsumo:job:realtime-alerts","message":"VALIDATION_FAILED","field":"ctx.jobId","reason":"must be a non-empty string"}

stderr | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeRealtimeAlerts > debería retornar error si supabaseUrl está vacío
{"ts":"2026-02-08T06:24:35.353Z","level":"error","scope":"cron-jobs-maxiconsumo:job:realtime-alerts","message":"VALIDATION_FAILED","field":"supabaseUrl","reason":"must be a valid URL"}

stderr | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeRealtimeAlerts > debería retornar error si serviceRoleKey está vacío
{"ts":"2026-02-08T06:24:35.353Z","level":"error","scope":"cron-jobs-maxiconsumo:job:realtime-alerts","message":"VALIDATION_FAILED","field":"serviceRoleKey","reason":"must be a non-empty string"}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeRealtimeAlerts > debería procesar alertas críticas correctamente
{"ts":"2026-02-08T06:24:35.353Z","level":"info","scope":"cron-jobs-maxiconsumo:job:realtime-alerts","message":"JOB_START","requestId":"req-789","jobId":"test_job","runId":"run-456"}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeRealtimeAlerts > debería procesar alertas críticas correctamente
{"ts":"2026-02-08T06:24:35.354Z","level":"info","scope":"cron-jobs-maxiconsumo:job:realtime-alerts","message":"CHANGES_DETECTED","requestId":"req-789","jobId":"test_job","runId":"run-456","total":2,"critical":2}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeRealtimeAlerts > debería procesar alertas críticas correctamente
{"ts":"2026-02-08T06:24:35.354Z","level":"info","scope":"cron-jobs-maxiconsumo:job:realtime-alerts","message":"JOB_COMPLETE","requestId":"req-789","jobId":"test_job","runId":"run-456","alerts":2,"duration":1}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeRealtimeAlerts > debería no generar alertas si cambios están bajo threshold
{"ts":"2026-02-08T06:24:35.354Z","level":"info","scope":"cron-jobs-maxiconsumo:job:realtime-alerts","message":"JOB_START","requestId":"req-789","jobId":"test_job","runId":"run-456"}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeRealtimeAlerts > debería no generar alertas si cambios están bajo threshold
{"ts":"2026-02-08T06:24:35.354Z","level":"info","scope":"cron-jobs-maxiconsumo:job:realtime-alerts","message":"CHANGES_DETECTED","requestId":"req-789","jobId":"test_job","runId":"run-456","total":1,"critical":0}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeRealtimeAlerts > debería no generar alertas si cambios están bajo threshold
{"ts":"2026-02-08T06:24:35.354Z","level":"info","scope":"cron-jobs-maxiconsumo:job:realtime-alerts","message":"JOB_COMPLETE","requestId":"req-789","jobId":"test_job","runId":"run-456","alerts":0,"duration":0}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeRealtimeAlerts > debería usar threshold personalizado de parámetros
{"ts":"2026-02-08T06:24:35.355Z","level":"info","scope":"cron-jobs-maxiconsumo:job:realtime-alerts","message":"JOB_START","requestId":"req-789","jobId":"test_job","runId":"run-456"}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeRealtimeAlerts > debería usar threshold personalizado de parámetros
{"ts":"2026-02-08T06:24:35.355Z","level":"info","scope":"cron-jobs-maxiconsumo:job:realtime-alerts","message":"CHANGES_DETECTED","requestId":"req-789","jobId":"test_job","runId":"run-456","total":1,"critical":1}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeRealtimeAlerts > debería usar threshold personalizado de parámetros
{"ts":"2026-02-08T06:24:35.356Z","level":"info","scope":"cron-jobs-maxiconsumo:job:realtime-alerts","message":"JOB_COMPLETE","requestId":"req-789","jobId":"test_job","runId":"run-456","alerts":1,"duration":1}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeRealtimeAlerts > debería manejar excepción durante ejecución
{"ts":"2026-02-08T06:24:35.356Z","level":"info","scope":"cron-jobs-maxiconsumo:job:realtime-alerts","message":"JOB_START","requestId":"req-789","jobId":"test_job","runId":"run-456"}

stderr | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeRealtimeAlerts > debería manejar excepción durante ejecución
{"ts":"2026-02-08T06:24:35.356Z","level":"error","scope":"cron-jobs-maxiconsumo:job:realtime-alerts","message":"JOB_ERROR","requestId":"req-789","jobId":"test_job","runId":"run-456","error":"Database timeout"}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeRealtimeAlerts > debería calcular executionTimeMs correctamente
{"ts":"2026-02-08T06:24:35.356Z","level":"info","scope":"cron-jobs-maxiconsumo:job:realtime-alerts","message":"JOB_START","requestId":"req-789","jobId":"test_job","runId":"run-456"}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeRealtimeAlerts > debería calcular executionTimeMs correctamente
{"ts":"2026-02-08T06:24:35.356Z","level":"info","scope":"cron-jobs-maxiconsumo:job:realtime-alerts","message":"CHANGES_DETECTED","requestId":"req-789","jobId":"test_job","runId":"run-456","total":0,"critical":0}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeRealtimeAlerts > debería calcular executionTimeMs correctamente
{"ts":"2026-02-08T06:24:35.356Z","level":"info","scope":"cron-jobs-maxiconsumo:job:realtime-alerts","message":"JOB_COMPLETE","requestId":"req-789","jobId":"test_job","runId":"run-456","alerts":0,"duration":0}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeRealtimeAlerts > debería consultar precios de los últimos 15 minutos
{"ts":"2026-02-08T06:24:35.357Z","level":"info","scope":"cron-jobs-maxiconsumo:job:realtime-alerts","message":"JOB_START","requestId":"req-789","jobId":"test_job","runId":"run-456"}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeRealtimeAlerts > debería consultar precios de los últimos 15 minutos
{"ts":"2026-02-08T06:24:35.357Z","level":"info","scope":"cron-jobs-maxiconsumo:job:realtime-alerts","message":"CHANGES_DETECTED","requestId":"req-789","jobId":"test_job","runId":"run-456","total":0,"critical":0}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeRealtimeAlerts > debería consultar precios de los últimos 15 minutos
{"ts":"2026-02-08T06:24:35.357Z","level":"info","scope":"cron-jobs-maxiconsumo:job:realtime-alerts","message":"JOB_COMPLETE","requestId":"req-789","jobId":"test_job","runId":"run-456","alerts":0,"duration":0}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeRealtimeAlerts > debería crear alertas con severidad crítica
{"ts":"2026-02-08T06:24:35.357Z","level":"info","scope":"cron-jobs-maxiconsumo:job:realtime-alerts","message":"JOB_START","requestId":"req-789","jobId":"test_job","runId":"run-456"}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeRealtimeAlerts > debería crear alertas con severidad crítica
{"ts":"2026-02-08T06:24:35.357Z","level":"info","scope":"cron-jobs-maxiconsumo:job:realtime-alerts","message":"CHANGES_DETECTED","requestId":"req-789","jobId":"test_job","runId":"run-456","total":1,"critical":1}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeRealtimeAlerts > debería crear alertas con severidad crítica
{"ts":"2026-02-08T06:24:35.357Z","level":"info","scope":"cron-jobs-maxiconsumo:job:realtime-alerts","message":"JOB_COMPLETE","requestId":"req-789","jobId":"test_job","runId":"run-456","alerts":1,"duration":0}

stderr | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeWeeklyAnalysis > debería retornar error si contexto es inválido
{"ts":"2026-02-08T06:24:35.358Z","level":"error","scope":"cron-jobs-maxiconsumo:job:weekly-analysis","message":"VALIDATION_FAILED","field":"ctx.jobId","reason":"must be a non-empty string"}

stderr | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeWeeklyAnalysis > debería retornar error si supabaseUrl está vacío
{"ts":"2026-02-08T06:24:35.358Z","level":"error","scope":"cron-jobs-maxiconsumo:job:weekly-analysis","message":"VALIDATION_FAILED","field":"supabaseUrl","reason":"must be a valid URL"}

stderr | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeWeeklyAnalysis > debería retornar error si serviceRoleKey está vacío
{"ts":"2026-02-08T06:24:35.359Z","level":"error","scope":"cron-jobs-maxiconsumo:job:weekly-analysis","message":"VALIDATION_FAILED","field":"serviceRoleKey","reason":"must be a non-empty string"}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeWeeklyAnalysis > debería calcular trends correctamente con datos válidos
{"ts":"2026-02-08T06:24:35.359Z","level":"info","scope":"cron-jobs-maxiconsumo:job:weekly-analysis","message":"JOB_START","requestId":"req-789","jobId":"test_job","runId":"run-456"}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeWeeklyAnalysis > debería calcular trends correctamente con datos válidos
{"ts":"2026-02-08T06:24:35.359Z","level":"info","scope":"cron-jobs-maxiconsumo:job:weekly-analysis","message":"TRENDS_CALCULATED","requestId":"req-789","jobId":"test_job","runId":"run-456","trends":{"total_cambios":2,"promedio_cambio":"20.00","alertas_semana":2,"alertas_criticas":1}}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeWeeklyAnalysis > debería calcular trends correctamente con datos válidos
{"ts":"2026-02-08T06:24:35.359Z","level":"info","scope":"cron-jobs-maxiconsumo:job:weekly-analysis","message":"JOB_COMPLETE","requestId":"req-789","jobId":"test_job","runId":"run-456","trends":{"total_cambios":2,"promedio_cambio":"20.00","alertas_semana":2,"alertas_criticas":1},"duration":0}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeWeeklyAnalysis > debería manejar respuestas vacías correctamente
{"ts":"2026-02-08T06:24:35.359Z","level":"info","scope":"cron-jobs-maxiconsumo:job:weekly-analysis","message":"JOB_START","requestId":"req-789","jobId":"test_job","runId":"run-456"}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeWeeklyAnalysis > debería manejar respuestas vacías correctamente
{"ts":"2026-02-08T06:24:35.360Z","level":"info","scope":"cron-jobs-maxiconsumo:job:weekly-analysis","message":"TRENDS_CALCULATED","requestId":"req-789","jobId":"test_job","runId":"run-456","trends":{"total_cambios":0,"promedio_cambio":"0.00","alertas_semana":0,"alertas_criticas":0}}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeWeeklyAnalysis > debería manejar respuestas vacías correctamente
{"ts":"2026-02-08T06:24:35.360Z","level":"info","scope":"cron-jobs-maxiconsumo:job:weekly-analysis","message":"JOB_COMPLETE","requestId":"req-789","jobId":"test_job","runId":"run-456","trends":{"total_cambios":0,"promedio_cambio":"0.00","alertas_semana":0,"alertas_criticas":0},"duration":0}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeWeeklyAnalysis > debería generar recomendación si alertas críticas > 10
{"ts":"2026-02-08T06:24:35.361Z","level":"info","scope":"cron-jobs-maxiconsumo:job:weekly-analysis","message":"JOB_START","requestId":"req-789","jobId":"test_job","runId":"run-456"}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeWeeklyAnalysis > debería generar recomendación si alertas críticas > 10
{"ts":"2026-02-08T06:24:35.361Z","level":"info","scope":"cron-jobs-maxiconsumo:job:weekly-analysis","message":"TRENDS_CALCULATED","requestId":"req-789","jobId":"test_job","runId":"run-456","trends":{"total_cambios":0,"promedio_cambio":"0.00","alertas_semana":12,"alertas_criticas":12}}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeWeeklyAnalysis > debería generar recomendación si alertas críticas > 10
{"ts":"2026-02-08T06:24:35.361Z","level":"info","scope":"cron-jobs-maxiconsumo:job:weekly-analysis","message":"JOB_COMPLETE","requestId":"req-789","jobId":"test_job","runId":"run-456","trends":{"total_cambios":0,"promedio_cambio":"0.00","alertas_semana":12,"alertas_criticas":12},"duration":0}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeWeeklyAnalysis > debería generar recomendación si totalChanges > 100
{"ts":"2026-02-08T06:24:35.363Z","level":"info","scope":"cron-jobs-maxiconsumo:job:weekly-analysis","message":"JOB_START","requestId":"req-789","jobId":"test_job","runId":"run-456"}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeWeeklyAnalysis > debería generar recomendación si totalChanges > 100
{"ts":"2026-02-08T06:24:35.364Z","level":"info","scope":"cron-jobs-maxiconsumo:job:weekly-analysis","message":"TRENDS_CALCULATED","requestId":"req-789","jobId":"test_job","runId":"run-456","trends":{"total_cambios":105,"promedio_cambio":"10.00","alertas_semana":0,"alertas_criticas":0}}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeWeeklyAnalysis > debería generar recomendación si totalChanges > 100
{"ts":"2026-02-08T06:24:35.364Z","level":"info","scope":"cron-jobs-maxiconsumo:job:weekly-analysis","message":"JOB_COMPLETE","requestId":"req-789","jobId":"test_job","runId":"run-456","trends":{"total_cambios":105,"promedio_cambio":"10.00","alertas_semana":0,"alertas_criticas":0},"duration":1}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeWeeklyAnalysis > debería guardar métricas en cron_jobs_metrics
{"ts":"2026-02-08T06:24:35.365Z","level":"info","scope":"cron-jobs-maxiconsumo:job:weekly-analysis","message":"JOB_START","requestId":"req-789","jobId":"test_job","runId":"run-456"}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeWeeklyAnalysis > debería guardar métricas en cron_jobs_metrics
{"ts":"2026-02-08T06:24:35.365Z","level":"info","scope":"cron-jobs-maxiconsumo:job:weekly-analysis","message":"TRENDS_CALCULATED","requestId":"req-789","jobId":"test_job","runId":"run-456","trends":{"total_cambios":1,"promedio_cambio":"10.00","alertas_semana":0,"alertas_criticas":0}}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeWeeklyAnalysis > debería guardar métricas en cron_jobs_metrics
{"ts":"2026-02-08T06:24:35.366Z","level":"info","scope":"cron-jobs-maxiconsumo:job:weekly-analysis","message":"JOB_COMPLETE","requestId":"req-789","jobId":"test_job","runId":"run-456","trends":{"total_cambios":1,"promedio_cambio":"10.00","alertas_semana":0,"alertas_criticas":0},"duration":0}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeWeeklyAnalysis > debería manejar excepción durante ejecución
{"ts":"2026-02-08T06:24:35.366Z","level":"info","scope":"cron-jobs-maxiconsumo:job:weekly-analysis","message":"JOB_START","requestId":"req-789","jobId":"test_job","runId":"run-456"}

stderr | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeWeeklyAnalysis > debería manejar excepción durante ejecución
{"ts":"2026-02-08T06:24:35.366Z","level":"error","scope":"cron-jobs-maxiconsumo:job:weekly-analysis","message":"JOB_ERROR","requestId":"req-789","jobId":"test_job","runId":"run-456","error":"Connection refused"}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeWeeklyAnalysis > debería calcular productsProcessed como totalChanges
{"ts":"2026-02-08T06:24:35.367Z","level":"info","scope":"cron-jobs-maxiconsumo:job:weekly-analysis","message":"JOB_START","requestId":"req-789","jobId":"test_job","runId":"run-456"}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeWeeklyAnalysis > debería calcular productsProcessed como totalChanges
{"ts":"2026-02-08T06:24:35.367Z","level":"info","scope":"cron-jobs-maxiconsumo:job:weekly-analysis","message":"TRENDS_CALCULATED","requestId":"req-789","jobId":"test_job","runId":"run-456","trends":{"total_cambios":3,"promedio_cambio":"10.00","alertas_semana":0,"alertas_criticas":0}}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeWeeklyAnalysis > debería calcular productsProcessed como totalChanges
{"ts":"2026-02-08T06:24:35.367Z","level":"info","scope":"cron-jobs-maxiconsumo:job:weekly-analysis","message":"JOB_COMPLETE","requestId":"req-789","jobId":"test_job","runId":"run-456","trends":{"total_cambios":3,"promedio_cambio":"10.00","alertas_semana":0,"alertas_criticas":0},"duration":0}

 ✓ tests/unit/cron-jobs-handlers.test.ts (35 tests) 54ms
stdout | tests/unit/scraper-storage-auth.test.ts > storage key separation runtime > usa readKey para lecturas y writeKey para inserciones/actualizaciones
{"ts":"2026-02-08T06:24:35.452Z","level":"info","scope":"scraper-maxiconsumo:storage","message":"BATCH_UPDATE_COMPLETE","requestId":"rw-1","count":1}

stdout | tests/unit/scraper-storage-auth.test.ts > storage key separation runtime > usa writeKey también para lecturas cuando readKey=service (modo service)
{"ts":"2026-02-08T06:24:35.455Z","level":"info","scope":"scraper-maxiconsumo:storage","message":"BATCH_INSERT_SUCCESS","requestId":"rw-2","count":1}

 ✓ tests/unit/scraper-storage-auth.test.ts (32 tests) 155ms
stdout | tests/unit/shared-audit.test.ts > auditLog > should work in dry-run mode without supabase client
{"ts":"2026-02-08T06:24:37.469Z","level":"info","scope":"audit","message":"[AUDIT] precio_actualizado","usuario_id":"user-123","entidad_tipo":"productos","entidad_id":"prod-456","detalles":{"precio_anterior":100,"precio_nuevo":150},"nivel":"info"}

stderr | tests/unit/shared-audit.test.ts > auditLog > should work in dry-run mode without supabase client
{"ts":"2026-02-08T06:24:37.470Z","level":"warn","scope":"audit","message":"Audit log: dry-run mode, no database insert"}

stdout | tests/unit/shared-audit.test.ts > auditLog > should insert audit log with supabase client
{"ts":"2026-02-08T06:24:37.473Z","level":"info","scope":"audit","message":"[AUDIT] stock_ajustado","usuario_id":"user-456","entidad_tipo":"stock_deposito","entidad_id":"stock-789","nivel":"warning"}

stdout | tests/unit/shared-audit.test.ts > auditLog > should return error when database insert fails
{"ts":"2026-02-08T06:24:37.476Z","level":"info","scope":"audit","message":"[AUDIT] producto_eliminado","nivel":"info"}

stderr | tests/unit/shared-audit.test.ts > auditLog > should return error when database insert fails
{"ts":"2026-02-08T06:24:37.480Z","level":"error","scope":"audit","message":"Error inserting audit log","error":{"message":"Database error"}}

stdout | tests/unit/shared-audit.test.ts > auditLog > should handle exceptions gracefully
{"ts":"2026-02-08T06:24:37.481Z","level":"info","scope":"audit","message":"[AUDIT] login_fallido","nivel":"info"}

stderr | tests/unit/shared-audit.test.ts > auditLog > should handle exceptions gracefully
{"ts":"2026-02-08T06:24:37.481Z","level":"error","scope":"audit","message":"Exception in auditLog","error":"Connection failed"}

stdout | tests/unit/shared-audit.test.ts > auditLog > should use default nivel when not specified
{"ts":"2026-02-08T06:24:37.482Z","level":"info","scope":"audit","message":"[AUDIT] producto_creado","nivel":"info"}

stderr | tests/unit/shared-audit.test.ts > queryAuditLogs > should return error when query fails
{"ts":"2026-02-08T06:24:37.487Z","level":"error","scope":"audit","message":"Error querying audit logs","error":{"message":"Query failed"}}

stderr | tests/unit/shared-audit.test.ts > queryAuditLogs > should handle exceptions gracefully
{"ts":"2026-02-08T06:24:37.487Z","level":"error","scope":"audit","message":"Exception in queryAuditLogs","error":"Connection timeout"}

 ✓ tests/unit/shared-audit.test.ts (21 tests) 36ms
 ✓ tests/unit/pedidos-handlers.test.ts (29 tests) 16ms
 ✓ tests/unit/auth-resilient.test.ts (16 tests) 62ms
 ✓ tests/unit/scraper-anti-detection.test.ts (35 tests) 23ms
 ✓ tests/unit/scraper-cookie-jar.test.ts (20 tests) 37ms
stdout | tests/unit/scraper-matching.test.ts > scraper-maxiconsumo/matching > performAdvancedMatching > omite coincidencias con confianza <= 20
{"ts":"2026-02-08T06:24:38.011Z","level":"info","scope":"scraper-maxiconsumo:matching","message":"MATCHING_COMPLETE","total":0}

stdout | tests/unit/scraper-matching.test.ts > scraper-maxiconsumo/matching > performAdvancedMatching > hace match por nombre normalizado cuando no hay SKU ni barcode
{"ts":"2026-02-08T06:24:38.016Z","level":"info","scope":"scraper-maxiconsumo:matching","message":"MATCHING_COMPLETE","total":1}

 ✓ tests/unit/scraper-matching.test.ts (31 tests) 22ms
 ✓ tests/unit/shared-rate-limit.test.ts (22 tests) 21ms
 ✓ tests/unit/api-proveedor-read-mode.test.ts (34 tests) 29ms
 ✓ tests/unit/gateway-validation.test.ts (43 tests) 23ms
 ✓ tests/unit/scraper-config.test.ts (22 tests) 62ms
 ✓ tests/unit/scraper-parsing-edge-cases.test.ts (26 tests) 73ms
 ✓ tests/unit/shared-errors.test.ts (32 tests) 95ms
stderr | tests/unit/cron-jobs-execution-log.test.ts > execution-log > writeExecutionLog > debería manejar errores de fetch sin lanzar excepción
{"ts":"2026-02-08T06:24:44.493Z","level":"warn","scope":"cron-jobs-maxiconsumo:execution-log","message":"EXECUTION_LOG_INSERT_FAILED","requestId":"req-789","jobId":"daily_price_update","runId":"run-456","error":"Network error"}

stderr | tests/unit/cron-jobs-execution-log.test.ts > execution-log > writeExecutionLog > debería manejar respuestas no-ok sin lanzar excepción
{"ts":"2026-02-08T06:24:44.498Z","level":"warn","scope":"cron-jobs-maxiconsumo:execution-log","message":"EXECUTION_LOG_INSERT_FAILED","requestId":"req-789","jobId":"daily_price_update","runId":"run-456","status":500,"status_text":"Internal Server Error"}

 ✓ tests/unit/cron-jobs-execution-log.test.ts (17 tests) 45ms
 ✓ tests/unit/scraper-parsing.test.ts (34 tests) 12ms
 ✓ tests/unit/cron-validators.test.ts (38 tests) 30ms
 ✓ tests/unit/shared-response.test.ts (22 tests) 183ms
 ✓ tests/unit/rate-limit-shared.test.ts (14 tests) 66ms
 ✓ tests/unit/gateway-pagination.test.ts (20 tests) 14ms
 ✓ tests/unit/gateway-auth.test.ts (28 tests) 17ms
 ✓ tests/unit/boundary-edge-cases.test.ts (9 tests) 31ms
 ✓ tests/unit/frontend-hooks.test.ts (5 tests) 26ms
 ✓ tests/unit/circuit-breaker-shared.test.ts (9 tests) 37ms
 ✓ tests/unit/shared-circuit-breaker.test.ts (18 tests) 39ms
 ✓ tests/unit/shared-cors.test.ts (21 tests) 48ms
 ✓ tests/unit/cron-health-monitor.test.ts (10 tests) 7ms
 ✓ tests/unit/shared-logger.test.ts (13 tests) 13ms
 ✓ tests/unit/resilience-gaps.test.ts (5 tests) 68ms
 ✓ tests/unit/api-proveedor-auth.test.ts (17 tests) 61ms
 ✓ tests/unit/api-reservas-concurrencia.test.ts (4 tests) 30ms
 ✓ tests/unit/api-proveedor-routing.test.ts (17 tests) 42ms
 ✓ tests/unit/security-gaps.test.ts (6 tests) 8ms
 ✓ tests/unit/integration-contracts.test.ts (5 tests) 10ms
 ✓ tests/unit/api-ventas-pos.test.ts (4 tests) 59ms
stdout | tests/unit/cron-jobs-locking.test.ts > cron-jobs-maxiconsumo/orchestrator locking > skips si no se adquiere lock
{"ts":"2026-02-08T06:25:01.578Z","level":"info","scope":"cron-jobs-maxiconsumo:orchestrator","message":"ORCHESTRATOR_EXECUTE_START","requestId":"req-1","jobId":"daily_price_update","runId":"run_1770531901578_3vhzsv"}

stderr | tests/unit/cron-jobs-locking.test.ts > cron-jobs-maxiconsumo/orchestrator locking > skips si no se adquiere lock
{"ts":"2026-02-08T06:25:01.580Z","level":"warn","scope":"cron-jobs-maxiconsumo:orchestrator","message":"JOB_LOCKED","requestId":"req-1","jobId":"daily_price_update","runId":"run_1770531901578_3vhzsv","lockSeconds":360}

stdout | tests/unit/cron-jobs-locking.test.ts > cron-jobs-maxiconsumo/orchestrator locking > adquiere y libera lock en ejecución exitosa
{"ts":"2026-02-08T06:25:01.587Z","level":"info","scope":"cron-jobs-maxiconsumo:orchestrator","message":"ORCHESTRATOR_EXECUTE_START","requestId":"req-2","jobId":"daily_price_update","runId":"run_1770531901587_qfr6kn"}

stdout | tests/unit/cron-jobs-locking.test.ts > cron-jobs-maxiconsumo/orchestrator locking > fallback: si RPC de lock no existe (404), ejecuta job igualmente
{"ts":"2026-02-08T06:25:01.590Z","level":"info","scope":"cron-jobs-maxiconsumo:orchestrator","message":"ORCHESTRATOR_EXECUTE_START","requestId":"req-3","jobId":"daily_price_update","runId":"run_1770531901590_qlekhi"}

stderr | tests/unit/cron-jobs-locking.test.ts > cron-jobs-maxiconsumo/orchestrator locking > fallback: si RPC de lock no existe (404), ejecuta job igualmente
{"ts":"2026-02-08T06:25:01.591Z","level":"warn","scope":"cron-jobs-maxiconsumo:orchestrator","message":"JOB_LOCK_RPC_MISSING","jobId":"daily_price_update","owner":"380486fe-7d63-45f5-b87c-15ae41f8704f","action":"fallback_no_lock"}

stderr | tests/unit/cron-jobs-locking.test.ts > cron-jobs-maxiconsumo/orchestrator locking > fallback: si RPC de lock no existe (404), ejecuta job igualmente
{"ts":"2026-02-08T06:25:01.592Z","level":"warn","scope":"cron-jobs-maxiconsumo:orchestrator","message":"JOB_LOCK_RELEASE_FAILED","jobId":"daily_price_update","error":"RPC sp_release_job_lock failed: 404 Not Found"}

 ✓ tests/unit/cron-jobs-locking.test.ts (3 tests) 19ms
 ✓ tests/unit/cron-notifications.test.ts (10 tests) 18ms
 ✓ tests/unit/api-ofertas.test.ts (5 tests) 21ms
 ✓ tests/unit/frontend-utils.test.ts (8 tests) 19ms
 ✓ tests/unit/api-bitacora.test.ts (3 tests) 21ms
 ✓ tests/unit/scraper-cache.test.ts (4 tests) 134ms
 ✓ tests/unit/cron-jobs.test.ts (8 tests) 24ms
 ✓ tests/unit/scraper-alertas.test.ts (3 tests) 4ms

 Test Files  44 passed (44)
      Tests  785 passed (785)
   Start at  06:24:32
   Duration  36.46s (transform 4.85s, setup 8.91s, import 6.38s, tests 1.94s, environment 67.65s)

JUNIT report written to /home/eevan/ProyectosIA/aidrive_genspark__review_fase1_fase2_20260208/test-reports/junit.xml
```

## TEST (A1) rate limit shared helper

```bash
npm run test:unit -- tests/unit/rate-limit-shared.test.ts 
```

```

> workspace@1.0.0 test:unit
> vitest run tests/unit tests/unit/rate-limit-shared.test.ts


 RUN  v4.0.16 /home/eevan/ProyectosIA/aidrive_genspark__review_fase1_fase2_20260208

 ✓ tests/unit/shared-response.test.ts (22 tests) 53ms
 ✓ tests/unit/scraper-cache.test.ts (4 tests) 24ms
stdout | tests/unit/scraper-storage-auth.test.ts > storage key separation runtime > usa readKey para lecturas y writeKey para inserciones/actualizaciones
{"ts":"2026-02-08T06:25:09.811Z","level":"info","scope":"scraper-maxiconsumo:storage","message":"BATCH_INSERT_SUCCESS","requestId":"rw-1","count":1}

stdout | tests/unit/scraper-storage-auth.test.ts > storage key separation runtime > usa readKey para lecturas y writeKey para inserciones/actualizaciones
{"ts":"2026-02-08T06:25:09.926Z","level":"info","scope":"scraper-maxiconsumo:storage","message":"BATCH_UPDATE_COMPLETE","requestId":"rw-1","count":1}

stdout | tests/unit/scraper-storage-auth.test.ts > storage key separation runtime > usa writeKey también para lecturas cuando readKey=service (modo service)
{"ts":"2026-02-08T06:25:09.928Z","level":"info","scope":"scraper-maxiconsumo:storage","message":"BATCH_INSERT_SUCCESS","requestId":"rw-2","count":1}

 ✓ tests/unit/scraper-storage-auth.test.ts (32 tests) 141ms
 ✓ tests/unit/shared-errors.test.ts (32 tests) 34ms
 ✓ tests/unit/strategic-high-value.test.ts (27 tests) 145ms
 ✓ tests/unit/scraper-parsing-edge-cases.test.ts (26 tests) 26ms
 ✓ tests/unit/resilience-gaps.test.ts (5 tests) 92ms
 ✓ tests/unit/rate-limit-shared.test.ts (14 tests) 22ms
 ✓ tests/unit/auth-resilient.test.ts (16 tests) 67ms
 ✓ tests/unit/scraper-config.test.ts (22 tests) 48ms
 ✓ tests/unit/api-proveedor-auth.test.ts (17 tests) 21ms
 ✓ tests/unit/api-ventas-pos.test.ts (4 tests) 33ms
 ✓ tests/unit/shared-cors.test.ts (21 tests) 32ms
stderr | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeDailyPriceUpdate > debería retornar error si contexto es inválido
{"ts":"2026-02-08T06:25:16.796Z","level":"error","scope":"cron-jobs-maxiconsumo:job:daily-price-update","message":"VALIDATION_FAILED","field":"ctx.jobId","reason":"must be a non-empty string"}

stderr | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeDailyPriceUpdate > debería retornar error si supabaseUrl está vacío
{"ts":"2026-02-08T06:25:16.799Z","level":"error","scope":"cron-jobs-maxiconsumo:job:daily-price-update","message":"VALIDATION_FAILED","field":"supabaseUrl","reason":"must be a valid URL"}

stderr | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeDailyPriceUpdate > debería retornar error si serviceRoleKey está vacío
{"ts":"2026-02-08T06:25:16.801Z","level":"error","scope":"cron-jobs-maxiconsumo:job:daily-price-update","message":"VALIDATION_FAILED","field":"serviceRoleKey","reason":"must be a non-empty string"}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeDailyPriceUpdate > debería procesar correctamente cuando scraper responde OK
{"ts":"2026-02-08T06:25:16.802Z","level":"info","scope":"cron-jobs-maxiconsumo:job:daily-price-update","message":"JOB_START","requestId":"req-789","jobId":"test_job","runId":"run-456"}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeDailyPriceUpdate > debería procesar correctamente cuando scraper responde OK
{"ts":"2026-02-08T06:25:16.803Z","level":"info","scope":"cron-jobs-maxiconsumo:job:daily-price-update","message":"SCRAPING_COMPLETE","requestId":"req-789","jobId":"test_job","runId":"run-456","processed":50,"successful":45}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeDailyPriceUpdate > debería procesar correctamente cuando scraper responde OK
{"ts":"2026-02-08T06:25:16.803Z","level":"info","scope":"cron-jobs-maxiconsumo:job:daily-price-update","message":"JOB_COMPLETE","requestId":"req-789","jobId":"test_job","runId":"run-456","processed":50,"alerts":5,"duration":1}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeDailyPriceUpdate > debería manejar error del scraper
{"ts":"2026-02-08T06:25:16.804Z","level":"info","scope":"cron-jobs-maxiconsumo:job:daily-price-update","message":"JOB_START","requestId":"req-789","jobId":"test_job","runId":"run-456"}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeDailyPriceUpdate > debería manejar error del scraper
{"ts":"2026-02-08T06:25:16.805Z","level":"info","scope":"cron-jobs-maxiconsumo:job:daily-price-update","message":"JOB_COMPLETE","requestId":"req-789","jobId":"test_job","runId":"run-456","processed":0,"alerts":0,"duration":1}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeDailyPriceUpdate > debería manejar excepción durante ejecución
{"ts":"2026-02-08T06:25:16.807Z","level":"info","scope":"cron-jobs-maxiconsumo:job:daily-price-update","message":"JOB_START","requestId":"req-789","jobId":"test_job","runId":"run-456"}

stderr | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeDailyPriceUpdate > debería manejar excepción durante ejecución
{"ts":"2026-02-08T06:25:16.809Z","level":"error","scope":"cron-jobs-maxiconsumo:job:daily-price-update","message":"JOB_ERROR","requestId":"req-789","jobId":"test_job","runId":"run-456","error":"Network failure"}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeDailyPriceUpdate > debería calcular executionTimeMs correctamente
{"ts":"2026-02-08T06:25:16.809Z","level":"info","scope":"cron-jobs-maxiconsumo:job:daily-price-update","message":"JOB_START","requestId":"req-789","jobId":"test_job","runId":"run-456"}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeDailyPriceUpdate > debería calcular executionTimeMs correctamente
{"ts":"2026-02-08T06:25:16.810Z","level":"info","scope":"cron-jobs-maxiconsumo:job:daily-price-update","message":"SCRAPING_COMPLETE","requestId":"req-789","jobId":"test_job","runId":"run-456","processed":10,"successful":10}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeDailyPriceUpdate > debería calcular executionTimeMs correctamente
{"ts":"2026-02-08T06:25:16.810Z","level":"info","scope":"cron-jobs-maxiconsumo:job:daily-price-update","message":"JOB_COMPLETE","requestId":"req-789","jobId":"test_job","runId":"run-456","processed":10,"alerts":0,"duration":1}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeDailyPriceUpdate > debería llamar al endpoint correcto del scraper
{"ts":"2026-02-08T06:25:16.811Z","level":"info","scope":"cron-jobs-maxiconsumo:job:daily-price-update","message":"JOB_START","requestId":"req-789","jobId":"test_job","runId":"run-456"}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeDailyPriceUpdate > debería llamar al endpoint correcto del scraper
{"ts":"2026-02-08T06:25:16.811Z","level":"info","scope":"cron-jobs-maxiconsumo:job:daily-price-update","message":"SCRAPING_COMPLETE","requestId":"req-789","jobId":"test_job","runId":"run-456","processed":0,"successful":0}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeDailyPriceUpdate > debería llamar al endpoint correcto del scraper
{"ts":"2026-02-08T06:25:16.811Z","level":"info","scope":"cron-jobs-maxiconsumo:job:daily-price-update","message":"JOB_COMPLETE","requestId":"req-789","jobId":"test_job","runId":"run-456","processed":0,"alerts":0,"duration":0}

stderr | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeMaintenanceCleanup > debería retornar error si contexto es inválido
{"ts":"2026-02-08T06:25:16.820Z","level":"error","scope":"cron-jobs-maxiconsumo:job:maintenance","message":"VALIDATION_FAILED","field":"ctx.jobId","reason":"must be a non-empty string"}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeMaintenanceCleanup > debería limpiar registros antiguos correctamente
{"ts":"2026-02-08T06:25:16.826Z","level":"info","scope":"cron-jobs-maxiconsumo:job:maintenance","message":"JOB_START","requestId":"req-789","jobId":"test_job","runId":"run-456"}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeMaintenanceCleanup > debería limpiar registros antiguos correctamente
{"ts":"2026-02-08T06:25:16.827Z","level":"info","scope":"cron-jobs-maxiconsumo:job:maintenance","message":"LOGS_CLEANED","requestId":"req-789","jobId":"test_job","runId":"run-456","count":2}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeMaintenanceCleanup > debería limpiar registros antiguos correctamente
{"ts":"2026-02-08T06:25:16.828Z","level":"info","scope":"cron-jobs-maxiconsumo:job:maintenance","message":"JOB_COMPLETE","requestId":"req-789","jobId":"test_job","runId":"run-456","metrics":{"logs_deleted":2,"metrics_deleted":1,"alerts_deleted":0},"duration":2}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeMaintenanceCleanup > debería usar parámetros de retención personalizados
{"ts":"2026-02-08T06:25:16.829Z","level":"info","scope":"cron-jobs-maxiconsumo:job:maintenance","message":"JOB_START","requestId":"req-789","jobId":"test_job","runId":"run-456"}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeMaintenanceCleanup > debería usar parámetros de retención personalizados
{"ts":"2026-02-08T06:25:16.830Z","level":"info","scope":"cron-jobs-maxiconsumo:job:maintenance","message":"LOGS_CLEANED","requestId":"req-789","jobId":"test_job","runId":"run-456","count":0}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeMaintenanceCleanup > debería usar parámetros de retención personalizados
{"ts":"2026-02-08T06:25:16.832Z","level":"info","scope":"cron-jobs-maxiconsumo:job:maintenance","message":"JOB_COMPLETE","requestId":"req-789","jobId":"test_job","runId":"run-456","metrics":{"logs_deleted":0,"metrics_deleted":0,"alerts_deleted":0},"duration":1}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeMaintenanceCleanup > debería recomendar reducir retención si limpia muchos registros
{"ts":"2026-02-08T06:25:16.833Z","level":"info","scope":"cron-jobs-maxiconsumo:job:maintenance","message":"JOB_START","requestId":"req-789","jobId":"test_job","runId":"run-456"}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeMaintenanceCleanup > debería recomendar reducir retención si limpia muchos registros
{"ts":"2026-02-08T06:25:16.833Z","level":"info","scope":"cron-jobs-maxiconsumo:job:maintenance","message":"LOGS_CLEANED","requestId":"req-789","jobId":"test_job","runId":"run-456","count":500}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeMaintenanceCleanup > debería recomendar reducir retención si limpia muchos registros
{"ts":"2026-02-08T06:25:16.833Z","level":"info","scope":"cron-jobs-maxiconsumo:job:maintenance","message":"JOB_COMPLETE","requestId":"req-789","jobId":"test_job","runId":"run-456","metrics":{"logs_deleted":500,"metrics_deleted":400,"alerts_deleted":200},"duration":0}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeMaintenanceCleanup > debería manejar excepción durante ejecución
{"ts":"2026-02-08T06:25:16.835Z","level":"info","scope":"cron-jobs-maxiconsumo:job:maintenance","message":"JOB_START","requestId":"req-789","jobId":"test_job","runId":"run-456"}

stderr | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeMaintenanceCleanup > debería manejar excepción durante ejecución
{"ts":"2026-02-08T06:25:16.835Z","level":"error","scope":"cron-jobs-maxiconsumo:job:maintenance","message":"JOB_ERROR","requestId":"req-789","jobId":"test_job","runId":"run-456","error":"Database error"}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeMaintenanceCleanup > debería usar headers correctos para DELETE
{"ts":"2026-02-08T06:25:16.836Z","level":"info","scope":"cron-jobs-maxiconsumo:job:maintenance","message":"JOB_START","requestId":"req-789","jobId":"test_job","runId":"run-456"}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeMaintenanceCleanup > debería usar headers correctos para DELETE
{"ts":"2026-02-08T06:25:16.839Z","level":"info","scope":"cron-jobs-maxiconsumo:job:maintenance","message":"LOGS_CLEANED","requestId":"req-789","jobId":"test_job","runId":"run-456","count":0}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeMaintenanceCleanup > debería usar headers correctos para DELETE
{"ts":"2026-02-08T06:25:16.839Z","level":"info","scope":"cron-jobs-maxiconsumo:job:maintenance","message":"JOB_COMPLETE","requestId":"req-789","jobId":"test_job","runId":"run-456","metrics":{"logs_deleted":0,"metrics_deleted":0,"alerts_deleted":0},"duration":3}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeMaintenanceCleanup > debería calcular productsProcessed como total limpiado
{"ts":"2026-02-08T06:25:16.840Z","level":"info","scope":"cron-jobs-maxiconsumo:job:maintenance","message":"JOB_START","requestId":"req-789","jobId":"test_job","runId":"run-456"}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeMaintenanceCleanup > debería calcular productsProcessed como total limpiado
{"ts":"2026-02-08T06:25:16.840Z","level":"info","scope":"cron-jobs-maxiconsumo:job:maintenance","message":"LOGS_CLEANED","requestId":"req-789","jobId":"test_job","runId":"run-456","count":3}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeMaintenanceCleanup > debería calcular productsProcessed como total limpiado
{"ts":"2026-02-08T06:25:16.840Z","level":"info","scope":"cron-jobs-maxiconsumo:job:maintenance","message":"JOB_COMPLETE","requestId":"req-789","jobId":"test_job","runId":"run-456","metrics":{"logs_deleted":3,"metrics_deleted":2,"alerts_deleted":1},"duration":0}

stderr | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeRealtimeAlerts > debería retornar error si contexto es inválido
{"ts":"2026-02-08T06:25:16.840Z","level":"error","scope":"cron-jobs-maxiconsumo:job:realtime-alerts","message":"VALIDATION_FAILED","field":"ctx.jobId","reason":"must be a non-empty string"}

stderr | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeRealtimeAlerts > debería retornar error si supabaseUrl está vacío
{"ts":"2026-02-08T06:25:16.842Z","level":"error","scope":"cron-jobs-maxiconsumo:job:realtime-alerts","message":"VALIDATION_FAILED","field":"supabaseUrl","reason":"must be a valid URL"}

stderr | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeRealtimeAlerts > debería retornar error si serviceRoleKey está vacío
{"ts":"2026-02-08T06:25:16.846Z","level":"error","scope":"cron-jobs-maxiconsumo:job:realtime-alerts","message":"VALIDATION_FAILED","field":"serviceRoleKey","reason":"must be a non-empty string"}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeRealtimeAlerts > debería procesar alertas críticas correctamente
{"ts":"2026-02-08T06:25:16.850Z","level":"info","scope":"cron-jobs-maxiconsumo:job:realtime-alerts","message":"JOB_START","requestId":"req-789","jobId":"test_job","runId":"run-456"}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeRealtimeAlerts > debería procesar alertas críticas correctamente
{"ts":"2026-02-08T06:25:16.850Z","level":"info","scope":"cron-jobs-maxiconsumo:job:realtime-alerts","message":"CHANGES_DETECTED","requestId":"req-789","jobId":"test_job","runId":"run-456","total":2,"critical":2}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeRealtimeAlerts > debería procesar alertas críticas correctamente
{"ts":"2026-02-08T06:25:16.851Z","level":"info","scope":"cron-jobs-maxiconsumo:job:realtime-alerts","message":"JOB_COMPLETE","requestId":"req-789","jobId":"test_job","runId":"run-456","alerts":2,"duration":1}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeRealtimeAlerts > debería no generar alertas si cambios están bajo threshold
{"ts":"2026-02-08T06:25:16.853Z","level":"info","scope":"cron-jobs-maxiconsumo:job:realtime-alerts","message":"JOB_START","requestId":"req-789","jobId":"test_job","runId":"run-456"}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeRealtimeAlerts > debería no generar alertas si cambios están bajo threshold
{"ts":"2026-02-08T06:25:16.854Z","level":"info","scope":"cron-jobs-maxiconsumo:job:realtime-alerts","message":"CHANGES_DETECTED","requestId":"req-789","jobId":"test_job","runId":"run-456","total":1,"critical":0}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeRealtimeAlerts > debería no generar alertas si cambios están bajo threshold
{"ts":"2026-02-08T06:25:16.854Z","level":"info","scope":"cron-jobs-maxiconsumo:job:realtime-alerts","message":"JOB_COMPLETE","requestId":"req-789","jobId":"test_job","runId":"run-456","alerts":0,"duration":1}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeRealtimeAlerts > debería usar threshold personalizado de parámetros
{"ts":"2026-02-08T06:25:16.855Z","level":"info","scope":"cron-jobs-maxiconsumo:job:realtime-alerts","message":"JOB_START","requestId":"req-789","jobId":"test_job","runId":"run-456"}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeRealtimeAlerts > debería usar threshold personalizado de parámetros
{"ts":"2026-02-08T06:25:16.855Z","level":"info","scope":"cron-jobs-maxiconsumo:job:realtime-alerts","message":"CHANGES_DETECTED","requestId":"req-789","jobId":"test_job","runId":"run-456","total":1,"critical":1}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeRealtimeAlerts > debería usar threshold personalizado de parámetros
{"ts":"2026-02-08T06:25:16.856Z","level":"info","scope":"cron-jobs-maxiconsumo:job:realtime-alerts","message":"JOB_COMPLETE","requestId":"req-789","jobId":"test_job","runId":"run-456","alerts":1,"duration":1}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeRealtimeAlerts > debería manejar excepción durante ejecución
{"ts":"2026-02-08T06:25:16.856Z","level":"info","scope":"cron-jobs-maxiconsumo:job:realtime-alerts","message":"JOB_START","requestId":"req-789","jobId":"test_job","runId":"run-456"}

stderr | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeRealtimeAlerts > debería manejar excepción durante ejecución
{"ts":"2026-02-08T06:25:16.856Z","level":"error","scope":"cron-jobs-maxiconsumo:job:realtime-alerts","message":"JOB_ERROR","requestId":"req-789","jobId":"test_job","runId":"run-456","error":"Database timeout"}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeRealtimeAlerts > debería calcular executionTimeMs correctamente
{"ts":"2026-02-08T06:25:16.857Z","level":"info","scope":"cron-jobs-maxiconsumo:job:realtime-alerts","message":"JOB_START","requestId":"req-789","jobId":"test_job","runId":"run-456"}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeRealtimeAlerts > debería calcular executionTimeMs correctamente
{"ts":"2026-02-08T06:25:16.858Z","level":"info","scope":"cron-jobs-maxiconsumo:job:realtime-alerts","message":"CHANGES_DETECTED","requestId":"req-789","jobId":"test_job","runId":"run-456","total":0,"critical":0}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeRealtimeAlerts > debería calcular executionTimeMs correctamente
{"ts":"2026-02-08T06:25:16.859Z","level":"info","scope":"cron-jobs-maxiconsumo:job:realtime-alerts","message":"JOB_COMPLETE","requestId":"req-789","jobId":"test_job","runId":"run-456","alerts":0,"duration":1}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeRealtimeAlerts > debería consultar precios de los últimos 15 minutos
{"ts":"2026-02-08T06:25:16.860Z","level":"info","scope":"cron-jobs-maxiconsumo:job:realtime-alerts","message":"JOB_START","requestId":"req-789","jobId":"test_job","runId":"run-456"}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeRealtimeAlerts > debería consultar precios de los últimos 15 minutos
{"ts":"2026-02-08T06:25:16.860Z","level":"info","scope":"cron-jobs-maxiconsumo:job:realtime-alerts","message":"CHANGES_DETECTED","requestId":"req-789","jobId":"test_job","runId":"run-456","total":0,"critical":0}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeRealtimeAlerts > debería consultar precios de los últimos 15 minutos
{"ts":"2026-02-08T06:25:16.861Z","level":"info","scope":"cron-jobs-maxiconsumo:job:realtime-alerts","message":"JOB_COMPLETE","requestId":"req-789","jobId":"test_job","runId":"run-456","alerts":0,"duration":1}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeRealtimeAlerts > debería crear alertas con severidad crítica
{"ts":"2026-02-08T06:25:16.862Z","level":"info","scope":"cron-jobs-maxiconsumo:job:realtime-alerts","message":"JOB_START","requestId":"req-789","jobId":"test_job","runId":"run-456"}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeRealtimeAlerts > debería crear alertas con severidad crítica
{"ts":"2026-02-08T06:25:16.863Z","level":"info","scope":"cron-jobs-maxiconsumo:job:realtime-alerts","message":"CHANGES_DETECTED","requestId":"req-789","jobId":"test_job","runId":"run-456","total":1,"critical":1}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeRealtimeAlerts > debería crear alertas con severidad crítica
{"ts":"2026-02-08T06:25:16.863Z","level":"info","scope":"cron-jobs-maxiconsumo:job:realtime-alerts","message":"JOB_COMPLETE","requestId":"req-789","jobId":"test_job","runId":"run-456","alerts":1,"duration":1}

stderr | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeWeeklyAnalysis > debería retornar error si contexto es inválido
{"ts":"2026-02-08T06:25:16.870Z","level":"error","scope":"cron-jobs-maxiconsumo:job:weekly-analysis","message":"VALIDATION_FAILED","field":"ctx.jobId","reason":"must be a non-empty string"}

stderr | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeWeeklyAnalysis > debería retornar error si supabaseUrl está vacío
{"ts":"2026-02-08T06:25:16.871Z","level":"error","scope":"cron-jobs-maxiconsumo:job:weekly-analysis","message":"VALIDATION_FAILED","field":"supabaseUrl","reason":"must be a valid URL"}

stderr | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeWeeklyAnalysis > debería retornar error si serviceRoleKey está vacío
{"ts":"2026-02-08T06:25:16.871Z","level":"error","scope":"cron-jobs-maxiconsumo:job:weekly-analysis","message":"VALIDATION_FAILED","field":"serviceRoleKey","reason":"must be a non-empty string"}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeWeeklyAnalysis > debería calcular trends correctamente con datos válidos
{"ts":"2026-02-08T06:25:16.872Z","level":"info","scope":"cron-jobs-maxiconsumo:job:weekly-analysis","message":"JOB_START","requestId":"req-789","jobId":"test_job","runId":"run-456"}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeWeeklyAnalysis > debería calcular trends correctamente con datos válidos
{"ts":"2026-02-08T06:25:16.872Z","level":"info","scope":"cron-jobs-maxiconsumo:job:weekly-analysis","message":"TRENDS_CALCULATED","requestId":"req-789","jobId":"test_job","runId":"run-456","trends":{"total_cambios":2,"promedio_cambio":"20.00","alertas_semana":2,"alertas_criticas":1}}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeWeeklyAnalysis > debería calcular trends correctamente con datos válidos
{"ts":"2026-02-08T06:25:16.873Z","level":"info","scope":"cron-jobs-maxiconsumo:job:weekly-analysis","message":"JOB_COMPLETE","requestId":"req-789","jobId":"test_job","runId":"run-456","trends":{"total_cambios":2,"promedio_cambio":"20.00","alertas_semana":2,"alertas_criticas":1},"duration":0}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeWeeklyAnalysis > debería manejar respuestas vacías correctamente
{"ts":"2026-02-08T06:25:16.882Z","level":"info","scope":"cron-jobs-maxiconsumo:job:weekly-analysis","message":"JOB_START","requestId":"req-789","jobId":"test_job","runId":"run-456"}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeWeeklyAnalysis > debería manejar respuestas vacías correctamente
{"ts":"2026-02-08T06:25:16.883Z","level":"info","scope":"cron-jobs-maxiconsumo:job:weekly-analysis","message":"TRENDS_CALCULATED","requestId":"req-789","jobId":"test_job","runId":"run-456","trends":{"total_cambios":0,"promedio_cambio":"0.00","alertas_semana":0,"alertas_criticas":0}}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeWeeklyAnalysis > debería manejar respuestas vacías correctamente
{"ts":"2026-02-08T06:25:16.883Z","level":"info","scope":"cron-jobs-maxiconsumo:job:weekly-analysis","message":"JOB_COMPLETE","requestId":"req-789","jobId":"test_job","runId":"run-456","trends":{"total_cambios":0,"promedio_cambio":"0.00","alertas_semana":0,"alertas_criticas":0},"duration":1}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeWeeklyAnalysis > debería generar recomendación si alertas críticas > 10
{"ts":"2026-02-08T06:25:16.884Z","level":"info","scope":"cron-jobs-maxiconsumo:job:weekly-analysis","message":"JOB_START","requestId":"req-789","jobId":"test_job","runId":"run-456"}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeWeeklyAnalysis > debería generar recomendación si alertas críticas > 10
{"ts":"2026-02-08T06:25:16.884Z","level":"info","scope":"cron-jobs-maxiconsumo:job:weekly-analysis","message":"TRENDS_CALCULATED","requestId":"req-789","jobId":"test_job","runId":"run-456","trends":{"total_cambios":0,"promedio_cambio":"0.00","alertas_semana":12,"alertas_criticas":12}}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeWeeklyAnalysis > debería generar recomendación si alertas críticas > 10
{"ts":"2026-02-08T06:25:16.884Z","level":"info","scope":"cron-jobs-maxiconsumo:job:weekly-analysis","message":"JOB_COMPLETE","requestId":"req-789","jobId":"test_job","runId":"run-456","trends":{"total_cambios":0,"promedio_cambio":"0.00","alertas_semana":12,"alertas_criticas":12},"duration":0}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeWeeklyAnalysis > debería generar recomendación si totalChanges > 100
{"ts":"2026-02-08T06:25:16.884Z","level":"info","scope":"cron-jobs-maxiconsumo:job:weekly-analysis","message":"JOB_START","requestId":"req-789","jobId":"test_job","runId":"run-456"}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeWeeklyAnalysis > debería generar recomendación si totalChanges > 100
{"ts":"2026-02-08T06:25:16.885Z","level":"info","scope":"cron-jobs-maxiconsumo:job:weekly-analysis","message":"TRENDS_CALCULATED","requestId":"req-789","jobId":"test_job","runId":"run-456","trends":{"total_cambios":105,"promedio_cambio":"10.00","alertas_semana":0,"alertas_criticas":0}}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeWeeklyAnalysis > debería generar recomendación si totalChanges > 100
{"ts":"2026-02-08T06:25:16.885Z","level":"info","scope":"cron-jobs-maxiconsumo:job:weekly-analysis","message":"JOB_COMPLETE","requestId":"req-789","jobId":"test_job","runId":"run-456","trends":{"total_cambios":105,"promedio_cambio":"10.00","alertas_semana":0,"alertas_criticas":0},"duration":1}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeWeeklyAnalysis > debería guardar métricas en cron_jobs_metrics
{"ts":"2026-02-08T06:25:16.894Z","level":"info","scope":"cron-jobs-maxiconsumo:job:weekly-analysis","message":"JOB_START","requestId":"req-789","jobId":"test_job","runId":"run-456"}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeWeeklyAnalysis > debería guardar métricas en cron_jobs_metrics
{"ts":"2026-02-08T06:25:16.895Z","level":"info","scope":"cron-jobs-maxiconsumo:job:weekly-analysis","message":"TRENDS_CALCULATED","requestId":"req-789","jobId":"test_job","runId":"run-456","trends":{"total_cambios":1,"promedio_cambio":"10.00","alertas_semana":0,"alertas_criticas":0}}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeWeeklyAnalysis > debería guardar métricas en cron_jobs_metrics
{"ts":"2026-02-08T06:25:16.895Z","level":"info","scope":"cron-jobs-maxiconsumo:job:weekly-analysis","message":"JOB_COMPLETE","requestId":"req-789","jobId":"test_job","runId":"run-456","trends":{"total_cambios":1,"promedio_cambio":"10.00","alertas_semana":0,"alertas_criticas":0},"duration":1}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeWeeklyAnalysis > debería manejar excepción durante ejecución
{"ts":"2026-02-08T06:25:16.896Z","level":"info","scope":"cron-jobs-maxiconsumo:job:weekly-analysis","message":"JOB_START","requestId":"req-789","jobId":"test_job","runId":"run-456"}

stderr | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeWeeklyAnalysis > debería manejar excepción durante ejecución
{"ts":"2026-02-08T06:25:16.898Z","level":"error","scope":"cron-jobs-maxiconsumo:job:weekly-analysis","message":"JOB_ERROR","requestId":"req-789","jobId":"test_job","runId":"run-456","error":"Connection refused"}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeWeeklyAnalysis > debería calcular productsProcessed como totalChanges
{"ts":"2026-02-08T06:25:16.898Z","level":"info","scope":"cron-jobs-maxiconsumo:job:weekly-analysis","message":"JOB_START","requestId":"req-789","jobId":"test_job","runId":"run-456"}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeWeeklyAnalysis > debería calcular productsProcessed como totalChanges
{"ts":"2026-02-08T06:25:16.898Z","level":"info","scope":"cron-jobs-maxiconsumo:job:weekly-analysis","message":"TRENDS_CALCULATED","requestId":"req-789","jobId":"test_job","runId":"run-456","trends":{"total_cambios":3,"promedio_cambio":"10.00","alertas_semana":0,"alertas_criticas":0}}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeWeeklyAnalysis > debería calcular productsProcessed como totalChanges
{"ts":"2026-02-08T06:25:16.899Z","level":"info","scope":"cron-jobs-maxiconsumo:job:weekly-analysis","message":"JOB_COMPLETE","requestId":"req-789","jobId":"test_job","runId":"run-456","trends":{"total_cambios":3,"promedio_cambio":"10.00","alertas_semana":0,"alertas_criticas":0},"duration":0}

 ✓ tests/unit/cron-jobs-handlers.test.ts (35 tests) 109ms
stderr | tests/unit/cron-jobs-execution-log.test.ts > execution-log > writeExecutionLog > debería manejar errores de fetch sin lanzar excepción
{"ts":"2026-02-08T06:25:16.953Z","level":"warn","scope":"cron-jobs-maxiconsumo:execution-log","message":"EXECUTION_LOG_INSERT_FAILED","requestId":"req-789","jobId":"daily_price_update","runId":"run-456","error":"Network error"}

stderr | tests/unit/cron-jobs-execution-log.test.ts > execution-log > writeExecutionLog > debería manejar respuestas no-ok sin lanzar excepción
{"ts":"2026-02-08T06:25:16.956Z","level":"warn","scope":"cron-jobs-maxiconsumo:execution-log","message":"EXECUTION_LOG_INSERT_FAILED","requestId":"req-789","jobId":"daily_price_update","runId":"run-456","status":500,"status_text":"Internal Server Error"}

 ✓ tests/unit/cron-jobs-execution-log.test.ts (17 tests) 26ms
 ✓ tests/unit/api-proveedor-routing.test.ts (17 tests) 42ms
 ✓ tests/unit/scraper-cookie-jar.test.ts (20 tests) 36ms
 ✓ tests/unit/shared-circuit-breaker.test.ts (18 tests) 19ms
 ✓ tests/unit/circuit-breaker-shared.test.ts (9 tests) 14ms
 ✓ tests/unit/boundary-edge-cases.test.ts (9 tests) 67ms
stdout | tests/unit/shared-audit.test.ts > auditLog > should work in dry-run mode without supabase client
{"ts":"2026-02-08T06:25:20.266Z","level":"info","scope":"audit","message":"[AUDIT] precio_actualizado","usuario_id":"user-123","entidad_tipo":"productos","entidad_id":"prod-456","detalles":{"precio_anterior":100,"precio_nuevo":150},"nivel":"info"}

stderr | tests/unit/shared-audit.test.ts > auditLog > should work in dry-run mode without supabase client
{"ts":"2026-02-08T06:25:20.267Z","level":"warn","scope":"audit","message":"Audit log: dry-run mode, no database insert"}

stdout | tests/unit/shared-audit.test.ts > auditLog > should insert audit log with supabase client
{"ts":"2026-02-08T06:25:20.271Z","level":"info","scope":"audit","message":"[AUDIT] stock_ajustado","usuario_id":"user-456","entidad_tipo":"stock_deposito","entidad_id":"stock-789","nivel":"warning"}

stdout | tests/unit/shared-audit.test.ts > auditLog > should return error when database insert fails
{"ts":"2026-02-08T06:25:20.273Z","level":"info","scope":"audit","message":"[AUDIT] producto_eliminado","nivel":"info"}

stderr | tests/unit/shared-audit.test.ts > auditLog > should return error when database insert fails
{"ts":"2026-02-08T06:25:20.274Z","level":"error","scope":"audit","message":"Error inserting audit log","error":{"message":"Database error"}}

stdout | tests/unit/shared-audit.test.ts > auditLog > should handle exceptions gracefully
{"ts":"2026-02-08T06:25:20.274Z","level":"info","scope":"audit","message":"[AUDIT] login_fallido","nivel":"info"}

stderr | tests/unit/shared-audit.test.ts > auditLog > should handle exceptions gracefully
{"ts":"2026-02-08T06:25:20.274Z","level":"error","scope":"audit","message":"Exception in auditLog","error":"Connection failed"}

stdout | tests/unit/shared-audit.test.ts > auditLog > should use default nivel when not specified
{"ts":"2026-02-08T06:25:20.275Z","level":"info","scope":"audit","message":"[AUDIT] producto_creado","nivel":"info"}

stderr | tests/unit/shared-audit.test.ts > queryAuditLogs > should return error when query fails
{"ts":"2026-02-08T06:25:20.280Z","level":"error","scope":"audit","message":"Error querying audit logs","error":{"message":"Query failed"}}

stderr | tests/unit/shared-audit.test.ts > queryAuditLogs > should handle exceptions gracefully
{"ts":"2026-02-08T06:25:20.282Z","level":"error","scope":"audit","message":"Exception in queryAuditLogs","error":"Connection timeout"}

 ✓ tests/unit/shared-audit.test.ts (21 tests) 31ms
 ✓ tests/unit/cron-validators.test.ts (38 tests) 45ms
 ✓ tests/unit/api-reservas-concurrencia.test.ts (4 tests) 53ms
 ✓ tests/unit/api-proveedor-read-mode.test.ts (34 tests) 16ms
 ✓ tests/unit/frontend-hooks.test.ts (5 tests) 47ms
 ✓ tests/unit/cron-jobs.test.ts (8 tests) 16ms
 ✓ tests/unit/gateway-validation.test.ts (43 tests) 23ms
 ✓ tests/unit/scraper-anti-detection.test.ts (35 tests) 37ms
stdout | tests/unit/scraper-matching.test.ts > scraper-maxiconsumo/matching > performAdvancedMatching > omite coincidencias con confianza <= 20
{"ts":"2026-02-08T06:25:26.621Z","level":"info","scope":"scraper-maxiconsumo:matching","message":"MATCHING_COMPLETE","total":0}

stdout | tests/unit/scraper-matching.test.ts > scraper-maxiconsumo/matching > performAdvancedMatching > hace match por nombre normalizado cuando no hay SKU ni barcode
{"ts":"2026-02-08T06:25:26.635Z","level":"info","scope":"scraper-maxiconsumo:matching","message":"MATCHING_COMPLETE","total":1}

 ✓ tests/unit/scraper-matching.test.ts (31 tests) 68ms
 ✓ tests/unit/shared-rate-limit.test.ts (22 tests) 47ms
 ✓ tests/unit/api-ofertas.test.ts (5 tests) 264ms
 ✓ tests/unit/api-bitacora.test.ts (3 tests) 20ms
stdout | tests/unit/cron-jobs-locking.test.ts > cron-jobs-maxiconsumo/orchestrator locking > skips si no se adquiere lock
{"ts":"2026-02-08T06:25:30.927Z","level":"info","scope":"cron-jobs-maxiconsumo:orchestrator","message":"ORCHESTRATOR_EXECUTE_START","requestId":"req-1","jobId":"daily_price_update","runId":"run_1770531930926_hj9wsi"}

stderr | tests/unit/cron-jobs-locking.test.ts > cron-jobs-maxiconsumo/orchestrator locking > skips si no se adquiere lock
{"ts":"2026-02-08T06:25:30.931Z","level":"warn","scope":"cron-jobs-maxiconsumo:orchestrator","message":"JOB_LOCKED","requestId":"req-1","jobId":"daily_price_update","runId":"run_1770531930926_hj9wsi","lockSeconds":360}

stdout | tests/unit/cron-jobs-locking.test.ts > cron-jobs-maxiconsumo/orchestrator locking > adquiere y libera lock en ejecución exitosa
{"ts":"2026-02-08T06:25:30.937Z","level":"info","scope":"cron-jobs-maxiconsumo:orchestrator","message":"ORCHESTRATOR_EXECUTE_START","requestId":"req-2","jobId":"daily_price_update","runId":"run_1770531930937_nblrbb"}

stdout | tests/unit/cron-jobs-locking.test.ts > cron-jobs-maxiconsumo/orchestrator locking > fallback: si RPC de lock no existe (404), ejecuta job igualmente
{"ts":"2026-02-08T06:25:30.939Z","level":"info","scope":"cron-jobs-maxiconsumo:orchestrator","message":"ORCHESTRATOR_EXECUTE_START","requestId":"req-3","jobId":"daily_price_update","runId":"run_1770531930939_abq32m"}

stderr | tests/unit/cron-jobs-locking.test.ts > cron-jobs-maxiconsumo/orchestrator locking > fallback: si RPC de lock no existe (404), ejecuta job igualmente
{"ts":"2026-02-08T06:25:30.939Z","level":"warn","scope":"cron-jobs-maxiconsumo:orchestrator","message":"JOB_LOCK_RPC_MISSING","jobId":"daily_price_update","owner":"e2c64485-2194-4794-bc64-d66069cd1a88","action":"fallback_no_lock"}

stderr | tests/unit/cron-jobs-locking.test.ts > cron-jobs-maxiconsumo/orchestrator locking > fallback: si RPC de lock no existe (404), ejecuta job igualmente
{"ts":"2026-02-08T06:25:30.939Z","level":"warn","scope":"cron-jobs-maxiconsumo:orchestrator","message":"JOB_LOCK_RELEASE_FAILED","jobId":"daily_price_update","error":"RPC sp_release_job_lock failed: 404 Not Found"}

 ✓ tests/unit/cron-jobs-locking.test.ts (3 tests) 19ms
 ✓ tests/unit/frontend-utils.test.ts (8 tests) 6ms
 ✓ tests/unit/cron-notifications.test.ts (10 tests) 22ms
 ✓ tests/unit/gateway-auth.test.ts (28 tests) 47ms
 ✓ tests/unit/pedidos-handlers.test.ts (29 tests) 11ms
 ✓ tests/unit/gateway-pagination.test.ts (20 tests) 19ms
 ✓ tests/unit/shared-logger.test.ts (13 tests) 13ms
 ✓ tests/unit/scraper-parsing.test.ts (34 tests) 26ms
 ✓ tests/unit/integration-contracts.test.ts (5 tests) 22ms
 ✓ tests/unit/security-gaps.test.ts (6 tests) 12ms
 ✓ tests/unit/cron-health-monitor.test.ts (10 tests) 8ms
 ✓ tests/unit/scraper-alertas.test.ts (3 tests) 4ms

 Test Files  44 passed (44)
      Tests  785 passed (785)
   Start at  06:25:09
   Duration  28.74s (transform 2.80s, setup 7.46s, import 4.04s, tests 1.93s, environment 55.40s)

JUNIT report written to /home/eevan/ProyectosIA/aidrive_genspark__review_fase1_fase2_20260208/test-reports/junit.xml
```

## TEST (A2) circuit breaker shared helper

```bash
npm run test:unit -- tests/unit/circuit-breaker-shared.test.ts 
```

```

> workspace@1.0.0 test:unit
> vitest run tests/unit tests/unit/circuit-breaker-shared.test.ts


 RUN  v4.0.16 /home/eevan/ProyectosIA/aidrive_genspark__review_fase1_fase2_20260208

 ✓ tests/unit/api-ofertas.test.ts (5 tests) 31ms
stdout | tests/unit/scraper-storage-auth.test.ts > storage key separation runtime > usa readKey para lecturas y writeKey para inserciones/actualizaciones
{"ts":"2026-02-08T06:25:40.105Z","level":"info","scope":"scraper-maxiconsumo:storage","message":"BATCH_INSERT_SUCCESS","requestId":"rw-1","count":1}

 ✓ tests/unit/strategic-high-value.test.ts (27 tests) 134ms
stdout | tests/unit/scraper-storage-auth.test.ts > storage key separation runtime > usa readKey para lecturas y writeKey para inserciones/actualizaciones
{"ts":"2026-02-08T06:25:40.228Z","level":"info","scope":"scraper-maxiconsumo:storage","message":"BATCH_UPDATE_COMPLETE","requestId":"rw-1","count":1}

stdout | tests/unit/scraper-storage-auth.test.ts > storage key separation runtime > usa writeKey también para lecturas cuando readKey=service (modo service)
{"ts":"2026-02-08T06:25:40.238Z","level":"info","scope":"scraper-maxiconsumo:storage","message":"BATCH_INSERT_SUCCESS","requestId":"rw-2","count":1}

 ✓ tests/unit/scraper-storage-auth.test.ts (32 tests) 150ms
 ✓ tests/unit/resilience-gaps.test.ts (5 tests) 109ms
stderr | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeDailyPriceUpdate > debería retornar error si contexto es inválido
{"ts":"2026-02-08T06:25:40.660Z","level":"error","scope":"cron-jobs-maxiconsumo:job:daily-price-update","message":"VALIDATION_FAILED","field":"ctx.jobId","reason":"must be a non-empty string"}

stderr | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeDailyPriceUpdate > debería retornar error si supabaseUrl está vacío
{"ts":"2026-02-08T06:25:40.663Z","level":"error","scope":"cron-jobs-maxiconsumo:job:daily-price-update","message":"VALIDATION_FAILED","field":"supabaseUrl","reason":"must be a valid URL"}

stderr | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeDailyPriceUpdate > debería retornar error si serviceRoleKey está vacío
{"ts":"2026-02-08T06:25:40.664Z","level":"error","scope":"cron-jobs-maxiconsumo:job:daily-price-update","message":"VALIDATION_FAILED","field":"serviceRoleKey","reason":"must be a non-empty string"}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeDailyPriceUpdate > debería procesar correctamente cuando scraper responde OK
{"ts":"2026-02-08T06:25:40.665Z","level":"info","scope":"cron-jobs-maxiconsumo:job:daily-price-update","message":"JOB_START","requestId":"req-789","jobId":"test_job","runId":"run-456"}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeDailyPriceUpdate > debería procesar correctamente cuando scraper responde OK
{"ts":"2026-02-08T06:25:40.666Z","level":"info","scope":"cron-jobs-maxiconsumo:job:daily-price-update","message":"SCRAPING_COMPLETE","requestId":"req-789","jobId":"test_job","runId":"run-456","processed":50,"successful":45}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeDailyPriceUpdate > debería procesar correctamente cuando scraper responde OK
{"ts":"2026-02-08T06:25:40.666Z","level":"info","scope":"cron-jobs-maxiconsumo:job:daily-price-update","message":"JOB_COMPLETE","requestId":"req-789","jobId":"test_job","runId":"run-456","processed":50,"alerts":5,"duration":1}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeDailyPriceUpdate > debería manejar error del scraper
{"ts":"2026-02-08T06:25:40.667Z","level":"info","scope":"cron-jobs-maxiconsumo:job:daily-price-update","message":"JOB_START","requestId":"req-789","jobId":"test_job","runId":"run-456"}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeDailyPriceUpdate > debería manejar error del scraper
{"ts":"2026-02-08T06:25:40.668Z","level":"info","scope":"cron-jobs-maxiconsumo:job:daily-price-update","message":"JOB_COMPLETE","requestId":"req-789","jobId":"test_job","runId":"run-456","processed":0,"alerts":0,"duration":1}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeDailyPriceUpdate > debería manejar excepción durante ejecución
{"ts":"2026-02-08T06:25:40.669Z","level":"info","scope":"cron-jobs-maxiconsumo:job:daily-price-update","message":"JOB_START","requestId":"req-789","jobId":"test_job","runId":"run-456"}

stderr | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeDailyPriceUpdate > debería manejar excepción durante ejecución
{"ts":"2026-02-08T06:25:40.670Z","level":"error","scope":"cron-jobs-maxiconsumo:job:daily-price-update","message":"JOB_ERROR","requestId":"req-789","jobId":"test_job","runId":"run-456","error":"Network failure"}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeDailyPriceUpdate > debería calcular executionTimeMs correctamente
{"ts":"2026-02-08T06:25:40.671Z","level":"info","scope":"cron-jobs-maxiconsumo:job:daily-price-update","message":"JOB_START","requestId":"req-789","jobId":"test_job","runId":"run-456"}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeDailyPriceUpdate > debería calcular executionTimeMs correctamente
{"ts":"2026-02-08T06:25:40.671Z","level":"info","scope":"cron-jobs-maxiconsumo:job:daily-price-update","message":"SCRAPING_COMPLETE","requestId":"req-789","jobId":"test_job","runId":"run-456","processed":10,"successful":10}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeDailyPriceUpdate > debería calcular executionTimeMs correctamente
{"ts":"2026-02-08T06:25:40.672Z","level":"info","scope":"cron-jobs-maxiconsumo:job:daily-price-update","message":"JOB_COMPLETE","requestId":"req-789","jobId":"test_job","runId":"run-456","processed":10,"alerts":0,"duration":1}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeDailyPriceUpdate > debería llamar al endpoint correcto del scraper
{"ts":"2026-02-08T06:25:40.672Z","level":"info","scope":"cron-jobs-maxiconsumo:job:daily-price-update","message":"JOB_START","requestId":"req-789","jobId":"test_job","runId":"run-456"}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeDailyPriceUpdate > debería llamar al endpoint correcto del scraper
{"ts":"2026-02-08T06:25:40.673Z","level":"info","scope":"cron-jobs-maxiconsumo:job:daily-price-update","message":"SCRAPING_COMPLETE","requestId":"req-789","jobId":"test_job","runId":"run-456","processed":0,"successful":0}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeDailyPriceUpdate > debería llamar al endpoint correcto del scraper
{"ts":"2026-02-08T06:25:40.673Z","level":"info","scope":"cron-jobs-maxiconsumo:job:daily-price-update","message":"JOB_COMPLETE","requestId":"req-789","jobId":"test_job","runId":"run-456","processed":0,"alerts":0,"duration":1}

stderr | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeMaintenanceCleanup > debería retornar error si contexto es inválido
{"ts":"2026-02-08T06:25:40.676Z","level":"error","scope":"cron-jobs-maxiconsumo:job:maintenance","message":"VALIDATION_FAILED","field":"ctx.jobId","reason":"must be a non-empty string"}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeMaintenanceCleanup > debería limpiar registros antiguos correctamente
{"ts":"2026-02-08T06:25:40.677Z","level":"info","scope":"cron-jobs-maxiconsumo:job:maintenance","message":"JOB_START","requestId":"req-789","jobId":"test_job","runId":"run-456"}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeMaintenanceCleanup > debería limpiar registros antiguos correctamente
{"ts":"2026-02-08T06:25:40.677Z","level":"info","scope":"cron-jobs-maxiconsumo:job:maintenance","message":"LOGS_CLEANED","requestId":"req-789","jobId":"test_job","runId":"run-456","count":2}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeMaintenanceCleanup > debería limpiar registros antiguos correctamente
{"ts":"2026-02-08T06:25:40.678Z","level":"info","scope":"cron-jobs-maxiconsumo:job:maintenance","message":"JOB_COMPLETE","requestId":"req-789","jobId":"test_job","runId":"run-456","metrics":{"logs_deleted":2,"metrics_deleted":1,"alerts_deleted":0},"duration":1}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeMaintenanceCleanup > debería usar parámetros de retención personalizados
{"ts":"2026-02-08T06:25:40.678Z","level":"info","scope":"cron-jobs-maxiconsumo:job:maintenance","message":"JOB_START","requestId":"req-789","jobId":"test_job","runId":"run-456"}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeMaintenanceCleanup > debería usar parámetros de retención personalizados
{"ts":"2026-02-08T06:25:40.678Z","level":"info","scope":"cron-jobs-maxiconsumo:job:maintenance","message":"LOGS_CLEANED","requestId":"req-789","jobId":"test_job","runId":"run-456","count":0}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeMaintenanceCleanup > debería usar parámetros de retención personalizados
{"ts":"2026-02-08T06:25:40.678Z","level":"info","scope":"cron-jobs-maxiconsumo:job:maintenance","message":"JOB_COMPLETE","requestId":"req-789","jobId":"test_job","runId":"run-456","metrics":{"logs_deleted":0,"metrics_deleted":0,"alerts_deleted":0},"duration":0}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeMaintenanceCleanup > debería recomendar reducir retención si limpia muchos registros
{"ts":"2026-02-08T06:25:40.679Z","level":"info","scope":"cron-jobs-maxiconsumo:job:maintenance","message":"JOB_START","requestId":"req-789","jobId":"test_job","runId":"run-456"}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeMaintenanceCleanup > debería recomendar reducir retención si limpia muchos registros
{"ts":"2026-02-08T06:25:40.679Z","level":"info","scope":"cron-jobs-maxiconsumo:job:maintenance","message":"LOGS_CLEANED","requestId":"req-789","jobId":"test_job","runId":"run-456","count":500}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeMaintenanceCleanup > debería recomendar reducir retención si limpia muchos registros
{"ts":"2026-02-08T06:25:40.679Z","level":"info","scope":"cron-jobs-maxiconsumo:job:maintenance","message":"JOB_COMPLETE","requestId":"req-789","jobId":"test_job","runId":"run-456","metrics":{"logs_deleted":500,"metrics_deleted":400,"alerts_deleted":200},"duration":0}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeMaintenanceCleanup > debería manejar excepción durante ejecución
{"ts":"2026-02-08T06:25:40.680Z","level":"info","scope":"cron-jobs-maxiconsumo:job:maintenance","message":"JOB_START","requestId":"req-789","jobId":"test_job","runId":"run-456"}

stderr | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeMaintenanceCleanup > debería manejar excepción durante ejecución
{"ts":"2026-02-08T06:25:40.680Z","level":"error","scope":"cron-jobs-maxiconsumo:job:maintenance","message":"JOB_ERROR","requestId":"req-789","jobId":"test_job","runId":"run-456","error":"Database error"}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeMaintenanceCleanup > debería usar headers correctos para DELETE
{"ts":"2026-02-08T06:25:40.681Z","level":"info","scope":"cron-jobs-maxiconsumo:job:maintenance","message":"JOB_START","requestId":"req-789","jobId":"test_job","runId":"run-456"}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeMaintenanceCleanup > debería usar headers correctos para DELETE
{"ts":"2026-02-08T06:25:40.682Z","level":"info","scope":"cron-jobs-maxiconsumo:job:maintenance","message":"LOGS_CLEANED","requestId":"req-789","jobId":"test_job","runId":"run-456","count":0}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeMaintenanceCleanup > debería usar headers correctos para DELETE
{"ts":"2026-02-08T06:25:40.682Z","level":"info","scope":"cron-jobs-maxiconsumo:job:maintenance","message":"JOB_COMPLETE","requestId":"req-789","jobId":"test_job","runId":"run-456","metrics":{"logs_deleted":0,"metrics_deleted":0,"alerts_deleted":0},"duration":1}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeMaintenanceCleanup > debería calcular productsProcessed como total limpiado
{"ts":"2026-02-08T06:25:40.682Z","level":"info","scope":"cron-jobs-maxiconsumo:job:maintenance","message":"JOB_START","requestId":"req-789","jobId":"test_job","runId":"run-456"}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeMaintenanceCleanup > debería calcular productsProcessed como total limpiado
{"ts":"2026-02-08T06:25:40.683Z","level":"info","scope":"cron-jobs-maxiconsumo:job:maintenance","message":"LOGS_CLEANED","requestId":"req-789","jobId":"test_job","runId":"run-456","count":3}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeMaintenanceCleanup > debería calcular productsProcessed como total limpiado
{"ts":"2026-02-08T06:25:40.683Z","level":"info","scope":"cron-jobs-maxiconsumo:job:maintenance","message":"JOB_COMPLETE","requestId":"req-789","jobId":"test_job","runId":"run-456","metrics":{"logs_deleted":3,"metrics_deleted":2,"alerts_deleted":1},"duration":1}

stderr | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeRealtimeAlerts > debería retornar error si contexto es inválido
{"ts":"2026-02-08T06:25:40.683Z","level":"error","scope":"cron-jobs-maxiconsumo:job:realtime-alerts","message":"VALIDATION_FAILED","field":"ctx.jobId","reason":"must be a non-empty string"}

stderr | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeRealtimeAlerts > debería retornar error si supabaseUrl está vacío
{"ts":"2026-02-08T06:25:40.684Z","level":"error","scope":"cron-jobs-maxiconsumo:job:realtime-alerts","message":"VALIDATION_FAILED","field":"supabaseUrl","reason":"must be a valid URL"}

stderr | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeRealtimeAlerts > debería retornar error si serviceRoleKey está vacío
{"ts":"2026-02-08T06:25:40.684Z","level":"error","scope":"cron-jobs-maxiconsumo:job:realtime-alerts","message":"VALIDATION_FAILED","field":"serviceRoleKey","reason":"must be a non-empty string"}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeRealtimeAlerts > debería procesar alertas críticas correctamente
{"ts":"2026-02-08T06:25:40.685Z","level":"info","scope":"cron-jobs-maxiconsumo:job:realtime-alerts","message":"JOB_START","requestId":"req-789","jobId":"test_job","runId":"run-456"}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeRealtimeAlerts > debería procesar alertas críticas correctamente
{"ts":"2026-02-08T06:25:40.685Z","level":"info","scope":"cron-jobs-maxiconsumo:job:realtime-alerts","message":"CHANGES_DETECTED","requestId":"req-789","jobId":"test_job","runId":"run-456","total":2,"critical":2}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeRealtimeAlerts > debería procesar alertas críticas correctamente
{"ts":"2026-02-08T06:25:40.685Z","level":"info","scope":"cron-jobs-maxiconsumo:job:realtime-alerts","message":"JOB_COMPLETE","requestId":"req-789","jobId":"test_job","runId":"run-456","alerts":2,"duration":0}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeRealtimeAlerts > debería no generar alertas si cambios están bajo threshold
{"ts":"2026-02-08T06:25:40.685Z","level":"info","scope":"cron-jobs-maxiconsumo:job:realtime-alerts","message":"JOB_START","requestId":"req-789","jobId":"test_job","runId":"run-456"}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeRealtimeAlerts > debería no generar alertas si cambios están bajo threshold
{"ts":"2026-02-08T06:25:40.686Z","level":"info","scope":"cron-jobs-maxiconsumo:job:realtime-alerts","message":"CHANGES_DETECTED","requestId":"req-789","jobId":"test_job","runId":"run-456","total":1,"critical":0}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeRealtimeAlerts > debería no generar alertas si cambios están bajo threshold
{"ts":"2026-02-08T06:25:40.686Z","level":"info","scope":"cron-jobs-maxiconsumo:job:realtime-alerts","message":"JOB_COMPLETE","requestId":"req-789","jobId":"test_job","runId":"run-456","alerts":0,"duration":1}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeRealtimeAlerts > debería usar threshold personalizado de parámetros
{"ts":"2026-02-08T06:25:40.687Z","level":"info","scope":"cron-jobs-maxiconsumo:job:realtime-alerts","message":"JOB_START","requestId":"req-789","jobId":"test_job","runId":"run-456"}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeRealtimeAlerts > debería usar threshold personalizado de parámetros
{"ts":"2026-02-08T06:25:40.687Z","level":"info","scope":"cron-jobs-maxiconsumo:job:realtime-alerts","message":"CHANGES_DETECTED","requestId":"req-789","jobId":"test_job","runId":"run-456","total":1,"critical":1}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeRealtimeAlerts > debería usar threshold personalizado de parámetros
{"ts":"2026-02-08T06:25:40.688Z","level":"info","scope":"cron-jobs-maxiconsumo:job:realtime-alerts","message":"JOB_COMPLETE","requestId":"req-789","jobId":"test_job","runId":"run-456","alerts":1,"duration":1}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeRealtimeAlerts > debería manejar excepción durante ejecución
{"ts":"2026-02-08T06:25:40.688Z","level":"info","scope":"cron-jobs-maxiconsumo:job:realtime-alerts","message":"JOB_START","requestId":"req-789","jobId":"test_job","runId":"run-456"}

stderr | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeRealtimeAlerts > debería manejar excepción durante ejecución
{"ts":"2026-02-08T06:25:40.689Z","level":"error","scope":"cron-jobs-maxiconsumo:job:realtime-alerts","message":"JOB_ERROR","requestId":"req-789","jobId":"test_job","runId":"run-456","error":"Database timeout"}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeRealtimeAlerts > debería calcular executionTimeMs correctamente
{"ts":"2026-02-08T06:25:40.689Z","level":"info","scope":"cron-jobs-maxiconsumo:job:realtime-alerts","message":"JOB_START","requestId":"req-789","jobId":"test_job","runId":"run-456"}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeRealtimeAlerts > debería calcular executionTimeMs correctamente
{"ts":"2026-02-08T06:25:40.690Z","level":"info","scope":"cron-jobs-maxiconsumo:job:realtime-alerts","message":"CHANGES_DETECTED","requestId":"req-789","jobId":"test_job","runId":"run-456","total":0,"critical":0}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeRealtimeAlerts > debería calcular executionTimeMs correctamente
{"ts":"2026-02-08T06:25:40.690Z","level":"info","scope":"cron-jobs-maxiconsumo:job:realtime-alerts","message":"JOB_COMPLETE","requestId":"req-789","jobId":"test_job","runId":"run-456","alerts":0,"duration":1}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeRealtimeAlerts > debería consultar precios de los últimos 15 minutos
{"ts":"2026-02-08T06:25:40.691Z","level":"info","scope":"cron-jobs-maxiconsumo:job:realtime-alerts","message":"JOB_START","requestId":"req-789","jobId":"test_job","runId":"run-456"}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeRealtimeAlerts > debería consultar precios de los últimos 15 minutos
{"ts":"2026-02-08T06:25:40.691Z","level":"info","scope":"cron-jobs-maxiconsumo:job:realtime-alerts","message":"CHANGES_DETECTED","requestId":"req-789","jobId":"test_job","runId":"run-456","total":0,"critical":0}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeRealtimeAlerts > debería consultar precios de los últimos 15 minutos
{"ts":"2026-02-08T06:25:40.691Z","level":"info","scope":"cron-jobs-maxiconsumo:job:realtime-alerts","message":"JOB_COMPLETE","requestId":"req-789","jobId":"test_job","runId":"run-456","alerts":0,"duration":0}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeRealtimeAlerts > debería crear alertas con severidad crítica
{"ts":"2026-02-08T06:25:40.691Z","level":"info","scope":"cron-jobs-maxiconsumo:job:realtime-alerts","message":"JOB_START","requestId":"req-789","jobId":"test_job","runId":"run-456"}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeRealtimeAlerts > debería crear alertas con severidad crítica
{"ts":"2026-02-08T06:25:40.692Z","level":"info","scope":"cron-jobs-maxiconsumo:job:realtime-alerts","message":"CHANGES_DETECTED","requestId":"req-789","jobId":"test_job","runId":"run-456","total":1,"critical":1}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeRealtimeAlerts > debería crear alertas con severidad crítica
{"ts":"2026-02-08T06:25:40.692Z","level":"info","scope":"cron-jobs-maxiconsumo:job:realtime-alerts","message":"JOB_COMPLETE","requestId":"req-789","jobId":"test_job","runId":"run-456","alerts":1,"duration":1}

stderr | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeWeeklyAnalysis > debería retornar error si contexto es inválido
{"ts":"2026-02-08T06:25:40.692Z","level":"error","scope":"cron-jobs-maxiconsumo:job:weekly-analysis","message":"VALIDATION_FAILED","field":"ctx.jobId","reason":"must be a non-empty string"}

stderr | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeWeeklyAnalysis > debería retornar error si supabaseUrl está vacío
{"ts":"2026-02-08T06:25:40.693Z","level":"error","scope":"cron-jobs-maxiconsumo:job:weekly-analysis","message":"VALIDATION_FAILED","field":"supabaseUrl","reason":"must be a valid URL"}

stderr | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeWeeklyAnalysis > debería retornar error si serviceRoleKey está vacío
{"ts":"2026-02-08T06:25:40.693Z","level":"error","scope":"cron-jobs-maxiconsumo:job:weekly-analysis","message":"VALIDATION_FAILED","field":"serviceRoleKey","reason":"must be a non-empty string"}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeWeeklyAnalysis > debería calcular trends correctamente con datos válidos
{"ts":"2026-02-08T06:25:40.695Z","level":"info","scope":"cron-jobs-maxiconsumo:job:weekly-analysis","message":"JOB_START","requestId":"req-789","jobId":"test_job","runId":"run-456"}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeWeeklyAnalysis > debería calcular trends correctamente con datos válidos
{"ts":"2026-02-08T06:25:40.695Z","level":"info","scope":"cron-jobs-maxiconsumo:job:weekly-analysis","message":"TRENDS_CALCULATED","requestId":"req-789","jobId":"test_job","runId":"run-456","trends":{"total_cambios":2,"promedio_cambio":"20.00","alertas_semana":2,"alertas_criticas":1}}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeWeeklyAnalysis > debería calcular trends correctamente con datos válidos
{"ts":"2026-02-08T06:25:40.696Z","level":"info","scope":"cron-jobs-maxiconsumo:job:weekly-analysis","message":"JOB_COMPLETE","requestId":"req-789","jobId":"test_job","runId":"run-456","trends":{"total_cambios":2,"promedio_cambio":"20.00","alertas_semana":2,"alertas_criticas":1},"duration":0}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeWeeklyAnalysis > debería manejar respuestas vacías correctamente
{"ts":"2026-02-08T06:25:40.697Z","level":"info","scope":"cron-jobs-maxiconsumo:job:weekly-analysis","message":"JOB_START","requestId":"req-789","jobId":"test_job","runId":"run-456"}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeWeeklyAnalysis > debería manejar respuestas vacías correctamente
{"ts":"2026-02-08T06:25:40.698Z","level":"info","scope":"cron-jobs-maxiconsumo:job:weekly-analysis","message":"TRENDS_CALCULATED","requestId":"req-789","jobId":"test_job","runId":"run-456","trends":{"total_cambios":0,"promedio_cambio":"0.00","alertas_semana":0,"alertas_criticas":0}}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeWeeklyAnalysis > debería manejar respuestas vacías correctamente
{"ts":"2026-02-08T06:25:40.698Z","level":"info","scope":"cron-jobs-maxiconsumo:job:weekly-analysis","message":"JOB_COMPLETE","requestId":"req-789","jobId":"test_job","runId":"run-456","trends":{"total_cambios":0,"promedio_cambio":"0.00","alertas_semana":0,"alertas_criticas":0},"duration":1}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeWeeklyAnalysis > debería generar recomendación si alertas críticas > 10
{"ts":"2026-02-08T06:25:40.699Z","level":"info","scope":"cron-jobs-maxiconsumo:job:weekly-analysis","message":"JOB_START","requestId":"req-789","jobId":"test_job","runId":"run-456"}

stdout | tests/unit/scraper-matching.test.ts > scraper-maxiconsumo/matching > performAdvancedMatching > omite coincidencias con confianza <= 20
{"ts":"2026-02-08T06:25:40.697Z","level":"info","scope":"scraper-maxiconsumo:matching","message":"MATCHING_COMPLETE","total":0}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeWeeklyAnalysis > debería generar recomendación si alertas críticas > 10
{"ts":"2026-02-08T06:25:40.700Z","level":"info","scope":"cron-jobs-maxiconsumo:job:weekly-analysis","message":"TRENDS_CALCULATED","requestId":"req-789","jobId":"test_job","runId":"run-456","trends":{"total_cambios":0,"promedio_cambio":"0.00","alertas_semana":12,"alertas_criticas":12}}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeWeeklyAnalysis > debería generar recomendación si alertas críticas > 10
{"ts":"2026-02-08T06:25:40.700Z","level":"info","scope":"cron-jobs-maxiconsumo:job:weekly-analysis","message":"JOB_COMPLETE","requestId":"req-789","jobId":"test_job","runId":"run-456","trends":{"total_cambios":0,"promedio_cambio":"0.00","alertas_semana":12,"alertas_criticas":12},"duration":1}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeWeeklyAnalysis > debería generar recomendación si totalChanges > 100
{"ts":"2026-02-08T06:25:40.701Z","level":"info","scope":"cron-jobs-maxiconsumo:job:weekly-analysis","message":"JOB_START","requestId":"req-789","jobId":"test_job","runId":"run-456"}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeWeeklyAnalysis > debería generar recomendación si totalChanges > 100
{"ts":"2026-02-08T06:25:40.701Z","level":"info","scope":"cron-jobs-maxiconsumo:job:weekly-analysis","message":"TRENDS_CALCULATED","requestId":"req-789","jobId":"test_job","runId":"run-456","trends":{"total_cambios":105,"promedio_cambio":"10.00","alertas_semana":0,"alertas_criticas":0}}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeWeeklyAnalysis > debería generar recomendación si totalChanges > 100
{"ts":"2026-02-08T06:25:40.701Z","level":"info","scope":"cron-jobs-maxiconsumo:job:weekly-analysis","message":"JOB_COMPLETE","requestId":"req-789","jobId":"test_job","runId":"run-456","trends":{"total_cambios":105,"promedio_cambio":"10.00","alertas_semana":0,"alertas_criticas":0},"duration":0}

stdout | tests/unit/scraper-matching.test.ts > scraper-maxiconsumo/matching > performAdvancedMatching > hace match por nombre normalizado cuando no hay SKU ni barcode
{"ts":"2026-02-08T06:25:40.701Z","level":"info","scope":"scraper-maxiconsumo:matching","message":"MATCHING_COMPLETE","total":1}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeWeeklyAnalysis > debería guardar métricas en cron_jobs_metrics
{"ts":"2026-02-08T06:25:40.702Z","level":"info","scope":"cron-jobs-maxiconsumo:job:weekly-analysis","message":"JOB_START","requestId":"req-789","jobId":"test_job","runId":"run-456"}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeWeeklyAnalysis > debería guardar métricas en cron_jobs_metrics
{"ts":"2026-02-08T06:25:40.702Z","level":"info","scope":"cron-jobs-maxiconsumo:job:weekly-analysis","message":"TRENDS_CALCULATED","requestId":"req-789","jobId":"test_job","runId":"run-456","trends":{"total_cambios":1,"promedio_cambio":"10.00","alertas_semana":0,"alertas_criticas":0}}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeWeeklyAnalysis > debería guardar métricas en cron_jobs_metrics
{"ts":"2026-02-08T06:25:40.702Z","level":"info","scope":"cron-jobs-maxiconsumo:job:weekly-analysis","message":"JOB_COMPLETE","requestId":"req-789","jobId":"test_job","runId":"run-456","trends":{"total_cambios":1,"promedio_cambio":"10.00","alertas_semana":0,"alertas_criticas":0},"duration":0}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeWeeklyAnalysis > debería manejar excepción durante ejecución
{"ts":"2026-02-08T06:25:40.702Z","level":"info","scope":"cron-jobs-maxiconsumo:job:weekly-analysis","message":"JOB_START","requestId":"req-789","jobId":"test_job","runId":"run-456"}

stderr | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeWeeklyAnalysis > debería manejar excepción durante ejecución
{"ts":"2026-02-08T06:25:40.703Z","level":"error","scope":"cron-jobs-maxiconsumo:job:weekly-analysis","message":"JOB_ERROR","requestId":"req-789","jobId":"test_job","runId":"run-456","error":"Connection refused"}

 ✓ tests/unit/scraper-matching.test.ts (31 tests) 19ms
stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeWeeklyAnalysis > debería calcular productsProcessed como totalChanges
{"ts":"2026-02-08T06:25:40.704Z","level":"info","scope":"cron-jobs-maxiconsumo:job:weekly-analysis","message":"JOB_START","requestId":"req-789","jobId":"test_job","runId":"run-456"}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeWeeklyAnalysis > debería calcular productsProcessed como totalChanges
{"ts":"2026-02-08T06:25:40.704Z","level":"info","scope":"cron-jobs-maxiconsumo:job:weekly-analysis","message":"TRENDS_CALCULATED","requestId":"req-789","jobId":"test_job","runId":"run-456","trends":{"total_cambios":3,"promedio_cambio":"10.00","alertas_semana":0,"alertas_criticas":0}}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeWeeklyAnalysis > debería calcular productsProcessed como totalChanges
{"ts":"2026-02-08T06:25:40.704Z","level":"info","scope":"cron-jobs-maxiconsumo:job:weekly-analysis","message":"JOB_COMPLETE","requestId":"req-789","jobId":"test_job","runId":"run-456","trends":{"total_cambios":3,"promedio_cambio":"10.00","alertas_semana":0,"alertas_criticas":0},"duration":0}

 ✓ tests/unit/cron-jobs-handlers.test.ts (35 tests) 50ms
 ✓ tests/unit/boundary-edge-cases.test.ts (9 tests) 41ms
 ✓ tests/unit/auth-resilient.test.ts (16 tests) 78ms
 ✓ tests/unit/api-reservas-concurrencia.test.ts (4 tests) 39ms
 ✓ tests/unit/shared-response.test.ts (22 tests) 123ms
 ✓ tests/unit/shared-rate-limit.test.ts (22 tests) 23ms
 ✓ tests/unit/scraper-config.test.ts (22 tests) 47ms
 ✓ tests/unit/cron-validators.test.ts (38 tests) 18ms
 ✓ tests/unit/gateway-auth.test.ts (28 tests) 23ms
 ✓ tests/unit/frontend-hooks.test.ts (5 tests) 30ms
 ✓ tests/unit/scraper-anti-detection.test.ts (35 tests) 29ms
 ✓ tests/unit/scraper-cookie-jar.test.ts (20 tests) 53ms
 ✓ tests/unit/api-proveedor-routing.test.ts (17 tests) 17ms
 ✓ tests/unit/shared-errors.test.ts (32 tests) 35ms
 ✓ tests/unit/api-ventas-pos.test.ts (4 tests) 19ms
 ✓ tests/unit/shared-cors.test.ts (21 tests) 70ms
stdout | tests/unit/shared-audit.test.ts > auditLog > should work in dry-run mode without supabase client
{"ts":"2026-02-08T06:25:51.501Z","level":"info","scope":"audit","message":"[AUDIT] precio_actualizado","usuario_id":"user-123","entidad_tipo":"productos","entidad_id":"prod-456","detalles":{"precio_anterior":100,"precio_nuevo":150},"nivel":"info"}

stderr | tests/unit/shared-audit.test.ts > auditLog > should work in dry-run mode without supabase client
{"ts":"2026-02-08T06:25:51.503Z","level":"warn","scope":"audit","message":"Audit log: dry-run mode, no database insert"}

stdout | tests/unit/shared-audit.test.ts > auditLog > should insert audit log with supabase client
{"ts":"2026-02-08T06:25:51.514Z","level":"info","scope":"audit","message":"[AUDIT] stock_ajustado","usuario_id":"user-456","entidad_tipo":"stock_deposito","entidad_id":"stock-789","nivel":"warning"}

stdout | tests/unit/shared-audit.test.ts > auditLog > should return error when database insert fails
{"ts":"2026-02-08T06:25:51.518Z","level":"info","scope":"audit","message":"[AUDIT] producto_eliminado","nivel":"info"}

stderr | tests/unit/shared-audit.test.ts > auditLog > should return error when database insert fails
{"ts":"2026-02-08T06:25:51.519Z","level":"error","scope":"audit","message":"Error inserting audit log","error":{"message":"Database error"}}

stdout | tests/unit/shared-audit.test.ts > auditLog > should handle exceptions gracefully
{"ts":"2026-02-08T06:25:51.519Z","level":"info","scope":"audit","message":"[AUDIT] login_fallido","nivel":"info"}

stderr | tests/unit/shared-audit.test.ts > auditLog > should handle exceptions gracefully
{"ts":"2026-02-08T06:25:51.519Z","level":"error","scope":"audit","message":"Exception in auditLog","error":"Connection failed"}

stdout | tests/unit/shared-audit.test.ts > auditLog > should use default nivel when not specified
{"ts":"2026-02-08T06:25:51.523Z","level":"info","scope":"audit","message":"[AUDIT] producto_creado","nivel":"info"}

stderr | tests/unit/shared-audit.test.ts > queryAuditLogs > should return error when query fails
{"ts":"2026-02-08T06:25:51.532Z","level":"error","scope":"audit","message":"Error querying audit logs","error":{"message":"Query failed"}}

stderr | tests/unit/shared-audit.test.ts > queryAuditLogs > should handle exceptions gracefully
{"ts":"2026-02-08T06:25:51.533Z","level":"error","scope":"audit","message":"Exception in queryAuditLogs","error":"Connection timeout"}

 ✓ tests/unit/shared-audit.test.ts (21 tests) 51ms
 ✓ tests/unit/scraper-parsing.test.ts (34 tests) 32ms
stderr | tests/unit/cron-jobs-execution-log.test.ts > execution-log > writeExecutionLog > debería manejar errores de fetch sin lanzar excepción
{"ts":"2026-02-08T06:25:51.856Z","level":"warn","scope":"cron-jobs-maxiconsumo:execution-log","message":"EXECUTION_LOG_INSERT_FAILED","requestId":"req-789","jobId":"daily_price_update","runId":"run-456","error":"Network error"}

stderr | tests/unit/cron-jobs-execution-log.test.ts > execution-log > writeExecutionLog > debería manejar respuestas no-ok sin lanzar excepción
{"ts":"2026-02-08T06:25:51.859Z","level":"warn","scope":"cron-jobs-maxiconsumo:execution-log","message":"EXECUTION_LOG_INSERT_FAILED","requestId":"req-789","jobId":"daily_price_update","runId":"run-456","status":500,"status_text":"Internal Server Error"}

 ✓ tests/unit/cron-jobs-execution-log.test.ts (17 tests) 61ms
 ✓ tests/unit/scraper-parsing-edge-cases.test.ts (26 tests) 29ms
 ✓ tests/unit/gateway-validation.test.ts (43 tests) 29ms
 ✓ tests/unit/scraper-cache.test.ts (4 tests) 15ms
 ✓ tests/unit/integration-contracts.test.ts (5 tests) 16ms
 ✓ tests/unit/rate-limit-shared.test.ts (14 tests) 23ms
 ✓ tests/unit/cron-notifications.test.ts (10 tests) 9ms
 ✓ tests/unit/api-bitacora.test.ts (3 tests) 25ms
 ✓ tests/unit/api-proveedor-auth.test.ts (17 tests) 16ms
 ✓ tests/unit/shared-circuit-breaker.test.ts (18 tests) 17ms
 ✓ tests/unit/gateway-pagination.test.ts (20 tests) 12ms
 ✓ tests/unit/api-proveedor-read-mode.test.ts (34 tests) 107ms
stdout | tests/unit/cron-jobs-locking.test.ts > cron-jobs-maxiconsumo/orchestrator locking > skips si no se adquiere lock
{"ts":"2026-02-08T06:26:00.496Z","level":"info","scope":"cron-jobs-maxiconsumo:orchestrator","message":"ORCHESTRATOR_EXECUTE_START","requestId":"req-1","jobId":"daily_price_update","runId":"run_1770531960495_h5caq5"}

stderr | tests/unit/cron-jobs-locking.test.ts > cron-jobs-maxiconsumo/orchestrator locking > skips si no se adquiere lock
{"ts":"2026-02-08T06:26:00.500Z","level":"warn","scope":"cron-jobs-maxiconsumo:orchestrator","message":"JOB_LOCKED","requestId":"req-1","jobId":"daily_price_update","runId":"run_1770531960495_h5caq5","lockSeconds":360}

stdout | tests/unit/cron-jobs-locking.test.ts > cron-jobs-maxiconsumo/orchestrator locking > adquiere y libera lock en ejecución exitosa
{"ts":"2026-02-08T06:26:00.514Z","level":"info","scope":"cron-jobs-maxiconsumo:orchestrator","message":"ORCHESTRATOR_EXECUTE_START","requestId":"req-2","jobId":"daily_price_update","runId":"run_1770531960514_xeu6d5"}

stdout | tests/unit/cron-jobs-locking.test.ts > cron-jobs-maxiconsumo/orchestrator locking > fallback: si RPC de lock no existe (404), ejecuta job igualmente
{"ts":"2026-02-08T06:26:00.515Z","level":"info","scope":"cron-jobs-maxiconsumo:orchestrator","message":"ORCHESTRATOR_EXECUTE_START","requestId":"req-3","jobId":"daily_price_update","runId":"run_1770531960515_t2p8nw"}

stderr | tests/unit/cron-jobs-locking.test.ts > cron-jobs-maxiconsumo/orchestrator locking > fallback: si RPC de lock no existe (404), ejecuta job igualmente
{"ts":"2026-02-08T06:26:00.516Z","level":"warn","scope":"cron-jobs-maxiconsumo:orchestrator","message":"JOB_LOCK_RPC_MISSING","jobId":"daily_price_update","owner":"dc2064e6-0c1c-471c-b638-83b730c4bbcd","action":"fallback_no_lock"}

stderr | tests/unit/cron-jobs-locking.test.ts > cron-jobs-maxiconsumo/orchestrator locking > fallback: si RPC de lock no existe (404), ejecuta job igualmente
{"ts":"2026-02-08T06:26:00.516Z","level":"warn","scope":"cron-jobs-maxiconsumo:orchestrator","message":"JOB_LOCK_RELEASE_FAILED","jobId":"daily_price_update","error":"RPC sp_release_job_lock failed: 404 Not Found"}

 ✓ tests/unit/cron-jobs-locking.test.ts (3 tests) 47ms
 ✓ tests/unit/circuit-breaker-shared.test.ts (9 tests) 16ms
 ✓ tests/unit/cron-jobs.test.ts (8 tests) 6ms
 ✓ tests/unit/shared-logger.test.ts (13 tests) 12ms
 ✓ tests/unit/security-gaps.test.ts (6 tests) 7ms
 ✓ tests/unit/cron-health-monitor.test.ts (10 tests) 12ms
 ✓ tests/unit/pedidos-handlers.test.ts (29 tests) 13ms
 ✓ tests/unit/scraper-alertas.test.ts (3 tests) 5ms
 ✓ tests/unit/frontend-utils.test.ts (8 tests) 12ms

 Test Files  44 passed (44)
      Tests  785 passed (785)
   Start at  06:25:38
   Duration  27.99s (transform 2.38s, setup 7.97s, import 3.57s, tests 1.71s, environment 53.96s)

JUNIT report written to /home/eevan/ProyectosIA/aidrive_genspark__review_fase1_fase2_20260208/test-reports/junit.xml
```

## TEST (A5) api-proveedor allowlist + origin

```bash
npm run test:unit -- tests/unit/api-proveedor-auth.test.ts 
```

```

> workspace@1.0.0 test:unit
> vitest run tests/unit tests/unit/api-proveedor-auth.test.ts


 RUN  v4.0.16 /home/eevan/ProyectosIA/aidrive_genspark__review_fase1_fase2_20260208

 ✓ tests/unit/shared-response.test.ts (22 tests) 27ms
stdout | tests/unit/scraper-storage-auth.test.ts > storage key separation runtime > usa readKey para lecturas y writeKey para inserciones/actualizaciones
{"ts":"2026-02-08T06:26:07.708Z","level":"info","scope":"scraper-maxiconsumo:storage","message":"BATCH_INSERT_SUCCESS","requestId":"rw-1","count":1}

 ✓ tests/unit/strategic-high-value.test.ts (27 tests) 129ms
stdout | tests/unit/scraper-storage-auth.test.ts > storage key separation runtime > usa readKey para lecturas y writeKey para inserciones/actualizaciones
{"ts":"2026-02-08T06:26:07.834Z","level":"info","scope":"scraper-maxiconsumo:storage","message":"BATCH_UPDATE_COMPLETE","requestId":"rw-1","count":1}

stdout | tests/unit/scraper-storage-auth.test.ts > storage key separation runtime > usa writeKey también para lecturas cuando readKey=service (modo service)
{"ts":"2026-02-08T06:26:07.840Z","level":"info","scope":"scraper-maxiconsumo:storage","message":"BATCH_INSERT_SUCCESS","requestId":"rw-2","count":1}

 ✓ tests/unit/scraper-storage-auth.test.ts (32 tests) 153ms
 ✓ tests/unit/resilience-gaps.test.ts (5 tests) 95ms
 ✓ tests/unit/auth-resilient.test.ts (16 tests) 50ms
 ✓ tests/unit/api-proveedor-read-mode.test.ts (34 tests) 23ms
 ✓ tests/unit/scraper-cookie-jar.test.ts (20 tests) 68ms
stderr | tests/unit/cron-jobs-execution-log.test.ts > execution-log > writeExecutionLog > debería manejar errores de fetch sin lanzar excepción
{"ts":"2026-02-08T06:26:11.712Z","level":"warn","scope":"cron-jobs-maxiconsumo:execution-log","message":"EXECUTION_LOG_INSERT_FAILED","requestId":"req-789","jobId":"daily_price_update","runId":"run-456","error":"Network error"}

stderr | tests/unit/cron-jobs-execution-log.test.ts > execution-log > writeExecutionLog > debería manejar respuestas no-ok sin lanzar excepción
{"ts":"2026-02-08T06:26:11.715Z","level":"warn","scope":"cron-jobs-maxiconsumo:execution-log","message":"EXECUTION_LOG_INSERT_FAILED","requestId":"req-789","jobId":"daily_price_update","runId":"run-456","status":500,"status_text":"Internal Server Error"}

 ✓ tests/unit/cron-jobs-execution-log.test.ts (17 tests) 34ms
 ✓ tests/unit/shared-cors.test.ts (21 tests) 117ms
 ✓ tests/unit/scraper-config.test.ts (22 tests) 48ms
stdout | tests/unit/shared-audit.test.ts > auditLog > should work in dry-run mode without supabase client
{"ts":"2026-02-08T06:26:12.544Z","level":"info","scope":"audit","message":"[AUDIT] precio_actualizado","usuario_id":"user-123","entidad_tipo":"productos","entidad_id":"prod-456","detalles":{"precio_anterior":100,"precio_nuevo":150},"nivel":"info"}

stderr | tests/unit/shared-audit.test.ts > auditLog > should work in dry-run mode without supabase client
{"ts":"2026-02-08T06:26:12.546Z","level":"warn","scope":"audit","message":"Audit log: dry-run mode, no database insert"}

stdout | tests/unit/shared-audit.test.ts > auditLog > should insert audit log with supabase client
{"ts":"2026-02-08T06:26:12.558Z","level":"info","scope":"audit","message":"[AUDIT] stock_ajustado","usuario_id":"user-456","entidad_tipo":"stock_deposito","entidad_id":"stock-789","nivel":"warning"}

stdout | tests/unit/shared-audit.test.ts > auditLog > should return error when database insert fails
{"ts":"2026-02-08T06:26:12.561Z","level":"info","scope":"audit","message":"[AUDIT] producto_eliminado","nivel":"info"}

stderr | tests/unit/shared-audit.test.ts > auditLog > should return error when database insert fails
{"ts":"2026-02-08T06:26:12.561Z","level":"error","scope":"audit","message":"Error inserting audit log","error":{"message":"Database error"}}

stdout | tests/unit/shared-audit.test.ts > auditLog > should handle exceptions gracefully
{"ts":"2026-02-08T06:26:12.562Z","level":"info","scope":"audit","message":"[AUDIT] login_fallido","nivel":"info"}

stderr | tests/unit/shared-audit.test.ts > auditLog > should handle exceptions gracefully
{"ts":"2026-02-08T06:26:12.562Z","level":"error","scope":"audit","message":"Exception in auditLog","error":"Connection failed"}

stdout | tests/unit/shared-audit.test.ts > auditLog > should use default nivel when not specified
{"ts":"2026-02-08T06:26:12.563Z","level":"info","scope":"audit","message":"[AUDIT] producto_creado","nivel":"info"}

stderr | tests/unit/shared-audit.test.ts > queryAuditLogs > should return error when query fails
{"ts":"2026-02-08T06:26:12.568Z","level":"error","scope":"audit","message":"Error querying audit logs","error":{"message":"Query failed"}}

stderr | tests/unit/shared-audit.test.ts > queryAuditLogs > should handle exceptions gracefully
{"ts":"2026-02-08T06:26:12.571Z","level":"error","scope":"audit","message":"Exception in queryAuditLogs","error":"Connection timeout"}

 ✓ tests/unit/shared-audit.test.ts (21 tests) 49ms
stderr | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeDailyPriceUpdate > debería retornar error si contexto es inválido
{"ts":"2026-02-08T06:26:12.768Z","level":"error","scope":"cron-jobs-maxiconsumo:job:daily-price-update","message":"VALIDATION_FAILED","field":"ctx.jobId","reason":"must be a non-empty string"}

stderr | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeDailyPriceUpdate > debería retornar error si supabaseUrl está vacío
{"ts":"2026-02-08T06:26:12.772Z","level":"error","scope":"cron-jobs-maxiconsumo:job:daily-price-update","message":"VALIDATION_FAILED","field":"supabaseUrl","reason":"must be a valid URL"}

stderr | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeDailyPriceUpdate > debería retornar error si serviceRoleKey está vacío
{"ts":"2026-02-08T06:26:12.773Z","level":"error","scope":"cron-jobs-maxiconsumo:job:daily-price-update","message":"VALIDATION_FAILED","field":"serviceRoleKey","reason":"must be a non-empty string"}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeDailyPriceUpdate > debería procesar correctamente cuando scraper responde OK
{"ts":"2026-02-08T06:26:12.779Z","level":"info","scope":"cron-jobs-maxiconsumo:job:daily-price-update","message":"JOB_START","requestId":"req-789","jobId":"test_job","runId":"run-456"}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeDailyPriceUpdate > debería procesar correctamente cuando scraper responde OK
{"ts":"2026-02-08T06:26:12.793Z","level":"info","scope":"cron-jobs-maxiconsumo:job:daily-price-update","message":"SCRAPING_COMPLETE","requestId":"req-789","jobId":"test_job","runId":"run-456","processed":50,"successful":45}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeDailyPriceUpdate > debería procesar correctamente cuando scraper responde OK
{"ts":"2026-02-08T06:26:12.794Z","level":"info","scope":"cron-jobs-maxiconsumo:job:daily-price-update","message":"JOB_COMPLETE","requestId":"req-789","jobId":"test_job","runId":"run-456","processed":50,"alerts":5,"duration":1}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeDailyPriceUpdate > debería manejar error del scraper
{"ts":"2026-02-08T06:26:12.795Z","level":"info","scope":"cron-jobs-maxiconsumo:job:daily-price-update","message":"JOB_START","requestId":"req-789","jobId":"test_job","runId":"run-456"}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeDailyPriceUpdate > debería manejar error del scraper
{"ts":"2026-02-08T06:26:12.795Z","level":"info","scope":"cron-jobs-maxiconsumo:job:daily-price-update","message":"JOB_COMPLETE","requestId":"req-789","jobId":"test_job","runId":"run-456","processed":0,"alerts":0,"duration":0}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeDailyPriceUpdate > debería manejar excepción durante ejecución
{"ts":"2026-02-08T06:26:12.827Z","level":"info","scope":"cron-jobs-maxiconsumo:job:daily-price-update","message":"JOB_START","requestId":"req-789","jobId":"test_job","runId":"run-456"}

stderr | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeDailyPriceUpdate > debería manejar excepción durante ejecución
{"ts":"2026-02-08T06:26:12.844Z","level":"error","scope":"cron-jobs-maxiconsumo:job:daily-price-update","message":"JOB_ERROR","requestId":"req-789","jobId":"test_job","runId":"run-456","error":"Network failure"}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeDailyPriceUpdate > debería calcular executionTimeMs correctamente
{"ts":"2026-02-08T06:26:12.876Z","level":"info","scope":"cron-jobs-maxiconsumo:job:daily-price-update","message":"JOB_START","requestId":"req-789","jobId":"test_job","runId":"run-456"}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeDailyPriceUpdate > debería calcular executionTimeMs correctamente
{"ts":"2026-02-08T06:26:12.880Z","level":"info","scope":"cron-jobs-maxiconsumo:job:daily-price-update","message":"SCRAPING_COMPLETE","requestId":"req-789","jobId":"test_job","runId":"run-456","processed":10,"successful":10}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeDailyPriceUpdate > debería calcular executionTimeMs correctamente
{"ts":"2026-02-08T06:26:12.881Z","level":"info","scope":"cron-jobs-maxiconsumo:job:daily-price-update","message":"JOB_COMPLETE","requestId":"req-789","jobId":"test_job","runId":"run-456","processed":10,"alerts":0,"duration":4}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeDailyPriceUpdate > debería llamar al endpoint correcto del scraper
{"ts":"2026-02-08T06:26:12.883Z","level":"info","scope":"cron-jobs-maxiconsumo:job:daily-price-update","message":"JOB_START","requestId":"req-789","jobId":"test_job","runId":"run-456"}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeDailyPriceUpdate > debería llamar al endpoint correcto del scraper
{"ts":"2026-02-08T06:26:12.883Z","level":"info","scope":"cron-jobs-maxiconsumo:job:daily-price-update","message":"SCRAPING_COMPLETE","requestId":"req-789","jobId":"test_job","runId":"run-456","processed":0,"successful":0}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeDailyPriceUpdate > debería llamar al endpoint correcto del scraper
{"ts":"2026-02-08T06:26:12.883Z","level":"info","scope":"cron-jobs-maxiconsumo:job:daily-price-update","message":"JOB_COMPLETE","requestId":"req-789","jobId":"test_job","runId":"run-456","processed":0,"alerts":0,"duration":0}

stderr | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeMaintenanceCleanup > debería retornar error si contexto es inválido
{"ts":"2026-02-08T06:26:12.889Z","level":"error","scope":"cron-jobs-maxiconsumo:job:maintenance","message":"VALIDATION_FAILED","field":"ctx.jobId","reason":"must be a non-empty string"}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeMaintenanceCleanup > debería limpiar registros antiguos correctamente
{"ts":"2026-02-08T06:26:12.891Z","level":"info","scope":"cron-jobs-maxiconsumo:job:maintenance","message":"JOB_START","requestId":"req-789","jobId":"test_job","runId":"run-456"}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeMaintenanceCleanup > debería limpiar registros antiguos correctamente
{"ts":"2026-02-08T06:26:12.891Z","level":"info","scope":"cron-jobs-maxiconsumo:job:maintenance","message":"LOGS_CLEANED","requestId":"req-789","jobId":"test_job","runId":"run-456","count":2}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeMaintenanceCleanup > debería limpiar registros antiguos correctamente
{"ts":"2026-02-08T06:26:12.892Z","level":"info","scope":"cron-jobs-maxiconsumo:job:maintenance","message":"JOB_COMPLETE","requestId":"req-789","jobId":"test_job","runId":"run-456","metrics":{"logs_deleted":2,"metrics_deleted":1,"alerts_deleted":0},"duration":1}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeMaintenanceCleanup > debería usar parámetros de retención personalizados
{"ts":"2026-02-08T06:26:12.893Z","level":"info","scope":"cron-jobs-maxiconsumo:job:maintenance","message":"JOB_START","requestId":"req-789","jobId":"test_job","runId":"run-456"}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeMaintenanceCleanup > debería usar parámetros de retención personalizados
{"ts":"2026-02-08T06:26:12.894Z","level":"info","scope":"cron-jobs-maxiconsumo:job:maintenance","message":"LOGS_CLEANED","requestId":"req-789","jobId":"test_job","runId":"run-456","count":0}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeMaintenanceCleanup > debería usar parámetros de retención personalizados
{"ts":"2026-02-08T06:26:12.895Z","level":"info","scope":"cron-jobs-maxiconsumo:job:maintenance","message":"JOB_COMPLETE","requestId":"req-789","jobId":"test_job","runId":"run-456","metrics":{"logs_deleted":0,"metrics_deleted":0,"alerts_deleted":0},"duration":2}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeMaintenanceCleanup > debería recomendar reducir retención si limpia muchos registros
{"ts":"2026-02-08T06:26:12.896Z","level":"info","scope":"cron-jobs-maxiconsumo:job:maintenance","message":"JOB_START","requestId":"req-789","jobId":"test_job","runId":"run-456"}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeMaintenanceCleanup > debería recomendar reducir retención si limpia muchos registros
{"ts":"2026-02-08T06:26:12.897Z","level":"info","scope":"cron-jobs-maxiconsumo:job:maintenance","message":"LOGS_CLEANED","requestId":"req-789","jobId":"test_job","runId":"run-456","count":500}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeMaintenanceCleanup > debería recomendar reducir retención si limpia muchos registros
{"ts":"2026-02-08T06:26:12.900Z","level":"info","scope":"cron-jobs-maxiconsumo:job:maintenance","message":"JOB_COMPLETE","requestId":"req-789","jobId":"test_job","runId":"run-456","metrics":{"logs_deleted":500,"metrics_deleted":400,"alerts_deleted":200},"duration":3}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeMaintenanceCleanup > debería manejar excepción durante ejecución
{"ts":"2026-02-08T06:26:12.901Z","level":"info","scope":"cron-jobs-maxiconsumo:job:maintenance","message":"JOB_START","requestId":"req-789","jobId":"test_job","runId":"run-456"}

stderr | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeMaintenanceCleanup > debería manejar excepción durante ejecución
{"ts":"2026-02-08T06:26:12.902Z","level":"error","scope":"cron-jobs-maxiconsumo:job:maintenance","message":"JOB_ERROR","requestId":"req-789","jobId":"test_job","runId":"run-456","error":"Database error"}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeMaintenanceCleanup > debería usar headers correctos para DELETE
{"ts":"2026-02-08T06:26:12.902Z","level":"info","scope":"cron-jobs-maxiconsumo:job:maintenance","message":"JOB_START","requestId":"req-789","jobId":"test_job","runId":"run-456"}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeMaintenanceCleanup > debería usar headers correctos para DELETE
{"ts":"2026-02-08T06:26:12.903Z","level":"info","scope":"cron-jobs-maxiconsumo:job:maintenance","message":"LOGS_CLEANED","requestId":"req-789","jobId":"test_job","runId":"run-456","count":0}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeMaintenanceCleanup > debería usar headers correctos para DELETE
{"ts":"2026-02-08T06:26:12.903Z","level":"info","scope":"cron-jobs-maxiconsumo:job:maintenance","message":"JOB_COMPLETE","requestId":"req-789","jobId":"test_job","runId":"run-456","metrics":{"logs_deleted":0,"metrics_deleted":0,"alerts_deleted":0},"duration":1}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeMaintenanceCleanup > debería calcular productsProcessed como total limpiado
{"ts":"2026-02-08T06:26:12.903Z","level":"info","scope":"cron-jobs-maxiconsumo:job:maintenance","message":"JOB_START","requestId":"req-789","jobId":"test_job","runId":"run-456"}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeMaintenanceCleanup > debería calcular productsProcessed como total limpiado
{"ts":"2026-02-08T06:26:12.904Z","level":"info","scope":"cron-jobs-maxiconsumo:job:maintenance","message":"LOGS_CLEANED","requestId":"req-789","jobId":"test_job","runId":"run-456","count":3}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeMaintenanceCleanup > debería calcular productsProcessed como total limpiado
{"ts":"2026-02-08T06:26:12.904Z","level":"info","scope":"cron-jobs-maxiconsumo:job:maintenance","message":"JOB_COMPLETE","requestId":"req-789","jobId":"test_job","runId":"run-456","metrics":{"logs_deleted":3,"metrics_deleted":2,"alerts_deleted":1},"duration":1}

stderr | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeRealtimeAlerts > debería retornar error si contexto es inválido
{"ts":"2026-02-08T06:26:12.905Z","level":"error","scope":"cron-jobs-maxiconsumo:job:realtime-alerts","message":"VALIDATION_FAILED","field":"ctx.jobId","reason":"must be a non-empty string"}

stderr | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeRealtimeAlerts > debería retornar error si supabaseUrl está vacío
{"ts":"2026-02-08T06:26:12.907Z","level":"error","scope":"cron-jobs-maxiconsumo:job:realtime-alerts","message":"VALIDATION_FAILED","field":"supabaseUrl","reason":"must be a valid URL"}

stderr | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeRealtimeAlerts > debería retornar error si serviceRoleKey está vacío
{"ts":"2026-02-08T06:26:12.908Z","level":"error","scope":"cron-jobs-maxiconsumo:job:realtime-alerts","message":"VALIDATION_FAILED","field":"serviceRoleKey","reason":"must be a non-empty string"}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeRealtimeAlerts > debería procesar alertas críticas correctamente
{"ts":"2026-02-08T06:26:12.909Z","level":"info","scope":"cron-jobs-maxiconsumo:job:realtime-alerts","message":"JOB_START","requestId":"req-789","jobId":"test_job","runId":"run-456"}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeRealtimeAlerts > debería procesar alertas críticas correctamente
{"ts":"2026-02-08T06:26:12.910Z","level":"info","scope":"cron-jobs-maxiconsumo:job:realtime-alerts","message":"CHANGES_DETECTED","requestId":"req-789","jobId":"test_job","runId":"run-456","total":2,"critical":2}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeRealtimeAlerts > debería procesar alertas críticas correctamente
{"ts":"2026-02-08T06:26:12.911Z","level":"info","scope":"cron-jobs-maxiconsumo:job:realtime-alerts","message":"JOB_COMPLETE","requestId":"req-789","jobId":"test_job","runId":"run-456","alerts":2,"duration":1}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeRealtimeAlerts > debería no generar alertas si cambios están bajo threshold
{"ts":"2026-02-08T06:26:12.912Z","level":"info","scope":"cron-jobs-maxiconsumo:job:realtime-alerts","message":"JOB_START","requestId":"req-789","jobId":"test_job","runId":"run-456"}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeRealtimeAlerts > debería no generar alertas si cambios están bajo threshold
{"ts":"2026-02-08T06:26:12.913Z","level":"info","scope":"cron-jobs-maxiconsumo:job:realtime-alerts","message":"CHANGES_DETECTED","requestId":"req-789","jobId":"test_job","runId":"run-456","total":1,"critical":0}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeRealtimeAlerts > debería no generar alertas si cambios están bajo threshold
{"ts":"2026-02-08T06:26:12.913Z","level":"info","scope":"cron-jobs-maxiconsumo:job:realtime-alerts","message":"JOB_COMPLETE","requestId":"req-789","jobId":"test_job","runId":"run-456","alerts":0,"duration":1}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeRealtimeAlerts > debería usar threshold personalizado de parámetros
{"ts":"2026-02-08T06:26:12.921Z","level":"info","scope":"cron-jobs-maxiconsumo:job:realtime-alerts","message":"JOB_START","requestId":"req-789","jobId":"test_job","runId":"run-456"}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeRealtimeAlerts > debería usar threshold personalizado de parámetros
{"ts":"2026-02-08T06:26:12.921Z","level":"info","scope":"cron-jobs-maxiconsumo:job:realtime-alerts","message":"CHANGES_DETECTED","requestId":"req-789","jobId":"test_job","runId":"run-456","total":1,"critical":1}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeRealtimeAlerts > debería usar threshold personalizado de parámetros
{"ts":"2026-02-08T06:26:12.922Z","level":"info","scope":"cron-jobs-maxiconsumo:job:realtime-alerts","message":"JOB_COMPLETE","requestId":"req-789","jobId":"test_job","runId":"run-456","alerts":1,"duration":1}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeRealtimeAlerts > debería manejar excepción durante ejecución
{"ts":"2026-02-08T06:26:12.922Z","level":"info","scope":"cron-jobs-maxiconsumo:job:realtime-alerts","message":"JOB_START","requestId":"req-789","jobId":"test_job","runId":"run-456"}

stderr | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeRealtimeAlerts > debería manejar excepción durante ejecución
{"ts":"2026-02-08T06:26:12.922Z","level":"error","scope":"cron-jobs-maxiconsumo:job:realtime-alerts","message":"JOB_ERROR","requestId":"req-789","jobId":"test_job","runId":"run-456","error":"Database timeout"}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeRealtimeAlerts > debería calcular executionTimeMs correctamente
{"ts":"2026-02-08T06:26:12.923Z","level":"info","scope":"cron-jobs-maxiconsumo:job:realtime-alerts","message":"JOB_START","requestId":"req-789","jobId":"test_job","runId":"run-456"}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeRealtimeAlerts > debería calcular executionTimeMs correctamente
{"ts":"2026-02-08T06:26:12.923Z","level":"info","scope":"cron-jobs-maxiconsumo:job:realtime-alerts","message":"CHANGES_DETECTED","requestId":"req-789","jobId":"test_job","runId":"run-456","total":0,"critical":0}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeRealtimeAlerts > debería calcular executionTimeMs correctamente
{"ts":"2026-02-08T06:26:12.923Z","level":"info","scope":"cron-jobs-maxiconsumo:job:realtime-alerts","message":"JOB_COMPLETE","requestId":"req-789","jobId":"test_job","runId":"run-456","alerts":0,"duration":0}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeRealtimeAlerts > debería consultar precios de los últimos 15 minutos
{"ts":"2026-02-08T06:26:12.923Z","level":"info","scope":"cron-jobs-maxiconsumo:job:realtime-alerts","message":"JOB_START","requestId":"req-789","jobId":"test_job","runId":"run-456"}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeRealtimeAlerts > debería consultar precios de los últimos 15 minutos
{"ts":"2026-02-08T06:26:12.924Z","level":"info","scope":"cron-jobs-maxiconsumo:job:realtime-alerts","message":"CHANGES_DETECTED","requestId":"req-789","jobId":"test_job","runId":"run-456","total":0,"critical":0}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeRealtimeAlerts > debería consultar precios de los últimos 15 minutos
{"ts":"2026-02-08T06:26:12.924Z","level":"info","scope":"cron-jobs-maxiconsumo:job:realtime-alerts","message":"JOB_COMPLETE","requestId":"req-789","jobId":"test_job","runId":"run-456","alerts":0,"duration":1}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeRealtimeAlerts > debería crear alertas con severidad crítica
{"ts":"2026-02-08T06:26:12.924Z","level":"info","scope":"cron-jobs-maxiconsumo:job:realtime-alerts","message":"JOB_START","requestId":"req-789","jobId":"test_job","runId":"run-456"}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeRealtimeAlerts > debería crear alertas con severidad crítica
{"ts":"2026-02-08T06:26:12.924Z","level":"info","scope":"cron-jobs-maxiconsumo:job:realtime-alerts","message":"CHANGES_DETECTED","requestId":"req-789","jobId":"test_job","runId":"run-456","total":1,"critical":1}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeRealtimeAlerts > debería crear alertas con severidad crítica
{"ts":"2026-02-08T06:26:12.924Z","level":"info","scope":"cron-jobs-maxiconsumo:job:realtime-alerts","message":"JOB_COMPLETE","requestId":"req-789","jobId":"test_job","runId":"run-456","alerts":1,"duration":0}

stderr | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeWeeklyAnalysis > debería retornar error si contexto es inválido
{"ts":"2026-02-08T06:26:12.925Z","level":"error","scope":"cron-jobs-maxiconsumo:job:weekly-analysis","message":"VALIDATION_FAILED","field":"ctx.jobId","reason":"must be a non-empty string"}

stderr | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeWeeklyAnalysis > debería retornar error si supabaseUrl está vacío
{"ts":"2026-02-08T06:26:12.928Z","level":"error","scope":"cron-jobs-maxiconsumo:job:weekly-analysis","message":"VALIDATION_FAILED","field":"supabaseUrl","reason":"must be a valid URL"}

stderr | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeWeeklyAnalysis > debería retornar error si serviceRoleKey está vacío
{"ts":"2026-02-08T06:26:12.929Z","level":"error","scope":"cron-jobs-maxiconsumo:job:weekly-analysis","message":"VALIDATION_FAILED","field":"serviceRoleKey","reason":"must be a non-empty string"}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeWeeklyAnalysis > debería calcular trends correctamente con datos válidos
{"ts":"2026-02-08T06:26:12.930Z","level":"info","scope":"cron-jobs-maxiconsumo:job:weekly-analysis","message":"JOB_START","requestId":"req-789","jobId":"test_job","runId":"run-456"}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeWeeklyAnalysis > debería calcular trends correctamente con datos válidos
{"ts":"2026-02-08T06:26:12.931Z","level":"info","scope":"cron-jobs-maxiconsumo:job:weekly-analysis","message":"TRENDS_CALCULATED","requestId":"req-789","jobId":"test_job","runId":"run-456","trends":{"total_cambios":2,"promedio_cambio":"20.00","alertas_semana":2,"alertas_criticas":1}}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeWeeklyAnalysis > debería calcular trends correctamente con datos válidos
{"ts":"2026-02-08T06:26:12.931Z","level":"info","scope":"cron-jobs-maxiconsumo:job:weekly-analysis","message":"JOB_COMPLETE","requestId":"req-789","jobId":"test_job","runId":"run-456","trends":{"total_cambios":2,"promedio_cambio":"20.00","alertas_semana":2,"alertas_criticas":1},"duration":1}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeWeeklyAnalysis > debería manejar respuestas vacías correctamente
{"ts":"2026-02-08T06:26:12.932Z","level":"info","scope":"cron-jobs-maxiconsumo:job:weekly-analysis","message":"JOB_START","requestId":"req-789","jobId":"test_job","runId":"run-456"}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeWeeklyAnalysis > debería manejar respuestas vacías correctamente
{"ts":"2026-02-08T06:26:12.932Z","level":"info","scope":"cron-jobs-maxiconsumo:job:weekly-analysis","message":"TRENDS_CALCULATED","requestId":"req-789","jobId":"test_job","runId":"run-456","trends":{"total_cambios":0,"promedio_cambio":"0.00","alertas_semana":0,"alertas_criticas":0}}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeWeeklyAnalysis > debería manejar respuestas vacías correctamente
{"ts":"2026-02-08T06:26:12.932Z","level":"info","scope":"cron-jobs-maxiconsumo:job:weekly-analysis","message":"JOB_COMPLETE","requestId":"req-789","jobId":"test_job","runId":"run-456","trends":{"total_cambios":0,"promedio_cambio":"0.00","alertas_semana":0,"alertas_criticas":0},"duration":0}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeWeeklyAnalysis > debería generar recomendación si alertas críticas > 10
{"ts":"2026-02-08T06:26:12.933Z","level":"info","scope":"cron-jobs-maxiconsumo:job:weekly-analysis","message":"JOB_START","requestId":"req-789","jobId":"test_job","runId":"run-456"}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeWeeklyAnalysis > debería generar recomendación si alertas críticas > 10
{"ts":"2026-02-08T06:26:12.933Z","level":"info","scope":"cron-jobs-maxiconsumo:job:weekly-analysis","message":"TRENDS_CALCULATED","requestId":"req-789","jobId":"test_job","runId":"run-456","trends":{"total_cambios":0,"promedio_cambio":"0.00","alertas_semana":12,"alertas_criticas":12}}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeWeeklyAnalysis > debería generar recomendación si alertas críticas > 10
{"ts":"2026-02-08T06:26:12.933Z","level":"info","scope":"cron-jobs-maxiconsumo:job:weekly-analysis","message":"JOB_COMPLETE","requestId":"req-789","jobId":"test_job","runId":"run-456","trends":{"total_cambios":0,"promedio_cambio":"0.00","alertas_semana":12,"alertas_criticas":12},"duration":0}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeWeeklyAnalysis > debería generar recomendación si totalChanges > 100
{"ts":"2026-02-08T06:26:12.933Z","level":"info","scope":"cron-jobs-maxiconsumo:job:weekly-analysis","message":"JOB_START","requestId":"req-789","jobId":"test_job","runId":"run-456"}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeWeeklyAnalysis > debería generar recomendación si totalChanges > 100
{"ts":"2026-02-08T06:26:12.934Z","level":"info","scope":"cron-jobs-maxiconsumo:job:weekly-analysis","message":"TRENDS_CALCULATED","requestId":"req-789","jobId":"test_job","runId":"run-456","trends":{"total_cambios":105,"promedio_cambio":"10.00","alertas_semana":0,"alertas_criticas":0}}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeWeeklyAnalysis > debería generar recomendación si totalChanges > 100
{"ts":"2026-02-08T06:26:12.934Z","level":"info","scope":"cron-jobs-maxiconsumo:job:weekly-analysis","message":"JOB_COMPLETE","requestId":"req-789","jobId":"test_job","runId":"run-456","trends":{"total_cambios":105,"promedio_cambio":"10.00","alertas_semana":0,"alertas_criticas":0},"duration":1}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeWeeklyAnalysis > debería guardar métricas en cron_jobs_metrics
{"ts":"2026-02-08T06:26:12.934Z","level":"info","scope":"cron-jobs-maxiconsumo:job:weekly-analysis","message":"JOB_START","requestId":"req-789","jobId":"test_job","runId":"run-456"}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeWeeklyAnalysis > debería guardar métricas en cron_jobs_metrics
{"ts":"2026-02-08T06:26:12.934Z","level":"info","scope":"cron-jobs-maxiconsumo:job:weekly-analysis","message":"TRENDS_CALCULATED","requestId":"req-789","jobId":"test_job","runId":"run-456","trends":{"total_cambios":1,"promedio_cambio":"10.00","alertas_semana":0,"alertas_criticas":0}}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeWeeklyAnalysis > debería guardar métricas en cron_jobs_metrics
{"ts":"2026-02-08T06:26:12.935Z","level":"info","scope":"cron-jobs-maxiconsumo:job:weekly-analysis","message":"JOB_COMPLETE","requestId":"req-789","jobId":"test_job","runId":"run-456","trends":{"total_cambios":1,"promedio_cambio":"10.00","alertas_semana":0,"alertas_criticas":0},"duration":0}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeWeeklyAnalysis > debería manejar excepción durante ejecución
{"ts":"2026-02-08T06:26:12.935Z","level":"info","scope":"cron-jobs-maxiconsumo:job:weekly-analysis","message":"JOB_START","requestId":"req-789","jobId":"test_job","runId":"run-456"}

stderr | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeWeeklyAnalysis > debería manejar excepción durante ejecución
{"ts":"2026-02-08T06:26:12.935Z","level":"error","scope":"cron-jobs-maxiconsumo:job:weekly-analysis","message":"JOB_ERROR","requestId":"req-789","jobId":"test_job","runId":"run-456","error":"Connection refused"}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeWeeklyAnalysis > debería calcular productsProcessed como totalChanges
{"ts":"2026-02-08T06:26:12.935Z","level":"info","scope":"cron-jobs-maxiconsumo:job:weekly-analysis","message":"JOB_START","requestId":"req-789","jobId":"test_job","runId":"run-456"}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeWeeklyAnalysis > debería calcular productsProcessed como totalChanges
{"ts":"2026-02-08T06:26:12.936Z","level":"info","scope":"cron-jobs-maxiconsumo:job:weekly-analysis","message":"TRENDS_CALCULATED","requestId":"req-789","jobId":"test_job","runId":"run-456","trends":{"total_cambios":3,"promedio_cambio":"10.00","alertas_semana":0,"alertas_criticas":0}}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeWeeklyAnalysis > debería calcular productsProcessed como totalChanges
{"ts":"2026-02-08T06:26:12.937Z","level":"info","scope":"cron-jobs-maxiconsumo:job:weekly-analysis","message":"JOB_COMPLETE","requestId":"req-789","jobId":"test_job","runId":"run-456","trends":{"total_cambios":3,"promedio_cambio":"10.00","alertas_semana":0,"alertas_criticas":0},"duration":1}

 ✓ tests/unit/cron-jobs-handlers.test.ts (35 tests) 189ms
stdout | tests/unit/cron-jobs-locking.test.ts > cron-jobs-maxiconsumo/orchestrator locking > skips si no se adquiere lock
{"ts":"2026-02-08T06:26:15.361Z","level":"info","scope":"cron-jobs-maxiconsumo:orchestrator","message":"ORCHESTRATOR_EXECUTE_START","requestId":"req-1","jobId":"daily_price_update","runId":"run_1770531975361_6uieud"}

stderr | tests/unit/cron-jobs-locking.test.ts > cron-jobs-maxiconsumo/orchestrator locking > skips si no se adquiere lock
{"ts":"2026-02-08T06:26:15.365Z","level":"warn","scope":"cron-jobs-maxiconsumo:orchestrator","message":"JOB_LOCKED","requestId":"req-1","jobId":"daily_price_update","runId":"run_1770531975361_6uieud","lockSeconds":360}

stdout | tests/unit/cron-jobs-locking.test.ts > cron-jobs-maxiconsumo/orchestrator locking > adquiere y libera lock en ejecución exitosa
{"ts":"2026-02-08T06:26:15.373Z","level":"info","scope":"cron-jobs-maxiconsumo:orchestrator","message":"ORCHESTRATOR_EXECUTE_START","requestId":"req-2","jobId":"daily_price_update","runId":"run_1770531975373_c8slc9"}

stdout | tests/unit/cron-jobs-locking.test.ts > cron-jobs-maxiconsumo/orchestrator locking > fallback: si RPC de lock no existe (404), ejecuta job igualmente
{"ts":"2026-02-08T06:26:15.375Z","level":"info","scope":"cron-jobs-maxiconsumo:orchestrator","message":"ORCHESTRATOR_EXECUTE_START","requestId":"req-3","jobId":"daily_price_update","runId":"run_1770531975375_h29w4k"}

stderr | tests/unit/cron-jobs-locking.test.ts > cron-jobs-maxiconsumo/orchestrator locking > fallback: si RPC de lock no existe (404), ejecuta job igualmente
{"ts":"2026-02-08T06:26:15.375Z","level":"warn","scope":"cron-jobs-maxiconsumo:orchestrator","message":"JOB_LOCK_RPC_MISSING","jobId":"daily_price_update","owner":"329f59ba-757c-4d08-b086-8b4425741cde","action":"fallback_no_lock"}

stderr | tests/unit/cron-jobs-locking.test.ts > cron-jobs-maxiconsumo/orchestrator locking > fallback: si RPC de lock no existe (404), ejecuta job igualmente
{"ts":"2026-02-08T06:26:15.376Z","level":"warn","scope":"cron-jobs-maxiconsumo:orchestrator","message":"JOB_LOCK_RELEASE_FAILED","jobId":"daily_price_update","error":"RPC sp_release_job_lock failed: 404 Not Found"}

 ✓ tests/unit/cron-jobs-locking.test.ts (3 tests) 18ms
 ✓ tests/unit/boundary-edge-cases.test.ts (9 tests) 78ms
 ✓ tests/unit/api-reservas-concurrencia.test.ts (4 tests) 26ms
 ✓ tests/unit/shared-errors.test.ts (32 tests) 24ms
 ✓ tests/unit/scraper-parsing.test.ts (34 tests) 22ms
 ✓ tests/unit/api-ofertas.test.ts (5 tests) 15ms
 ✓ tests/unit/frontend-hooks.test.ts (5 tests) 19ms
 ✓ tests/unit/scraper-anti-detection.test.ts (35 tests) 18ms
 ✓ tests/unit/scraper-parsing-edge-cases.test.ts (26 tests) 34ms
 ✓ tests/unit/gateway-validation.test.ts (43 tests) 16ms
 ✓ tests/unit/api-bitacora.test.ts (3 tests) 19ms
 ✓ tests/unit/shared-rate-limit.test.ts (22 tests) 18ms
 ✓ tests/unit/rate-limit-shared.test.ts (14 tests) 21ms
 ✓ tests/unit/gateway-auth.test.ts (28 tests) 31ms
 ✓ tests/unit/api-ventas-pos.test.ts (4 tests) 22ms
stdout | tests/unit/scraper-matching.test.ts > scraper-maxiconsumo/matching > performAdvancedMatching > omite coincidencias con confianza <= 20
{"ts":"2026-02-08T06:26:23.361Z","level":"info","scope":"scraper-maxiconsumo:matching","message":"MATCHING_COMPLETE","total":0}

stdout | tests/unit/scraper-matching.test.ts > scraper-maxiconsumo/matching > performAdvancedMatching > hace match por nombre normalizado cuando no hay SKU ni barcode
{"ts":"2026-02-08T06:26:23.366Z","level":"info","scope":"scraper-maxiconsumo:matching","message":"MATCHING_COMPLETE","total":1}

 ✓ tests/unit/scraper-matching.test.ts (31 tests) 18ms
 ✓ tests/unit/cron-validators.test.ts (38 tests) 17ms
 ✓ tests/unit/shared-circuit-breaker.test.ts (18 tests) 20ms
 ✓ tests/unit/api-proveedor-routing.test.ts (17 tests) 19ms
 ✓ tests/unit/circuit-breaker-shared.test.ts (9 tests) 15ms
 ✓ tests/unit/integration-contracts.test.ts (5 tests) 12ms
 ✓ tests/unit/api-proveedor-auth.test.ts (17 tests) 15ms
 ✓ tests/unit/scraper-cache.test.ts (4 tests) 10ms
 ✓ tests/unit/pedidos-handlers.test.ts (29 tests) 19ms
 ✓ tests/unit/gateway-pagination.test.ts (20 tests) 9ms
 ✓ tests/unit/cron-health-monitor.test.ts (10 tests) 14ms
 ✓ tests/unit/shared-logger.test.ts (13 tests) 16ms
 ✓ tests/unit/frontend-utils.test.ts (8 tests) 25ms
 ✓ tests/unit/cron-notifications.test.ts (10 tests) 5ms
 ✓ tests/unit/security-gaps.test.ts (6 tests) 10ms
 ✓ tests/unit/cron-jobs.test.ts (8 tests) 7ms
 ✓ tests/unit/scraper-alertas.test.ts (3 tests) 3ms

 Test Files  44 passed (44)
      Tests  785 passed (785)
   Start at  06:26:06
   Duration  24.84s (transform 2.63s, setup 6.93s, import 3.62s, tests 1.60s, environment 46.83s)

JUNIT report written to /home/eevan/ProyectosIA/aidrive_genspark__review_fase1_fase2_20260208/test-reports/junit.xml
```

## WORKTREE DIFF (post-adjustments)

```bash
bash -lc git\ diff\ --\ supabase/functions/api-minimarket/index.ts\ supabase/functions/_shared/circuit-breaker.ts\ supabase/functions/api-proveedor/index.ts 
```

```
diff --git a/supabase/functions/_shared/circuit-breaker.ts b/supabase/functions/_shared/circuit-breaker.ts
index 7bb0edb..001b98d 100644
--- a/supabase/functions/_shared/circuit-breaker.ts
+++ b/supabase/functions/_shared/circuit-breaker.ts
@@ -180,6 +180,68 @@ export async function recordCircuitBreakerEvent(
   }
 }
 
+/**
+ * Check circuit breaker state using shared RPC (cross-instance).
+ * Falls back to the in-memory breaker if RPC is not available.
+ */
+export async function checkCircuitBreakerShared(
+  key: string,
+  serviceRoleKey: string,
+  supabaseUrl: string,
+  fallbackBreaker: CircuitBreaker,
+  options: Partial<CircuitBreakerOptions> = {},
+): Promise<{ state: CircuitState; allows: boolean; failures: number }> {
+  if (cbRpcAvailable === false) {
+    const stats = fallbackBreaker.getStats();
+    return { state: stats.state, allows: stats.state !== 'open', failures: stats.failures };
+  }
+
+  try {
+    const opts = { ...DEFAULT_OPTIONS, ...options };
+    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/sp_circuit_breaker_check`, {
+      method: 'POST',
+      headers: {
+        'Content-Type': 'application/json',
+        apikey: serviceRoleKey,
+        Authorization: `Bearer ${serviceRoleKey}`,
+      },
+      body: JSON.stringify({
+        p_key: key,
+        p_open_timeout_seconds: Math.ceil(opts.openTimeoutMs / 1000),
+      }),
+    });
+
+    if (response.status === 404) {
+      cbRpcAvailable = false;
+      const stats = fallbackBreaker.getStats();
+      return { state: stats.state, allows: stats.state !== 'open', failures: stats.failures };
+    }
+
+    if (!response.ok) {
+      const stats = fallbackBreaker.getStats();
+      return { state: stats.state, allows: stats.state !== 'open', failures: stats.failures };
+    }
+
+    cbRpcAvailable = true;
+    const rows = await response.json();
+    const row = Array.isArray(rows) ? rows[0] : rows;
+
+    if (!row) {
+      const stats = fallbackBreaker.getStats();
+      return { state: stats.state, allows: stats.state !== 'open', failures: stats.failures };
+    }
+
+    return {
+      state: row.current_state as CircuitState,
+      allows: row.allows_request,
+      failures: Number(row.failures) || 0,
+    };
+  } catch {
+    const stats = fallbackBreaker.getStats();
+    return { state: stats.state, allows: stats.state !== 'open', failures: stats.failures };
+  }
+}
+
 // Exported for testing
 export function _resetCbRpcAvailability(): void {
   cbRpcAvailable = undefined;
diff --git a/supabase/functions/api-minimarket/index.ts b/supabase/functions/api-minimarket/index.ts
index 77cbf29..1c72f45 100644
--- a/supabase/functions/api-minimarket/index.ts
+++ b/supabase/functions/api-minimarket/index.ts
@@ -21,7 +21,7 @@ import {
   isAppError,
 } from '../_shared/errors.ts';
 import { FixedWindowRateLimiter, withRateLimitHeaders, buildRateLimitKey, checkRateLimitShared } from '../_shared/rate-limit.ts';
-import { getCircuitBreaker } from '../_shared/circuit-breaker.ts';
+import { getCircuitBreaker, checkCircuitBreakerShared, recordCircuitBreakerEvent } from '../_shared/circuit-breaker.ts';
 import { auditLog, extractAuditContext } from '../_shared/audit.ts';
 
 // Import modular helpers
@@ -111,11 +111,13 @@ const FUNCTION_BASE_PATH = '/api-minimarket';
 const rateLimiter = new FixedWindowRateLimiter(60, 60_000);
 
 // Circuit breaker for external service calls
-const circuitBreaker = getCircuitBreaker('api-minimarket-db', {
+const CIRCUIT_BREAKER_KEY = 'api-minimarket-db';
+const CIRCUIT_BREAKER_OPTIONS = {
   failureThreshold: 5,
   successThreshold: 2,
   openTimeoutMs: 30_000,
-});
+} as const;
+const circuitBreaker = getCircuitBreaker(CIRCUIT_BREAKER_KEY, CIRCUIT_BREAKER_OPTIONS);
 
 // ============================================================================
 // HELPER FUNCTIONS
@@ -201,41 +203,6 @@ Deno.serve(async (req) => {
     return preflightResponse;
   }
 
-  // ========================================================================
-  // RATE LIMITING (shared cross-instance via RPC, fallback in-memory)
-  // Key: user:{uid}:ip:{ip} > user:{uid} > ip:{ip}
-  // ========================================================================
-  // Rate limit key is built AFTER auth, so we need to defer it.
-  // For now use IP-only key; after auth, we'll refine if user is known.
-  const preAuthRateLimitKey = buildRateLimitKey(null, clientIp);
-  const { result: rateLimitResult, headers: rateLimitHeaders } = rateLimiter.checkWithHeaders(preAuthRateLimitKey);
-  responseHeaders = withRateLimitHeaders(responseHeaders, rateLimitResult, rateLimiter.getLimit());
-
-  if (!rateLimitResult.allowed) {
-    logger.warn('RATE_LIMIT_EXCEEDED', { requestId, clientIp });
-    return fail(
-      'RATE_LIMIT_EXCEEDED',
-      'Too many requests. Please try again later.',
-      429,
-      responseHeaders,
-      { requestId },
-    );
-  }
-
-  // ========================================================================
-  // CIRCUIT BREAKER CHECK
-  // ========================================================================
-  if (!circuitBreaker.allowRequest()) {
-    logger.warn('CIRCUIT_BREAKER_OPEN', { requestId, state: circuitBreaker.getState() });
-    return fail(
-      'SERVICE_UNAVAILABLE',
-      'Service temporarily unavailable. Please try again later.',
-      503,
-      responseHeaders,
-      { requestId },
-    );
-  }
-
   const url = new URL(req.url);
   const path = normalizePathname(url.pathname);
   const method = req.method;
@@ -247,12 +214,18 @@ Deno.serve(async (req) => {
     timestamp: new Date().toISOString(),
   };
 
+  // Keep these in the outer scope so catch{} can make breaker decisions safely.
+  let supabaseUrl: string | undefined;
+  let supabaseAnonKey: string | undefined;
+  let serviceRoleKey: string | undefined;
+
   try {
     // ======================================================================
     // CONFIGURATION CHECK
     // ======================================================================
-    const supabaseUrl = Deno.env.get('SUPABASE_URL');
-    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
+    supabaseUrl = Deno.env.get('SUPABASE_URL') || undefined;
+    supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || undefined;
+    serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || undefined;
 
     if (!supabaseUrl || !supabaseAnonKey) {
       throw toAppError(
@@ -262,6 +235,37 @@ Deno.serve(async (req) => {
       );
     }
 
+    // ======================================================================
+    // CIRCUIT BREAKER CHECK (semi-persistent via RPC, fallback in-memory)
+    // ======================================================================
+    const breakerStatus = serviceRoleKey
+      ? await checkCircuitBreakerShared(
+        CIRCUIT_BREAKER_KEY,
+        serviceRoleKey,
+        supabaseUrl,
+        circuitBreaker,
+        CIRCUIT_BREAKER_OPTIONS,
+      )
+      : (() => {
+        const stats = circuitBreaker.getStats();
+        return { state: stats.state, allows: stats.state !== 'open', failures: stats.failures };
+      })();
+
+    // Avoid an extra RPC call on every successful request when breaker is healthy.
+    const shouldRecordCircuitSuccess =
+      Boolean(serviceRoleKey) && (breakerStatus.state !== 'closed' || breakerStatus.failures > 0);
+
+    if (!breakerStatus.allows) {
+      logger.warn('CIRCUIT_BREAKER_OPEN', { requestId, state: breakerStatus.state });
+      return fail(
+        'SERVICE_UNAVAILABLE',
+        'Service temporarily unavailable. Please try again later.',
+        503,
+        responseHeaders,
+        { requestId },
+      );
+    }
+
     // ======================================================================
     // AUTHENTICATION - Using user JWT, NOT service role
     // ======================================================================
@@ -279,6 +283,29 @@ Deno.serve(async (req) => {
       }
     }
 
+    // ======================================================================
+    // RATE LIMITING (shared cross-instance via RPC, fallback in-memory)
+    // Key: user:{uid}:ip:{ip} > user:{uid} > ip:{ip}
+    // ======================================================================
+    const rateLimitKey = buildRateLimitKey(user?.id, clientIp);
+    const limit = rateLimiter.getLimit();
+    const rateLimitResult = serviceRoleKey
+      ? await checkRateLimitShared(rateLimitKey, limit, 60, serviceRoleKey, supabaseUrl, rateLimiter)
+      : rateLimiter.check(rateLimitKey);
+
+    responseHeaders = withRateLimitHeaders(responseHeaders, rateLimitResult, limit);
+
+    if (!rateLimitResult.allowed) {
+      logger.warn('RATE_LIMIT_EXCEEDED', { requestId, clientIp, key: rateLimitKey });
+      return fail(
+        'RATE_LIMIT_EXCEEDED',
+        'Too many requests. Please try again later.',
+        429,
+        responseHeaders,
+        { requestId },
+      );
+    }
+
     // Helper: Check role (throws if unauthorized)
     const checkRole = (allowedRoles: readonly string[]) => {
       requireRole(user, allowedRoles);
@@ -292,12 +319,30 @@ Deno.serve(async (req) => {
     const requestHeaders = (extraHeaders: Record<string, string> = {}) =>
       createRequestHeaders(token, supabaseAnonKey, requestId, extraHeaders);
 
+    const recordCircuitSuccess = () => {
+      if (shouldRecordCircuitSuccess && serviceRoleKey) {
+        void recordCircuitBreakerEvent(
+          CIRCUIT_BREAKER_KEY,
+          'success',
+          serviceRoleKey,
+          supabaseUrl,
+          circuitBreaker,
+          CIRCUIT_BREAKER_OPTIONS,
+        ).catch(() => {
+          // Best-effort: don't break request flow if RPC is unavailable/transiently failing.
+        });
+        return;
+      }
+
+      circuitBreaker.recordSuccess();
+    };
+
     const respondOk = <T>(
       data: T,
       status = 200,
       options: { message?: string; extra?: Record<string, unknown> } = {},
     ) => {
-      circuitBreaker.recordSuccess();
+      recordCircuitSuccess();
       return ok(data, status, responseHeaders, { requestId, ...options });
     };
 
@@ -334,7 +379,6 @@ Deno.serve(async (req) => {
 
     // Helper: Create Supabase client for audit logging (uses service role)
     const createAuditClient = async () => {
-      const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
       if (!serviceRoleKey) {
         logger.warn('AUDIT: No service role key available for audit logging');
         return null;
@@ -383,7 +427,7 @@ Deno.serve(async (req) => {
       const limitParam = url.searchParams.get('limit');
       const limit = limitParam ? Math.min(Math.max(parseInt(limitParam, 10) || 10, 1), 20) : 10;
 
-      return await handleGlobalSearch(
+      const res = await handleGlobalSearch(
         supabaseUrl,
         requestHeaders(),
         responseHeaders,
@@ -391,6 +435,8 @@ Deno.serve(async (req) => {
         q.trim(),
         limit
       );
+      recordCircuitSuccess();
+      return res;
     }
 
     // ====================================================================
@@ -400,13 +446,17 @@ Deno.serve(async (req) => {
     // GET /productos/dropdown (Autenticado)
     if (path === '/productos/dropdown' && method === 'GET') {
       checkRole(BASE_ROLES);
-      return await getProductosDropdown(supabaseUrl, requestHeaders(), responseHeaders, requestId);
+      const res = await getProductosDropdown(supabaseUrl, requestHeaders(), responseHeaders, requestId);
+      recordCircuitSuccess();
+      return res;
     }
 
     // GET /proveedores/dropdown (Autenticado)
     if (path === '/proveedores/dropdown' && method === 'GET') {
       checkRole(BASE_ROLES);
-      return await getProveedoresDropdown(supabaseUrl, requestHeaders(), responseHeaders, requestId);
+      const res = await getProveedoresDropdown(supabaseUrl, requestHeaders(), responseHeaders, requestId);
+      recordCircuitSuccess();
+      return res;
     }
 
     // ====================================================================
@@ -1647,57 +1697,63 @@ Deno.serve(async (req) => {
     // ====================================================================
 
     // 24. GET /pedidos - Listar pedidos con filtros
-    if (path === '/pedidos' && method === 'GET') {
-      checkRole(BASE_ROLES);
+	    if (path === '/pedidos' && method === 'GET') {
+	      checkRole(BASE_ROLES);
 
       const pagination = getPaginationOrFail(50, 100);
       if (pagination instanceof Response) return pagination;
 
-      return await handleListarPedidos(
-        supabaseUrl,
-        requestHeaders(),
-        responseHeaders,
-        requestId,
-        {
-          estado: url.searchParams.get('estado') || undefined,
-          estado_pago: url.searchParams.get('estado_pago') || undefined,
-          fecha_desde: url.searchParams.get('fecha_desde') || undefined,
-          fecha_hasta: url.searchParams.get('fecha_hasta') || undefined,
-          limit: pagination.limit,
-          offset: pagination.offset,
-        }
-      );
-    }
+	      const res = await handleListarPedidos(
+	        supabaseUrl,
+	        requestHeaders(),
+	        responseHeaders,
+	        requestId,
+	        {
+	          estado: url.searchParams.get('estado') || undefined,
+	          estado_pago: url.searchParams.get('estado_pago') || undefined,
+	          fecha_desde: url.searchParams.get('fecha_desde') || undefined,
+	          fecha_hasta: url.searchParams.get('fecha_hasta') || undefined,
+	          limit: pagination.limit,
+	          offset: pagination.offset,
+	        }
+	      );
+	      recordCircuitSuccess();
+	      return res;
+	    }
 
     // 25. GET /pedidos/:id - Obtener pedido específico
-    if (path.match(/^\/pedidos\/[a-f0-9-]+$/) && method === 'GET') {
-      checkRole(BASE_ROLES);
-      const id = path.split('/')[2];
-      if (!isUuid(id)) {
-        return respondFail('VALIDATION_ERROR', 'id de pedido invalido', 400);
-      }
-      return await handleObtenerPedido(supabaseUrl, requestHeaders(), responseHeaders, requestId, id);
-    }
+	    if (path.match(/^\/pedidos\/[a-f0-9-]+$/) && method === 'GET') {
+	      checkRole(BASE_ROLES);
+	      const id = path.split('/')[2];
+	      if (!isUuid(id)) {
+	        return respondFail('VALIDATION_ERROR', 'id de pedido invalido', 400);
+	      }
+	      const res = await handleObtenerPedido(supabaseUrl, requestHeaders(), responseHeaders, requestId, id);
+	      recordCircuitSuccess();
+	      return res;
+	    }
 
     // 26. POST /pedidos - Crear nuevo pedido
-    if (path === '/pedidos' && method === 'POST') {
-      checkRole(BASE_ROLES);
+	    if (path === '/pedidos' && method === 'POST') {
+	      checkRole(BASE_ROLES);
 
       const bodyResult = await parseJsonBody();
       if (bodyResult instanceof Response) return bodyResult;
 
-      return await handleCrearPedido(
-        supabaseUrl,
-        requestHeaders(),
-        responseHeaders,
-        requestId,
-        bodyResult as Parameters<typeof handleCrearPedido>[4]
-      );
-    }
+	      const res = await handleCrearPedido(
+	        supabaseUrl,
+	        requestHeaders(),
+	        responseHeaders,
+	        requestId,
+	        bodyResult as Parameters<typeof handleCrearPedido>[4]
+	      );
+	      recordCircuitSuccess();
+	      return res;
+	    }
 
     // 27. PUT /pedidos/:id/estado - Actualizar estado del pedido
-    if (path.match(/^\/pedidos\/[a-f0-9-]+\/estado$/) && method === 'PUT') {
-      checkRole(BASE_ROLES);
+	    if (path.match(/^\/pedidos\/[a-f0-9-]+\/estado$/) && method === 'PUT') {
+	      checkRole(BASE_ROLES);
       const id = path.split('/')[2];
       if (!isUuid(id)) {
         return respondFail('VALIDATION_ERROR', 'id de pedido invalido', 400);
@@ -1707,19 +1763,21 @@ Deno.serve(async (req) => {
       if (bodyResult instanceof Response) return bodyResult;
       const { estado } = bodyResult as { estado: string };
 
-      return await handleActualizarEstadoPedido(
-        supabaseUrl,
-        requestHeaders(),
-        responseHeaders,
-        requestId,
-        id,
-        estado,
-        user!.id
-      );
-    }
+	      const res = await handleActualizarEstadoPedido(
+	        supabaseUrl,
+	        requestHeaders(),
+	        responseHeaders,
+	        requestId,
+	        id,
+	        estado,
+	        user!.id
+	      );
+	      recordCircuitSuccess();
+	      return res;
+	    }
 
     // 28. PUT /pedidos/:id/pago - Registrar pago del pedido
-    if (path.match(/^\/pedidos\/[a-f0-9-]+\/pago$/) && method === 'PUT') {
+	    if (path.match(/^\/pedidos\/[a-f0-9-]+\/pago$/) && method === 'PUT') {
       checkRole(['admin', 'deposito', 'jefe']);
       const id = path.split('/')[2];
       if (!isUuid(id)) {
@@ -1734,19 +1792,21 @@ Deno.serve(async (req) => {
         return respondFail('VALIDATION_ERROR', 'monto_pagado debe ser >= 0', 400);
       }
 
-      return await handleActualizarPagoPedido(
-        supabaseUrl,
-        requestHeaders(),
-        responseHeaders,
-        requestId,
-        id,
-        monto_pagado
-      );
-    }
+	      const res = await handleActualizarPagoPedido(
+	        supabaseUrl,
+	        requestHeaders(),
+	        responseHeaders,
+	        requestId,
+	        id,
+	        monto_pagado
+	      );
+	      recordCircuitSuccess();
+	      return res;
+	    }
 
     // 29. PUT /pedidos/items/:id - Marcar item como preparado/no preparado
     // Back-compat: aceptar también /pedidos/items/:id/preparado (ruta anterior del frontend)
-    if (path.match(/^\/pedidos\/items\/[a-f0-9-]+(\/preparado)?$/) && method === 'PUT') {
+	    if (path.match(/^\/pedidos\/items\/[a-f0-9-]+(\/preparado)?$/) && method === 'PUT') {
       checkRole(BASE_ROLES);
       const id = path.split('/')[3];
       if (!isUuid(id)) {
@@ -1761,83 +1821,98 @@ Deno.serve(async (req) => {
         return respondFail('VALIDATION_ERROR', 'preparado debe ser boolean', 400);
       }
 
-      return await handleMarcarItemPreparado(
-        supabaseUrl,
-        requestHeaders(),
-        responseHeaders,
-        requestId,
-        id,
-        preparado,
-        user!.id
-      );
-    }
+	      const res = await handleMarcarItemPreparado(
+	        supabaseUrl,
+	        requestHeaders(),
+	        responseHeaders,
+	        requestId,
+	        id,
+	        preparado,
+	        user!.id
+	      );
+	      recordCircuitSuccess();
+	      return res;
+	    }
 
     // ====================================================================
     // ENDPOINTS: INSIGHTS — Arbitraje de Precios (Fase 1)
     // ====================================================================
 
     // 30. GET /insights/arbitraje - Productos con riesgo de pérdida o margen bajo
-    if (path === '/insights/arbitraje' && method === 'GET') {
-      checkRole(BASE_ROLES);
-      return await handleInsightsArbitraje(supabaseUrl, requestHeaders(), responseHeaders, requestId);
-    }
+	    if (path === '/insights/arbitraje' && method === 'GET') {
+	      checkRole(BASE_ROLES);
+	      const res = await handleInsightsArbitraje(supabaseUrl, requestHeaders(), responseHeaders, requestId);
+	      recordCircuitSuccess();
+	      return res;
+	    }
 
     // 31. GET /insights/compras - Oportunidades de compra (stock bajo + caída costo)
-    if (path === '/insights/compras' && method === 'GET') {
-      checkRole(BASE_ROLES);
-      return await handleInsightsCompras(supabaseUrl, requestHeaders(), responseHeaders, requestId);
-    }
+	    if (path === '/insights/compras' && method === 'GET') {
+	      checkRole(BASE_ROLES);
+	      const res = await handleInsightsCompras(supabaseUrl, requestHeaders(), responseHeaders, requestId);
+	      recordCircuitSuccess();
+	      return res;
+	    }
 
     // 32. GET /insights/producto/:id - Payload unificado de arbitraje para un producto
-    if (path.match(/^\/insights\/producto\/[a-f0-9-]+$/) && method === 'GET') {
-      checkRole(BASE_ROLES);
-      const id = path.split('/')[3];
-      return await handleInsightsProducto(supabaseUrl, requestHeaders(), responseHeaders, requestId, id);
-    }
+	    if (path.match(/^\/insights\/producto\/[a-f0-9-]+$/) && method === 'GET') {
+	      checkRole(BASE_ROLES);
+	      const id = path.split('/')[3];
+	      if (!isUuid(id)) {
+	        return respondFail('VALIDATION_ERROR', 'id de producto invalido', 400);
+	      }
+	      const res = await handleInsightsProducto(supabaseUrl, requestHeaders(), responseHeaders, requestId, id);
+	      recordCircuitSuccess();
+	      return res;
+	    }
 
     // ====================================================================
     // ENDPOINTS: CLIENTES + VENTAS POS + CUENTAS CORRIENTES (Fase 2)
     // ====================================================================
 
     // 33. GET /clientes - Listar clientes (incluye saldo CC)
-    if (path === '/clientes' && method === 'GET') {
-      checkRole(['admin', 'ventas']);
+	    if (path === '/clientes' && method === 'GET') {
+	      checkRole(['admin', 'ventas']);
 
       const pagination = getPaginationOrFail(50, 200);
       if (pagination instanceof Response) return pagination;
 
-      return await handleListarClientes(
-        supabaseUrl,
-        requestHeaders(),
-        responseHeaders,
-        requestId,
-        {
-          q: url.searchParams.get('q'),
-          limit: pagination.limit,
-          offset: pagination.offset,
-        },
-      );
-    }
+	      const res = await handleListarClientes(
+	        supabaseUrl,
+	        requestHeaders(),
+	        responseHeaders,
+	        requestId,
+	        {
+	          q: url.searchParams.get('q'),
+	          limit: pagination.limit,
+	          offset: pagination.offset,
+	        },
+	      );
+	      recordCircuitSuccess();
+	      return res;
+	    }
 
     // 34. POST /clientes - Crear cliente
-    if (path === '/clientes' && method === 'POST') {
-      checkRole(['admin', 'ventas']);
+	    if (path === '/clientes' && method === 'POST') {
+	      checkRole(['admin', 'ventas']);
 
       const bodyResult = await parseJsonBody();
       if (bodyResult instanceof Response) return bodyResult;
 
-      return await handleCrearCliente(
-        supabaseUrl,
-        requestHeaders(),
-        responseHeaders,
-        requestId,
-        bodyResult as Record<string, unknown>,
-        { allowLimiteCredito: user?.role === 'admin' },
-      );
-    }
+	      const res = await handleCrearCliente(
+	        supabaseUrl,
+	        requestHeaders(),
+	        responseHeaders,
+	        requestId,
+	        bodyResult as Record<string, unknown>,
+	        { allowLimiteCredito: user?.role === 'admin' },
+	      );
+	      recordCircuitSuccess();
+	      return res;
+	    }
 
     // 35. PUT /clientes/:id - Actualizar cliente
-    if (path.match(/^\/clientes\/[a-f0-9-]+$/) && method === 'PUT') {
+	    if (path.match(/^\/clientes\/[a-f0-9-]+$/) && method === 'PUT') {
       checkRole(['admin', 'ventas']);
 
       const clienteId = path.split('/')[2];
@@ -1848,60 +1923,68 @@ Deno.serve(async (req) => {
       const bodyResult = await parseJsonBody();
       if (bodyResult instanceof Response) return bodyResult;
 
-      return await handleActualizarCliente(
-        supabaseUrl,
-        requestHeaders(),
-        responseHeaders,
-        requestId,
-        clienteId,
-        bodyResult as Record<string, unknown>,
-        { allowLimiteCredito: user?.role === 'admin' },
-      );
-    }
+	      const res = await handleActualizarCliente(
+	        supabaseUrl,
+	        requestHeaders(),
+	        responseHeaders,
+	        requestId,
+	        clienteId,
+	        bodyResult as Record<string, unknown>,
+	        { allowLimiteCredito: user?.role === 'admin' },
+	      );
+	      recordCircuitSuccess();
+	      return res;
+	    }
 
     // 36. GET /cuentas-corrientes/resumen - Resumen "dinero en la calle"
-    if (path === '/cuentas-corrientes/resumen' && method === 'GET') {
-      checkRole(['admin', 'ventas']);
-      return await handleResumenCC(supabaseUrl, requestHeaders(), responseHeaders, requestId);
-    }
+	    if (path === '/cuentas-corrientes/resumen' && method === 'GET') {
+	      checkRole(['admin', 'ventas']);
+	      const res = await handleResumenCC(supabaseUrl, requestHeaders(), responseHeaders, requestId);
+	      recordCircuitSuccess();
+	      return res;
+	    }
 
     // 37. GET /cuentas-corrientes/saldos - Saldos por cliente
-    if (path === '/cuentas-corrientes/saldos' && method === 'GET') {
+	    if (path === '/cuentas-corrientes/saldos' && method === 'GET') {
       checkRole(['admin', 'ventas']);
 
       const pagination = getPaginationOrFail(50, 200);
       if (pagination instanceof Response) return pagination;
 
       const soloDeuda = url.searchParams.get('solo_deuda') === 'true';
-      return await handleListarSaldosCC(
-        supabaseUrl,
-        requestHeaders(),
-        responseHeaders,
-        requestId,
-        {
-          q: url.searchParams.get('q'),
-          solo_deuda: soloDeuda,
-          limit: pagination.limit,
-          offset: pagination.offset,
-        },
-      );
-    }
+	      const res = await handleListarSaldosCC(
+	        supabaseUrl,
+	        requestHeaders(),
+	        responseHeaders,
+	        requestId,
+	        {
+	          q: url.searchParams.get('q'),
+	          solo_deuda: soloDeuda,
+	          limit: pagination.limit,
+	          offset: pagination.offset,
+	        },
+	      );
+	      recordCircuitSuccess();
+	      return res;
+	    }
 
     // 38. POST /cuentas-corrientes/pagos - Registrar pago
-    if (path === '/cuentas-corrientes/pagos' && method === 'POST') {
+	    if (path === '/cuentas-corrientes/pagos' && method === 'POST') {
       checkRole(['admin', 'ventas']);
 
       const bodyResult = await parseJsonBody();
       if (bodyResult instanceof Response) return bodyResult;
 
-      return await handleRegistrarPagoCC(
-        supabaseUrl,
-        requestHeaders(),
-        responseHeaders,
-        requestId,
-        bodyResult as Record<string, unknown>,
-      );
-    }
+	      const res = await handleRegistrarPagoCC(
+	        supabaseUrl,
+	        requestHeaders(),
+	        responseHeaders,
+	        requestId,
+	        bodyResult as Record<string, unknown>,
+	      );
+	      recordCircuitSuccess();
+	      return res;
+	    }
 
     // 39. POST /ventas - Crear venta POS (idempotente)
     if (path === '/ventas' && method === 'POST') {
@@ -1931,21 +2014,28 @@ Deno.serve(async (req) => {
       const pagination = getPaginationOrFail(50, 200);
       if (pagination instanceof Response) return pagination;
 
-      return await handleListarVentas(
+      const res = await handleListarVentas(
         supabaseUrl,
         requestHeaders(),
         responseHeaders,
         requestId,
         { limit: pagination.limit, offset: pagination.offset },
       );
+      recordCircuitSuccess();
+      return res;
     }
 
     // 41. GET /ventas/:id - Obtener venta
-    if (path.match(/^\/ventas\/[a-f0-9-]+$/) && method === 'GET') {
-      checkRole(['admin', 'ventas']);
-      const ventaId = path.split('/')[2];
-      return await handleObtenerVenta(supabaseUrl, requestHeaders(), responseHeaders, requestId, ventaId);
-    }
+	    if (path.match(/^\/ventas\/[a-f0-9-]+$/) && method === 'GET') {
+	      checkRole(['admin', 'ventas']);
+	      const ventaId = path.split('/')[2];
+	      if (!isUuid(ventaId)) {
+	        return respondFail('VALIDATION_ERROR', 'id de venta invalido', 400);
+	      }
+	      const res = await handleObtenerVenta(supabaseUrl, requestHeaders(), responseHeaders, requestId, ventaId);
+	      recordCircuitSuccess();
+	      return res;
+	    }
 
     // ====================================================================
     // ENDPOINTS: OFERTAS (Fase 4) — Anti-mermas
@@ -1954,7 +2044,9 @@ Deno.serve(async (req) => {
     // 42. GET /ofertas/sugeridas - Lista sugerencias (<= 7 días, sin oferta activa)
     if (path === '/ofertas/sugeridas' && method === 'GET') {
       checkRole(BASE_ROLES);
-      return await handleListarOfertasSugeridas(supabaseUrl, requestHeaders(), responseHeaders, requestId);
+      const res = await handleListarOfertasSugeridas(supabaseUrl, requestHeaders(), responseHeaders, requestId);
+      recordCircuitSuccess();
+      return res;
     }
 
     // 43. POST /ofertas/aplicar - Aplica oferta por stock_id (default 30% si no viene)
@@ -1964,21 +2056,28 @@ Deno.serve(async (req) => {
       const bodyResult = await parseJsonBody();
       if (bodyResult instanceof Response) return bodyResult;
 
-      return await handleAplicarOferta(
+      const res = await handleAplicarOferta(
         supabaseUrl,
         requestHeaders(),
         responseHeaders,
         requestId,
         bodyResult as Record<string, unknown>,
       );
+      recordCircuitSuccess();
+      return res;
     }
 
     // 44. POST /ofertas/:id/desactivar - Desactiva oferta
-    if (path.match(/^\/ofertas\/[a-f0-9-]+\/desactivar$/) && method === 'POST') {
-      checkRole(BASE_ROLES);
-      const ofertaId = path.split('/')[2];
-      return await handleDesactivarOferta(supabaseUrl, requestHeaders(), responseHeaders, requestId, ofertaId);
-    }
+	    if (path.match(/^\/ofertas\/[a-f0-9-]+\/desactivar$/) && method === 'POST') {
+	      checkRole(BASE_ROLES);
+	      const ofertaId = path.split('/')[2];
+	      if (!isUuid(ofertaId)) {
+	        return respondFail('VALIDATION_ERROR', 'id de oferta invalido', 400);
+	      }
+	      const res = await handleDesactivarOferta(supabaseUrl, requestHeaders(), responseHeaders, requestId, ofertaId);
+	      recordCircuitSuccess();
+	      return res;
+	    }
 
     // ====================================================================
     // ENDPOINTS: BITÁCORA (Fase 5) — Notas de turno
@@ -1991,7 +2090,7 @@ Deno.serve(async (req) => {
       const bodyResult = await parseJsonBody();
       if (bodyResult instanceof Response) return bodyResult;
 
-      return await handleCrearBitacora(
+      const res = await handleCrearBitacora(
         supabaseUrl,
         requestHeaders(),
         responseHeaders,
@@ -1999,6 +2098,8 @@ Deno.serve(async (req) => {
         bodyResult as Record<string, unknown>,
         user ? { email: user.email, role: user.role } : null,
       );
+      recordCircuitSuccess();
+      return res;
     }
 
     // 46. GET /bitacora - Listar notas (admin)
@@ -2008,13 +2109,15 @@ Deno.serve(async (req) => {
       const pagination = getPaginationOrFail(50, 200);
       if (pagination instanceof Response) return pagination;
 
-      return await handleListarBitacora(
+      const res = await handleListarBitacora(
         supabaseUrl,
         requestHeaders(),
         responseHeaders,
         requestId,
         { limit: pagination.limit, offset: pagination.offset },
       );
+      recordCircuitSuccess();
+      return res;
     }
 
     // ====================================================================
@@ -2032,18 +2135,32 @@ Deno.serve(async (req) => {
     // RUTA NO ENCONTRADA
     // ====================================================================
 
-    return respondFail('NOT_FOUND', `Ruta no encontrada: ${method} ${path}`, 404);
-  } catch (error) {
-    // Record failure for circuit breaker
-    circuitBreaker.recordFailure();
-
-    const appError = isAppError(error)
-      ? error
-      : toAppError(error, 'API_ERROR', getErrorStatus(error));
-
-    logger.error('API_MINIMARKET_ERROR', {
-      ...requestLog,
-      code: appError.code,
+	    return respondFail('NOT_FOUND', `Ruta no encontrada: ${method} ${path}`, 404);
+	  } catch (error) {
+	    const appError = isAppError(error)
+	      ? error
+	      : toAppError(error, 'API_ERROR', getErrorStatus(error));
+
+	    // Circuit breaker should not open on normal 4xx (bad request / not found / auth).
+	    // Only count real failures (network/5xx).
+	    if (appError.status >= 500) {
+	      if (serviceRoleKey && supabaseUrl) {
+	        await recordCircuitBreakerEvent(
+	          CIRCUIT_BREAKER_KEY,
+	          'failure',
+	          serviceRoleKey,
+	          supabaseUrl,
+	          circuitBreaker,
+	          CIRCUIT_BREAKER_OPTIONS,
+	        );
+	      } else {
+	        circuitBreaker.recordFailure();
+	      }
+	    }
+	
+	    logger.error('API_MINIMARKET_ERROR', {
+	      ...requestLog,
+	      code: appError.code,
       message: appError.message,
       status: appError.status,
     });
diff --git a/supabase/functions/api-proveedor/index.ts b/supabase/functions/api-proveedor/index.ts
index 034c569..9eeb6bd 100644
--- a/supabase/functions/api-proveedor/index.ts
+++ b/supabase/functions/api-proveedor/index.ts
@@ -247,10 +247,19 @@ Deno.serve(async (request: Request): Promise<Response> => {
     const corsResult = validateOrigin(request, allowedOrigins, corsOverrides);
     const corsHeaders = { ...corsResult.headers, 'x-request-id': requestId };
 
-    // Requiere encabezado Origin para evitar fallback permisivo
-    if (!corsResult.origin) {
-        logger.warn('CORS_MISSING_ORIGIN', { path: url.pathname, requestId });
-        return createCorsErrorResponse(requestId, corsHeaders);
+    // For browser requests, Origin header is required.
+    // Allow requests without Origin for server-to-server calls (A5).
+    const origin = request.headers.get('origin');
+    const requireOrigin = Deno.env.get('REQUIRE_ORIGIN') !== 'false';
+
+    if (requireOrigin && origin === null) {
+        const userAgent = request.headers.get('user-agent') || '';
+        const isBrowserLike = /mozilla|chrome|safari|firefox|edge|opera/i.test(userAgent);
+
+        if (isBrowserLike) {
+            logger.warn('CORS_MISSING_ORIGIN', { path: url.pathname, requestId, userAgent });
+            return createCorsErrorResponse(requestId, corsHeaders);
+        }
     }
 
     if (!corsResult.allowed) {
```

## RETEST (shared circuit breaker module)

```bash
npm run test:unit -- tests/unit/shared-circuit-breaker.test.ts 
```

```

> workspace@1.0.0 test:unit
> vitest run tests/unit tests/unit/shared-circuit-breaker.test.ts


 RUN  v4.0.16 /home/eevan/ProyectosIA/aidrive_genspark__review_fase1_fase2_20260208

 ✓ tests/unit/strategic-high-value.test.ts (27 tests) 126ms
stdout | tests/unit/scraper-storage-auth.test.ts > storage key separation runtime > usa readKey para lecturas y writeKey para inserciones/actualizaciones
{"ts":"2026-02-08T06:34:24.210Z","level":"info","scope":"scraper-maxiconsumo:storage","message":"BATCH_INSERT_SUCCESS","requestId":"rw-1","count":1}

stderr | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeDailyPriceUpdate > debería retornar error si contexto es inválido
{"ts":"2026-02-08T06:34:24.243Z","level":"error","scope":"cron-jobs-maxiconsumo:job:daily-price-update","message":"VALIDATION_FAILED","field":"ctx.jobId","reason":"must be a non-empty string"}

stderr | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeDailyPriceUpdate > debería retornar error si supabaseUrl está vacío
{"ts":"2026-02-08T06:34:24.246Z","level":"error","scope":"cron-jobs-maxiconsumo:job:daily-price-update","message":"VALIDATION_FAILED","field":"supabaseUrl","reason":"must be a valid URL"}

stderr | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeDailyPriceUpdate > debería retornar error si serviceRoleKey está vacío
{"ts":"2026-02-08T06:34:24.247Z","level":"error","scope":"cron-jobs-maxiconsumo:job:daily-price-update","message":"VALIDATION_FAILED","field":"serviceRoleKey","reason":"must be a non-empty string"}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeDailyPriceUpdate > debería procesar correctamente cuando scraper responde OK
{"ts":"2026-02-08T06:34:24.247Z","level":"info","scope":"cron-jobs-maxiconsumo:job:daily-price-update","message":"JOB_START","requestId":"req-789","jobId":"test_job","runId":"run-456"}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeDailyPriceUpdate > debería procesar correctamente cuando scraper responde OK
{"ts":"2026-02-08T06:34:24.248Z","level":"info","scope":"cron-jobs-maxiconsumo:job:daily-price-update","message":"SCRAPING_COMPLETE","requestId":"req-789","jobId":"test_job","runId":"run-456","processed":50,"successful":45}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeDailyPriceUpdate > debería procesar correctamente cuando scraper responde OK
{"ts":"2026-02-08T06:34:24.248Z","level":"info","scope":"cron-jobs-maxiconsumo:job:daily-price-update","message":"JOB_COMPLETE","requestId":"req-789","jobId":"test_job","runId":"run-456","processed":50,"alerts":5,"duration":0}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeDailyPriceUpdate > debería manejar error del scraper
{"ts":"2026-02-08T06:34:24.249Z","level":"info","scope":"cron-jobs-maxiconsumo:job:daily-price-update","message":"JOB_START","requestId":"req-789","jobId":"test_job","runId":"run-456"}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeDailyPriceUpdate > debería manejar error del scraper
{"ts":"2026-02-08T06:34:24.249Z","level":"info","scope":"cron-jobs-maxiconsumo:job:daily-price-update","message":"JOB_COMPLETE","requestId":"req-789","jobId":"test_job","runId":"run-456","processed":0,"alerts":0,"duration":0}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeDailyPriceUpdate > debería manejar excepción durante ejecución
{"ts":"2026-02-08T06:34:24.250Z","level":"info","scope":"cron-jobs-maxiconsumo:job:daily-price-update","message":"JOB_START","requestId":"req-789","jobId":"test_job","runId":"run-456"}

stderr | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeDailyPriceUpdate > debería manejar excepción durante ejecución
{"ts":"2026-02-08T06:34:24.251Z","level":"error","scope":"cron-jobs-maxiconsumo:job:daily-price-update","message":"JOB_ERROR","requestId":"req-789","jobId":"test_job","runId":"run-456","error":"Network failure"}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeDailyPriceUpdate > debería calcular executionTimeMs correctamente
{"ts":"2026-02-08T06:34:24.251Z","level":"info","scope":"cron-jobs-maxiconsumo:job:daily-price-update","message":"JOB_START","requestId":"req-789","jobId":"test_job","runId":"run-456"}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeDailyPriceUpdate > debería calcular executionTimeMs correctamente
{"ts":"2026-02-08T06:34:24.251Z","level":"info","scope":"cron-jobs-maxiconsumo:job:daily-price-update","message":"SCRAPING_COMPLETE","requestId":"req-789","jobId":"test_job","runId":"run-456","processed":10,"successful":10}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeDailyPriceUpdate > debería calcular executionTimeMs correctamente
{"ts":"2026-02-08T06:34:24.252Z","level":"info","scope":"cron-jobs-maxiconsumo:job:daily-price-update","message":"JOB_COMPLETE","requestId":"req-789","jobId":"test_job","runId":"run-456","processed":10,"alerts":0,"duration":1}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeDailyPriceUpdate > debería llamar al endpoint correcto del scraper
{"ts":"2026-02-08T06:34:24.253Z","level":"info","scope":"cron-jobs-maxiconsumo:job:daily-price-update","message":"JOB_START","requestId":"req-789","jobId":"test_job","runId":"run-456"}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeDailyPriceUpdate > debería llamar al endpoint correcto del scraper
{"ts":"2026-02-08T06:34:24.254Z","level":"info","scope":"cron-jobs-maxiconsumo:job:daily-price-update","message":"SCRAPING_COMPLETE","requestId":"req-789","jobId":"test_job","runId":"run-456","processed":0,"successful":0}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeDailyPriceUpdate > debería llamar al endpoint correcto del scraper
{"ts":"2026-02-08T06:34:24.255Z","level":"info","scope":"cron-jobs-maxiconsumo:job:daily-price-update","message":"JOB_COMPLETE","requestId":"req-789","jobId":"test_job","runId":"run-456","processed":0,"alerts":0,"duration":0}

stderr | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeMaintenanceCleanup > debería retornar error si contexto es inválido
{"ts":"2026-02-08T06:34:24.258Z","level":"error","scope":"cron-jobs-maxiconsumo:job:maintenance","message":"VALIDATION_FAILED","field":"ctx.jobId","reason":"must be a non-empty string"}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeMaintenanceCleanup > debería limpiar registros antiguos correctamente
{"ts":"2026-02-08T06:34:24.259Z","level":"info","scope":"cron-jobs-maxiconsumo:job:maintenance","message":"JOB_START","requestId":"req-789","jobId":"test_job","runId":"run-456"}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeMaintenanceCleanup > debería limpiar registros antiguos correctamente
{"ts":"2026-02-08T06:34:24.259Z","level":"info","scope":"cron-jobs-maxiconsumo:job:maintenance","message":"LOGS_CLEANED","requestId":"req-789","jobId":"test_job","runId":"run-456","count":2}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeMaintenanceCleanup > debería limpiar registros antiguos correctamente
{"ts":"2026-02-08T06:34:24.259Z","level":"info","scope":"cron-jobs-maxiconsumo:job:maintenance","message":"JOB_COMPLETE","requestId":"req-789","jobId":"test_job","runId":"run-456","metrics":{"logs_deleted":2,"metrics_deleted":1,"alerts_deleted":0},"duration":0}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeMaintenanceCleanup > debería usar parámetros de retención personalizados
{"ts":"2026-02-08T06:34:24.260Z","level":"info","scope":"cron-jobs-maxiconsumo:job:maintenance","message":"JOB_START","requestId":"req-789","jobId":"test_job","runId":"run-456"}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeMaintenanceCleanup > debería usar parámetros de retención personalizados
{"ts":"2026-02-08T06:34:24.261Z","level":"info","scope":"cron-jobs-maxiconsumo:job:maintenance","message":"LOGS_CLEANED","requestId":"req-789","jobId":"test_job","runId":"run-456","count":0}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeMaintenanceCleanup > debería usar parámetros de retención personalizados
{"ts":"2026-02-08T06:34:24.261Z","level":"info","scope":"cron-jobs-maxiconsumo:job:maintenance","message":"JOB_COMPLETE","requestId":"req-789","jobId":"test_job","runId":"run-456","metrics":{"logs_deleted":0,"metrics_deleted":0,"alerts_deleted":0},"duration":1}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeMaintenanceCleanup > debería recomendar reducir retención si limpia muchos registros
{"ts":"2026-02-08T06:34:24.262Z","level":"info","scope":"cron-jobs-maxiconsumo:job:maintenance","message":"JOB_START","requestId":"req-789","jobId":"test_job","runId":"run-456"}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeMaintenanceCleanup > debería recomendar reducir retención si limpia muchos registros
{"ts":"2026-02-08T06:34:24.262Z","level":"info","scope":"cron-jobs-maxiconsumo:job:maintenance","message":"LOGS_CLEANED","requestId":"req-789","jobId":"test_job","runId":"run-456","count":500}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeMaintenanceCleanup > debería recomendar reducir retención si limpia muchos registros
{"ts":"2026-02-08T06:34:24.262Z","level":"info","scope":"cron-jobs-maxiconsumo:job:maintenance","message":"JOB_COMPLETE","requestId":"req-789","jobId":"test_job","runId":"run-456","metrics":{"logs_deleted":500,"metrics_deleted":400,"alerts_deleted":200},"duration":0}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeMaintenanceCleanup > debería manejar excepción durante ejecución
{"ts":"2026-02-08T06:34:24.263Z","level":"info","scope":"cron-jobs-maxiconsumo:job:maintenance","message":"JOB_START","requestId":"req-789","jobId":"test_job","runId":"run-456"}

stderr | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeMaintenanceCleanup > debería manejar excepción durante ejecución
{"ts":"2026-02-08T06:34:24.263Z","level":"error","scope":"cron-jobs-maxiconsumo:job:maintenance","message":"JOB_ERROR","requestId":"req-789","jobId":"test_job","runId":"run-456","error":"Database error"}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeMaintenanceCleanup > debería usar headers correctos para DELETE
{"ts":"2026-02-08T06:34:24.264Z","level":"info","scope":"cron-jobs-maxiconsumo:job:maintenance","message":"JOB_START","requestId":"req-789","jobId":"test_job","runId":"run-456"}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeMaintenanceCleanup > debería usar headers correctos para DELETE
{"ts":"2026-02-08T06:34:24.265Z","level":"info","scope":"cron-jobs-maxiconsumo:job:maintenance","message":"LOGS_CLEANED","requestId":"req-789","jobId":"test_job","runId":"run-456","count":0}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeMaintenanceCleanup > debería usar headers correctos para DELETE
{"ts":"2026-02-08T06:34:24.265Z","level":"info","scope":"cron-jobs-maxiconsumo:job:maintenance","message":"JOB_COMPLETE","requestId":"req-789","jobId":"test_job","runId":"run-456","metrics":{"logs_deleted":0,"metrics_deleted":0,"alerts_deleted":0},"duration":1}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeMaintenanceCleanup > debería calcular productsProcessed como total limpiado
{"ts":"2026-02-08T06:34:24.266Z","level":"info","scope":"cron-jobs-maxiconsumo:job:maintenance","message":"JOB_START","requestId":"req-789","jobId":"test_job","runId":"run-456"}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeMaintenanceCleanup > debería calcular productsProcessed como total limpiado
{"ts":"2026-02-08T06:34:24.266Z","level":"info","scope":"cron-jobs-maxiconsumo:job:maintenance","message":"LOGS_CLEANED","requestId":"req-789","jobId":"test_job","runId":"run-456","count":3}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeMaintenanceCleanup > debería calcular productsProcessed como total limpiado
{"ts":"2026-02-08T06:34:24.266Z","level":"info","scope":"cron-jobs-maxiconsumo:job:maintenance","message":"JOB_COMPLETE","requestId":"req-789","jobId":"test_job","runId":"run-456","metrics":{"logs_deleted":3,"metrics_deleted":2,"alerts_deleted":1},"duration":0}

stderr | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeRealtimeAlerts > debería retornar error si contexto es inválido
{"ts":"2026-02-08T06:34:24.267Z","level":"error","scope":"cron-jobs-maxiconsumo:job:realtime-alerts","message":"VALIDATION_FAILED","field":"ctx.jobId","reason":"must be a non-empty string"}

stderr | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeRealtimeAlerts > debería retornar error si supabaseUrl está vacío
{"ts":"2026-02-08T06:34:24.268Z","level":"error","scope":"cron-jobs-maxiconsumo:job:realtime-alerts","message":"VALIDATION_FAILED","field":"supabaseUrl","reason":"must be a valid URL"}

stderr | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeRealtimeAlerts > debería retornar error si serviceRoleKey está vacío
{"ts":"2026-02-08T06:34:24.268Z","level":"error","scope":"cron-jobs-maxiconsumo:job:realtime-alerts","message":"VALIDATION_FAILED","field":"serviceRoleKey","reason":"must be a non-empty string"}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeRealtimeAlerts > debería procesar alertas críticas correctamente
{"ts":"2026-02-08T06:34:24.269Z","level":"info","scope":"cron-jobs-maxiconsumo:job:realtime-alerts","message":"JOB_START","requestId":"req-789","jobId":"test_job","runId":"run-456"}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeRealtimeAlerts > debería procesar alertas críticas correctamente
{"ts":"2026-02-08T06:34:24.269Z","level":"info","scope":"cron-jobs-maxiconsumo:job:realtime-alerts","message":"CHANGES_DETECTED","requestId":"req-789","jobId":"test_job","runId":"run-456","total":2,"critical":2}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeRealtimeAlerts > debería procesar alertas críticas correctamente
{"ts":"2026-02-08T06:34:24.270Z","level":"info","scope":"cron-jobs-maxiconsumo:job:realtime-alerts","message":"JOB_COMPLETE","requestId":"req-789","jobId":"test_job","runId":"run-456","alerts":2,"duration":1}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeRealtimeAlerts > debería no generar alertas si cambios están bajo threshold
{"ts":"2026-02-08T06:34:24.272Z","level":"info","scope":"cron-jobs-maxiconsumo:job:realtime-alerts","message":"JOB_START","requestId":"req-789","jobId":"test_job","runId":"run-456"}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeRealtimeAlerts > debería no generar alertas si cambios están bajo threshold
{"ts":"2026-02-08T06:34:24.273Z","level":"info","scope":"cron-jobs-maxiconsumo:job:realtime-alerts","message":"CHANGES_DETECTED","requestId":"req-789","jobId":"test_job","runId":"run-456","total":1,"critical":0}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeRealtimeAlerts > debería no generar alertas si cambios están bajo threshold
{"ts":"2026-02-08T06:34:24.273Z","level":"info","scope":"cron-jobs-maxiconsumo:job:realtime-alerts","message":"JOB_COMPLETE","requestId":"req-789","jobId":"test_job","runId":"run-456","alerts":0,"duration":1}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeRealtimeAlerts > debería usar threshold personalizado de parámetros
{"ts":"2026-02-08T06:34:24.274Z","level":"info","scope":"cron-jobs-maxiconsumo:job:realtime-alerts","message":"JOB_START","requestId":"req-789","jobId":"test_job","runId":"run-456"}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeRealtimeAlerts > debería usar threshold personalizado de parámetros
{"ts":"2026-02-08T06:34:24.274Z","level":"info","scope":"cron-jobs-maxiconsumo:job:realtime-alerts","message":"CHANGES_DETECTED","requestId":"req-789","jobId":"test_job","runId":"run-456","total":1,"critical":1}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeRealtimeAlerts > debería usar threshold personalizado de parámetros
{"ts":"2026-02-08T06:34:24.274Z","level":"info","scope":"cron-jobs-maxiconsumo:job:realtime-alerts","message":"JOB_COMPLETE","requestId":"req-789","jobId":"test_job","runId":"run-456","alerts":1,"duration":0}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeRealtimeAlerts > debería manejar excepción durante ejecución
{"ts":"2026-02-08T06:34:24.274Z","level":"info","scope":"cron-jobs-maxiconsumo:job:realtime-alerts","message":"JOB_START","requestId":"req-789","jobId":"test_job","runId":"run-456"}

stderr | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeRealtimeAlerts > debería manejar excepción durante ejecución
{"ts":"2026-02-08T06:34:24.275Z","level":"error","scope":"cron-jobs-maxiconsumo:job:realtime-alerts","message":"JOB_ERROR","requestId":"req-789","jobId":"test_job","runId":"run-456","error":"Database timeout"}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeRealtimeAlerts > debería calcular executionTimeMs correctamente
{"ts":"2026-02-08T06:34:24.275Z","level":"info","scope":"cron-jobs-maxiconsumo:job:realtime-alerts","message":"JOB_START","requestId":"req-789","jobId":"test_job","runId":"run-456"}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeRealtimeAlerts > debería calcular executionTimeMs correctamente
{"ts":"2026-02-08T06:34:24.275Z","level":"info","scope":"cron-jobs-maxiconsumo:job:realtime-alerts","message":"CHANGES_DETECTED","requestId":"req-789","jobId":"test_job","runId":"run-456","total":0,"critical":0}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeRealtimeAlerts > debería calcular executionTimeMs correctamente
{"ts":"2026-02-08T06:34:24.275Z","level":"info","scope":"cron-jobs-maxiconsumo:job:realtime-alerts","message":"JOB_COMPLETE","requestId":"req-789","jobId":"test_job","runId":"run-456","alerts":0,"duration":0}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeRealtimeAlerts > debería consultar precios de los últimos 15 minutos
{"ts":"2026-02-08T06:34:24.276Z","level":"info","scope":"cron-jobs-maxiconsumo:job:realtime-alerts","message":"JOB_START","requestId":"req-789","jobId":"test_job","runId":"run-456"}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeRealtimeAlerts > debería consultar precios de los últimos 15 minutos
{"ts":"2026-02-08T06:34:24.277Z","level":"info","scope":"cron-jobs-maxiconsumo:job:realtime-alerts","message":"CHANGES_DETECTED","requestId":"req-789","jobId":"test_job","runId":"run-456","total":0,"critical":0}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeRealtimeAlerts > debería consultar precios de los últimos 15 minutos
{"ts":"2026-02-08T06:34:24.277Z","level":"info","scope":"cron-jobs-maxiconsumo:job:realtime-alerts","message":"JOB_COMPLETE","requestId":"req-789","jobId":"test_job","runId":"run-456","alerts":0,"duration":1}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeRealtimeAlerts > debería crear alertas con severidad crítica
{"ts":"2026-02-08T06:34:24.278Z","level":"info","scope":"cron-jobs-maxiconsumo:job:realtime-alerts","message":"JOB_START","requestId":"req-789","jobId":"test_job","runId":"run-456"}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeRealtimeAlerts > debería crear alertas con severidad crítica
{"ts":"2026-02-08T06:34:24.278Z","level":"info","scope":"cron-jobs-maxiconsumo:job:realtime-alerts","message":"CHANGES_DETECTED","requestId":"req-789","jobId":"test_job","runId":"run-456","total":1,"critical":1}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeRealtimeAlerts > debería crear alertas con severidad crítica
{"ts":"2026-02-08T06:34:24.279Z","level":"info","scope":"cron-jobs-maxiconsumo:job:realtime-alerts","message":"JOB_COMPLETE","requestId":"req-789","jobId":"test_job","runId":"run-456","alerts":1,"duration":1}

stderr | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeWeeklyAnalysis > debería retornar error si contexto es inválido
{"ts":"2026-02-08T06:34:24.280Z","level":"error","scope":"cron-jobs-maxiconsumo:job:weekly-analysis","message":"VALIDATION_FAILED","field":"ctx.jobId","reason":"must be a non-empty string"}

stderr | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeWeeklyAnalysis > debería retornar error si supabaseUrl está vacío
{"ts":"2026-02-08T06:34:24.281Z","level":"error","scope":"cron-jobs-maxiconsumo:job:weekly-analysis","message":"VALIDATION_FAILED","field":"supabaseUrl","reason":"must be a valid URL"}

stderr | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeWeeklyAnalysis > debería retornar error si serviceRoleKey está vacío
{"ts":"2026-02-08T06:34:24.281Z","level":"error","scope":"cron-jobs-maxiconsumo:job:weekly-analysis","message":"VALIDATION_FAILED","field":"serviceRoleKey","reason":"must be a non-empty string"}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeWeeklyAnalysis > debería calcular trends correctamente con datos válidos
{"ts":"2026-02-08T06:34:24.282Z","level":"info","scope":"cron-jobs-maxiconsumo:job:weekly-analysis","message":"JOB_START","requestId":"req-789","jobId":"test_job","runId":"run-456"}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeWeeklyAnalysis > debería calcular trends correctamente con datos válidos
{"ts":"2026-02-08T06:34:24.282Z","level":"info","scope":"cron-jobs-maxiconsumo:job:weekly-analysis","message":"TRENDS_CALCULATED","requestId":"req-789","jobId":"test_job","runId":"run-456","trends":{"total_cambios":2,"promedio_cambio":"20.00","alertas_semana":2,"alertas_criticas":1}}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeWeeklyAnalysis > debería calcular trends correctamente con datos válidos
{"ts":"2026-02-08T06:34:24.282Z","level":"info","scope":"cron-jobs-maxiconsumo:job:weekly-analysis","message":"JOB_COMPLETE","requestId":"req-789","jobId":"test_job","runId":"run-456","trends":{"total_cambios":2,"promedio_cambio":"20.00","alertas_semana":2,"alertas_criticas":1},"duration":0}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeWeeklyAnalysis > debería manejar respuestas vacías correctamente
{"ts":"2026-02-08T06:34:24.283Z","level":"info","scope":"cron-jobs-maxiconsumo:job:weekly-analysis","message":"JOB_START","requestId":"req-789","jobId":"test_job","runId":"run-456"}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeWeeklyAnalysis > debería manejar respuestas vacías correctamente
{"ts":"2026-02-08T06:34:24.283Z","level":"info","scope":"cron-jobs-maxiconsumo:job:weekly-analysis","message":"TRENDS_CALCULATED","requestId":"req-789","jobId":"test_job","runId":"run-456","trends":{"total_cambios":0,"promedio_cambio":"0.00","alertas_semana":0,"alertas_criticas":0}}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeWeeklyAnalysis > debería manejar respuestas vacías correctamente
{"ts":"2026-02-08T06:34:24.283Z","level":"info","scope":"cron-jobs-maxiconsumo:job:weekly-analysis","message":"JOB_COMPLETE","requestId":"req-789","jobId":"test_job","runId":"run-456","trends":{"total_cambios":0,"promedio_cambio":"0.00","alertas_semana":0,"alertas_criticas":0},"duration":0}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeWeeklyAnalysis > debería generar recomendación si alertas críticas > 10
{"ts":"2026-02-08T06:34:24.283Z","level":"info","scope":"cron-jobs-maxiconsumo:job:weekly-analysis","message":"JOB_START","requestId":"req-789","jobId":"test_job","runId":"run-456"}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeWeeklyAnalysis > debería generar recomendación si alertas críticas > 10
{"ts":"2026-02-08T06:34:24.283Z","level":"info","scope":"cron-jobs-maxiconsumo:job:weekly-analysis","message":"TRENDS_CALCULATED","requestId":"req-789","jobId":"test_job","runId":"run-456","trends":{"total_cambios":0,"promedio_cambio":"0.00","alertas_semana":12,"alertas_criticas":12}}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeWeeklyAnalysis > debería generar recomendación si alertas críticas > 10
{"ts":"2026-02-08T06:34:24.283Z","level":"info","scope":"cron-jobs-maxiconsumo:job:weekly-analysis","message":"JOB_COMPLETE","requestId":"req-789","jobId":"test_job","runId":"run-456","trends":{"total_cambios":0,"promedio_cambio":"0.00","alertas_semana":12,"alertas_criticas":12},"duration":0}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeWeeklyAnalysis > debería generar recomendación si totalChanges > 100
{"ts":"2026-02-08T06:34:24.285Z","level":"info","scope":"cron-jobs-maxiconsumo:job:weekly-analysis","message":"JOB_START","requestId":"req-789","jobId":"test_job","runId":"run-456"}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeWeeklyAnalysis > debería generar recomendación si totalChanges > 100
{"ts":"2026-02-08T06:34:24.285Z","level":"info","scope":"cron-jobs-maxiconsumo:job:weekly-analysis","message":"TRENDS_CALCULATED","requestId":"req-789","jobId":"test_job","runId":"run-456","trends":{"total_cambios":105,"promedio_cambio":"10.00","alertas_semana":0,"alertas_criticas":0}}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeWeeklyAnalysis > debería generar recomendación si totalChanges > 100
{"ts":"2026-02-08T06:34:24.285Z","level":"info","scope":"cron-jobs-maxiconsumo:job:weekly-analysis","message":"JOB_COMPLETE","requestId":"req-789","jobId":"test_job","runId":"run-456","trends":{"total_cambios":105,"promedio_cambio":"10.00","alertas_semana":0,"alertas_criticas":0},"duration":0}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeWeeklyAnalysis > debería guardar métricas en cron_jobs_metrics
{"ts":"2026-02-08T06:34:24.286Z","level":"info","scope":"cron-jobs-maxiconsumo:job:weekly-analysis","message":"JOB_START","requestId":"req-789","jobId":"test_job","runId":"run-456"}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeWeeklyAnalysis > debería guardar métricas en cron_jobs_metrics
{"ts":"2026-02-08T06:34:24.287Z","level":"info","scope":"cron-jobs-maxiconsumo:job:weekly-analysis","message":"TRENDS_CALCULATED","requestId":"req-789","jobId":"test_job","runId":"run-456","trends":{"total_cambios":1,"promedio_cambio":"10.00","alertas_semana":0,"alertas_criticas":0}}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeWeeklyAnalysis > debería guardar métricas en cron_jobs_metrics
{"ts":"2026-02-08T06:34:24.287Z","level":"info","scope":"cron-jobs-maxiconsumo:job:weekly-analysis","message":"JOB_COMPLETE","requestId":"req-789","jobId":"test_job","runId":"run-456","trends":{"total_cambios":1,"promedio_cambio":"10.00","alertas_semana":0,"alertas_criticas":0},"duration":1}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeWeeklyAnalysis > debería manejar excepción durante ejecución
{"ts":"2026-02-08T06:34:24.288Z","level":"info","scope":"cron-jobs-maxiconsumo:job:weekly-analysis","message":"JOB_START","requestId":"req-789","jobId":"test_job","runId":"run-456"}

stderr | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeWeeklyAnalysis > debería manejar excepción durante ejecución
{"ts":"2026-02-08T06:34:24.288Z","level":"error","scope":"cron-jobs-maxiconsumo:job:weekly-analysis","message":"JOB_ERROR","requestId":"req-789","jobId":"test_job","runId":"run-456","error":"Connection refused"}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeWeeklyAnalysis > debería calcular productsProcessed como totalChanges
{"ts":"2026-02-08T06:34:24.289Z","level":"info","scope":"cron-jobs-maxiconsumo:job:weekly-analysis","message":"JOB_START","requestId":"req-789","jobId":"test_job","runId":"run-456"}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeWeeklyAnalysis > debería calcular productsProcessed como totalChanges
{"ts":"2026-02-08T06:34:24.289Z","level":"info","scope":"cron-jobs-maxiconsumo:job:weekly-analysis","message":"TRENDS_CALCULATED","requestId":"req-789","jobId":"test_job","runId":"run-456","trends":{"total_cambios":3,"promedio_cambio":"10.00","alertas_semana":0,"alertas_criticas":0}}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeWeeklyAnalysis > debería calcular productsProcessed como totalChanges
{"ts":"2026-02-08T06:34:24.289Z","level":"info","scope":"cron-jobs-maxiconsumo:job:weekly-analysis","message":"JOB_COMPLETE","requestId":"req-789","jobId":"test_job","runId":"run-456","trends":{"total_cambios":3,"promedio_cambio":"10.00","alertas_semana":0,"alertas_criticas":0},"duration":0}

 ✓ tests/unit/cron-jobs-handlers.test.ts (35 tests) 50ms
stdout | tests/unit/scraper-storage-auth.test.ts > storage key separation runtime > usa readKey para lecturas y writeKey para inserciones/actualizaciones
{"ts":"2026-02-08T06:34:24.324Z","level":"info","scope":"scraper-maxiconsumo:storage","message":"BATCH_UPDATE_COMPLETE","requestId":"rw-1","count":1}

stdout | tests/unit/scraper-storage-auth.test.ts > storage key separation runtime > usa writeKey también para lecturas cuando readKey=service (modo service)
{"ts":"2026-02-08T06:34:24.327Z","level":"info","scope":"scraper-maxiconsumo:storage","message":"BATCH_INSERT_SUCCESS","requestId":"rw-2","count":1}

 ✓ tests/unit/scraper-storage-auth.test.ts (32 tests) 134ms
 ✓ tests/unit/shared-cors.test.ts (21 tests) 18ms
 ✓ tests/unit/resilience-gaps.test.ts (5 tests) 93ms
 ✓ tests/unit/boundary-edge-cases.test.ts (9 tests) 124ms
 ✓ tests/unit/auth-resilient.test.ts (16 tests) 67ms
 ✓ tests/unit/scraper-cookie-jar.test.ts (20 tests) 67ms
stdout | tests/unit/shared-audit.test.ts > auditLog > should work in dry-run mode without supabase client
{"ts":"2026-02-08T06:34:26.969Z","level":"info","scope":"audit","message":"[AUDIT] precio_actualizado","usuario_id":"user-123","entidad_tipo":"productos","entidad_id":"prod-456","detalles":{"precio_anterior":100,"precio_nuevo":150},"nivel":"info"}

stderr | tests/unit/shared-audit.test.ts > auditLog > should work in dry-run mode without supabase client
{"ts":"2026-02-08T06:34:26.970Z","level":"warn","scope":"audit","message":"Audit log: dry-run mode, no database insert"}

stdout | tests/unit/shared-audit.test.ts > auditLog > should insert audit log with supabase client
{"ts":"2026-02-08T06:34:26.974Z","level":"info","scope":"audit","message":"[AUDIT] stock_ajustado","usuario_id":"user-456","entidad_tipo":"stock_deposito","entidad_id":"stock-789","nivel":"warning"}

stdout | tests/unit/shared-audit.test.ts > auditLog > should return error when database insert fails
{"ts":"2026-02-08T06:34:26.977Z","level":"info","scope":"audit","message":"[AUDIT] producto_eliminado","nivel":"info"}

stderr | tests/unit/shared-audit.test.ts > auditLog > should return error when database insert fails
{"ts":"2026-02-08T06:34:26.978Z","level":"error","scope":"audit","message":"Error inserting audit log","error":{"message":"Database error"}}

stdout | tests/unit/shared-audit.test.ts > auditLog > should handle exceptions gracefully
{"ts":"2026-02-08T06:34:26.979Z","level":"info","scope":"audit","message":"[AUDIT] login_fallido","nivel":"info"}

stderr | tests/unit/shared-audit.test.ts > auditLog > should handle exceptions gracefully
{"ts":"2026-02-08T06:34:26.979Z","level":"error","scope":"audit","message":"Exception in auditLog","error":"Connection failed"}

stdout | tests/unit/shared-audit.test.ts > auditLog > should use default nivel when not specified
{"ts":"2026-02-08T06:34:26.979Z","level":"info","scope":"audit","message":"[AUDIT] producto_creado","nivel":"info"}

stderr | tests/unit/shared-audit.test.ts > queryAuditLogs > should return error when query fails
{"ts":"2026-02-08T06:34:26.985Z","level":"error","scope":"audit","message":"Error querying audit logs","error":{"message":"Query failed"}}

stderr | tests/unit/shared-audit.test.ts > queryAuditLogs > should handle exceptions gracefully
{"ts":"2026-02-08T06:34:26.989Z","level":"error","scope":"audit","message":"Exception in queryAuditLogs","error":"Connection timeout"}

 ✓ tests/unit/shared-audit.test.ts (21 tests) 32ms
 ✓ tests/unit/scraper-config.test.ts (22 tests) 49ms
 ✓ tests/unit/scraper-parsing-edge-cases.test.ts (26 tests) 28ms
stderr | tests/unit/cron-jobs-execution-log.test.ts > execution-log > writeExecutionLog > debería manejar errores de fetch sin lanzar excepción
{"ts":"2026-02-08T06:34:28.261Z","level":"warn","scope":"cron-jobs-maxiconsumo:execution-log","message":"EXECUTION_LOG_INSERT_FAILED","requestId":"req-789","jobId":"daily_price_update","runId":"run-456","error":"Network error"}

stderr | tests/unit/cron-jobs-execution-log.test.ts > execution-log > writeExecutionLog > debería manejar respuestas no-ok sin lanzar excepción
{"ts":"2026-02-08T06:34:28.263Z","level":"warn","scope":"cron-jobs-maxiconsumo:execution-log","message":"EXECUTION_LOG_INSERT_FAILED","requestId":"req-789","jobId":"daily_price_update","runId":"run-456","status":500,"status_text":"Internal Server Error"}

 ✓ tests/unit/cron-jobs-execution-log.test.ts (17 tests) 25ms
 ✓ tests/unit/shared-response.test.ts (22 tests) 40ms
 ✓ tests/unit/gateway-auth.test.ts (28 tests) 15ms
 ✓ tests/unit/api-reservas-concurrencia.test.ts (4 tests) 31ms
 ✓ tests/unit/frontend-utils.test.ts (8 tests) 34ms
 ✓ tests/unit/shared-errors.test.ts (32 tests) 56ms
 ✓ tests/unit/api-proveedor-read-mode.test.ts (34 tests) 45ms
 ✓ tests/unit/scraper-parsing.test.ts (34 tests) 11ms
 ✓ tests/unit/api-ventas-pos.test.ts (4 tests) 15ms
 ✓ tests/unit/rate-limit-shared.test.ts (14 tests) 14ms
 ✓ tests/unit/shared-circuit-breaker.test.ts (18 tests) 39ms
 ✓ tests/unit/api-bitacora.test.ts (3 tests) 16ms
 ✓ tests/unit/frontend-hooks.test.ts (5 tests) 15ms
 ✓ tests/unit/api-proveedor-routing.test.ts (17 tests) 22ms
 ✓ tests/unit/pedidos-handlers.test.ts (29 tests) 13ms
 ✓ tests/unit/scraper-anti-detection.test.ts (35 tests) 34ms
stdout | tests/unit/scraper-matching.test.ts > scraper-maxiconsumo/matching > performAdvancedMatching > omite coincidencias con confianza <= 20
{"ts":"2026-02-08T06:34:34.992Z","level":"info","scope":"scraper-maxiconsumo:matching","message":"MATCHING_COMPLETE","total":0}

stdout | tests/unit/scraper-matching.test.ts > scraper-maxiconsumo/matching > performAdvancedMatching > hace match por nombre normalizado cuando no hay SKU ni barcode
{"ts":"2026-02-08T06:34:34.997Z","level":"info","scope":"scraper-maxiconsumo:matching","message":"MATCHING_COMPLETE","total":1}

 ✓ tests/unit/scraper-matching.test.ts (31 tests) 17ms
stdout | tests/unit/cron-jobs-locking.test.ts > cron-jobs-maxiconsumo/orchestrator locking > skips si no se adquiere lock
{"ts":"2026-02-08T06:34:35.244Z","level":"info","scope":"cron-jobs-maxiconsumo:orchestrator","message":"ORCHESTRATOR_EXECUTE_START","requestId":"req-1","jobId":"daily_price_update","runId":"run_1770532475244_uj5p6p"}

stderr | tests/unit/cron-jobs-locking.test.ts > cron-jobs-maxiconsumo/orchestrator locking > skips si no se adquiere lock
{"ts":"2026-02-08T06:34:35.247Z","level":"warn","scope":"cron-jobs-maxiconsumo:orchestrator","message":"JOB_LOCKED","requestId":"req-1","jobId":"daily_price_update","runId":"run_1770532475244_uj5p6p","lockSeconds":360}

stdout | tests/unit/cron-jobs-locking.test.ts > cron-jobs-maxiconsumo/orchestrator locking > adquiere y libera lock en ejecución exitosa
{"ts":"2026-02-08T06:34:35.252Z","level":"info","scope":"cron-jobs-maxiconsumo:orchestrator","message":"ORCHESTRATOR_EXECUTE_START","requestId":"req-2","jobId":"daily_price_update","runId":"run_1770532475251_zd5fb3"}

stdout | tests/unit/cron-jobs-locking.test.ts > cron-jobs-maxiconsumo/orchestrator locking > fallback: si RPC de lock no existe (404), ejecuta job igualmente
{"ts":"2026-02-08T06:34:35.255Z","level":"info","scope":"cron-jobs-maxiconsumo:orchestrator","message":"ORCHESTRATOR_EXECUTE_START","requestId":"req-3","jobId":"daily_price_update","runId":"run_1770532475254_4k1msh"}

stderr | tests/unit/cron-jobs-locking.test.ts > cron-jobs-maxiconsumo/orchestrator locking > fallback: si RPC de lock no existe (404), ejecuta job igualmente
{"ts":"2026-02-08T06:34:35.256Z","level":"warn","scope":"cron-jobs-maxiconsumo:orchestrator","message":"JOB_LOCK_RPC_MISSING","jobId":"daily_price_update","owner":"72a20250-34bc-441d-a9bd-bdede005c18c","action":"fallback_no_lock"}

stderr | tests/unit/cron-jobs-locking.test.ts > cron-jobs-maxiconsumo/orchestrator locking > fallback: si RPC de lock no existe (404), ejecuta job igualmente
{"ts":"2026-02-08T06:34:35.257Z","level":"warn","scope":"cron-jobs-maxiconsumo:orchestrator","message":"JOB_LOCK_RELEASE_FAILED","jobId":"daily_price_update","error":"RPC sp_release_job_lock failed: 404 Not Found"}

 ✓ tests/unit/cron-jobs-locking.test.ts (3 tests) 18ms
 ✓ tests/unit/shared-rate-limit.test.ts (22 tests) 16ms
 ✓ tests/unit/cron-validators.test.ts (38 tests) 17ms
 ✓ tests/unit/gateway-validation.test.ts (43 tests) 21ms
 ✓ tests/unit/shared-logger.test.ts (13 tests) 21ms
 ✓ tests/unit/api-ofertas.test.ts (5 tests) 23ms
 ✓ tests/unit/api-proveedor-auth.test.ts (17 tests) 19ms
 ✓ tests/unit/circuit-breaker-shared.test.ts (9 tests) 20ms
 ✓ tests/unit/cron-health-monitor.test.ts (10 tests) 11ms
 ✓ tests/unit/integration-contracts.test.ts (5 tests) 12ms
 ✓ tests/unit/security-gaps.test.ts (6 tests) 11ms
 ✓ tests/unit/scraper-cache.test.ts (4 tests) 11ms
 ✓ tests/unit/gateway-pagination.test.ts (20 tests) 10ms
 ✓ tests/unit/cron-jobs.test.ts (8 tests) 13ms
 ✓ tests/unit/cron-notifications.test.ts (10 tests) 14ms
 ✓ tests/unit/scraper-alertas.test.ts (3 tests) 4ms

 Test Files  44 passed (44)
      Tests  785 passed (785)
   Start at  06:34:22
   Duration  20.11s (transform 2.06s, setup 5.26s, import 3.02s, tests 1.47s, environment 38.49s)

JUNIT report written to /home/eevan/ProyectosIA/aidrive_genspark__review_fase1_fase2_20260208/test-reports/junit.xml
```

## RETEST (circuit breaker shared helper)

```bash
npm run test:unit -- tests/unit/circuit-breaker-shared.test.ts 
```

```

> workspace@1.0.0 test:unit
> vitest run tests/unit tests/unit/circuit-breaker-shared.test.ts


 RUN  v4.0.16 /home/eevan/ProyectosIA/aidrive_genspark__review_fase1_fase2_20260208

 ✓ tests/unit/boundary-edge-cases.test.ts (9 tests) 86ms
stdout | tests/unit/scraper-storage-auth.test.ts > storage key separation runtime > usa readKey para lecturas y writeKey para inserciones/actualizaciones
{"ts":"2026-02-08T06:34:43.891Z","level":"info","scope":"scraper-maxiconsumo:storage","message":"BATCH_INSERT_SUCCESS","requestId":"rw-1","count":1}

 ✓ tests/unit/strategic-high-value.test.ts (27 tests) 125ms
stdout | tests/unit/scraper-storage-auth.test.ts > storage key separation runtime > usa readKey para lecturas y writeKey para inserciones/actualizaciones
{"ts":"2026-02-08T06:34:44.003Z","level":"info","scope":"scraper-maxiconsumo:storage","message":"BATCH_UPDATE_COMPLETE","requestId":"rw-1","count":1}

stdout | tests/unit/scraper-storage-auth.test.ts > storage key separation runtime > usa writeKey también para lecturas cuando readKey=service (modo service)
{"ts":"2026-02-08T06:34:44.005Z","level":"info","scope":"scraper-maxiconsumo:storage","message":"BATCH_INSERT_SUCCESS","requestId":"rw-2","count":1}

 ✓ tests/unit/scraper-storage-auth.test.ts (32 tests) 130ms
 ✓ tests/unit/auth-resilient.test.ts (16 tests) 43ms
 ✓ tests/unit/resilience-gaps.test.ts (5 tests) 145ms
 ✓ tests/unit/scraper-cookie-jar.test.ts (20 tests) 40ms
 ✓ tests/unit/shared-errors.test.ts (32 tests) 24ms
 ✓ tests/unit/scraper-config.test.ts (22 tests) 87ms
stderr | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeDailyPriceUpdate > debería retornar error si contexto es inválido
{"ts":"2026-02-08T06:34:46.680Z","level":"error","scope":"cron-jobs-maxiconsumo:job:daily-price-update","message":"VALIDATION_FAILED","field":"ctx.jobId","reason":"must be a non-empty string"}

stderr | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeDailyPriceUpdate > debería retornar error si supabaseUrl está vacío
{"ts":"2026-02-08T06:34:46.684Z","level":"error","scope":"cron-jobs-maxiconsumo:job:daily-price-update","message":"VALIDATION_FAILED","field":"supabaseUrl","reason":"must be a valid URL"}

stderr | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeDailyPriceUpdate > debería retornar error si serviceRoleKey está vacío
{"ts":"2026-02-08T06:34:46.686Z","level":"error","scope":"cron-jobs-maxiconsumo:job:daily-price-update","message":"VALIDATION_FAILED","field":"serviceRoleKey","reason":"must be a non-empty string"}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeDailyPriceUpdate > debería procesar correctamente cuando scraper responde OK
{"ts":"2026-02-08T06:34:46.687Z","level":"info","scope":"cron-jobs-maxiconsumo:job:daily-price-update","message":"JOB_START","requestId":"req-789","jobId":"test_job","runId":"run-456"}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeDailyPriceUpdate > debería procesar correctamente cuando scraper responde OK
{"ts":"2026-02-08T06:34:46.688Z","level":"info","scope":"cron-jobs-maxiconsumo:job:daily-price-update","message":"SCRAPING_COMPLETE","requestId":"req-789","jobId":"test_job","runId":"run-456","processed":50,"successful":45}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeDailyPriceUpdate > debería procesar correctamente cuando scraper responde OK
{"ts":"2026-02-08T06:34:46.688Z","level":"info","scope":"cron-jobs-maxiconsumo:job:daily-price-update","message":"JOB_COMPLETE","requestId":"req-789","jobId":"test_job","runId":"run-456","processed":50,"alerts":5,"duration":1}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeDailyPriceUpdate > debería manejar error del scraper
{"ts":"2026-02-08T06:34:46.688Z","level":"info","scope":"cron-jobs-maxiconsumo:job:daily-price-update","message":"JOB_START","requestId":"req-789","jobId":"test_job","runId":"run-456"}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeDailyPriceUpdate > debería manejar error del scraper
{"ts":"2026-02-08T06:34:46.689Z","level":"info","scope":"cron-jobs-maxiconsumo:job:daily-price-update","message":"JOB_COMPLETE","requestId":"req-789","jobId":"test_job","runId":"run-456","processed":0,"alerts":0,"duration":1}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeDailyPriceUpdate > debería manejar excepción durante ejecución
{"ts":"2026-02-08T06:34:46.690Z","level":"info","scope":"cron-jobs-maxiconsumo:job:daily-price-update","message":"JOB_START","requestId":"req-789","jobId":"test_job","runId":"run-456"}

stderr | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeDailyPriceUpdate > debería manejar excepción durante ejecución
{"ts":"2026-02-08T06:34:46.693Z","level":"error","scope":"cron-jobs-maxiconsumo:job:daily-price-update","message":"JOB_ERROR","requestId":"req-789","jobId":"test_job","runId":"run-456","error":"Network failure"}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeDailyPriceUpdate > debería calcular executionTimeMs correctamente
{"ts":"2026-02-08T06:34:46.694Z","level":"info","scope":"cron-jobs-maxiconsumo:job:daily-price-update","message":"JOB_START","requestId":"req-789","jobId":"test_job","runId":"run-456"}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeDailyPriceUpdate > debería calcular executionTimeMs correctamente
{"ts":"2026-02-08T06:34:46.695Z","level":"info","scope":"cron-jobs-maxiconsumo:job:daily-price-update","message":"SCRAPING_COMPLETE","requestId":"req-789","jobId":"test_job","runId":"run-456","processed":10,"successful":10}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeDailyPriceUpdate > debería calcular executionTimeMs correctamente
{"ts":"2026-02-08T06:34:46.696Z","level":"info","scope":"cron-jobs-maxiconsumo:job:daily-price-update","message":"JOB_COMPLETE","requestId":"req-789","jobId":"test_job","runId":"run-456","processed":10,"alerts":0,"duration":2}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeDailyPriceUpdate > debería llamar al endpoint correcto del scraper
{"ts":"2026-02-08T06:34:46.697Z","level":"info","scope":"cron-jobs-maxiconsumo:job:daily-price-update","message":"JOB_START","requestId":"req-789","jobId":"test_job","runId":"run-456"}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeDailyPriceUpdate > debería llamar al endpoint correcto del scraper
{"ts":"2026-02-08T06:34:46.697Z","level":"info","scope":"cron-jobs-maxiconsumo:job:daily-price-update","message":"SCRAPING_COMPLETE","requestId":"req-789","jobId":"test_job","runId":"run-456","processed":0,"successful":0}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeDailyPriceUpdate > debería llamar al endpoint correcto del scraper
{"ts":"2026-02-08T06:34:46.697Z","level":"info","scope":"cron-jobs-maxiconsumo:job:daily-price-update","message":"JOB_COMPLETE","requestId":"req-789","jobId":"test_job","runId":"run-456","processed":0,"alerts":0,"duration":0}

stderr | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeMaintenanceCleanup > debería retornar error si contexto es inválido
{"ts":"2026-02-08T06:34:46.701Z","level":"error","scope":"cron-jobs-maxiconsumo:job:maintenance","message":"VALIDATION_FAILED","field":"ctx.jobId","reason":"must be a non-empty string"}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeMaintenanceCleanup > debería limpiar registros antiguos correctamente
{"ts":"2026-02-08T06:34:46.703Z","level":"info","scope":"cron-jobs-maxiconsumo:job:maintenance","message":"JOB_START","requestId":"req-789","jobId":"test_job","runId":"run-456"}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeMaintenanceCleanup > debería limpiar registros antiguos correctamente
{"ts":"2026-02-08T06:34:46.704Z","level":"info","scope":"cron-jobs-maxiconsumo:job:maintenance","message":"LOGS_CLEANED","requestId":"req-789","jobId":"test_job","runId":"run-456","count":2}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeMaintenanceCleanup > debería limpiar registros antiguos correctamente
{"ts":"2026-02-08T06:34:46.704Z","level":"info","scope":"cron-jobs-maxiconsumo:job:maintenance","message":"JOB_COMPLETE","requestId":"req-789","jobId":"test_job","runId":"run-456","metrics":{"logs_deleted":2,"metrics_deleted":1,"alerts_deleted":0},"duration":1}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeMaintenanceCleanup > debería usar parámetros de retención personalizados
{"ts":"2026-02-08T06:34:46.706Z","level":"info","scope":"cron-jobs-maxiconsumo:job:maintenance","message":"JOB_START","requestId":"req-789","jobId":"test_job","runId":"run-456"}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeMaintenanceCleanup > debería usar parámetros de retención personalizados
{"ts":"2026-02-08T06:34:46.707Z","level":"info","scope":"cron-jobs-maxiconsumo:job:maintenance","message":"LOGS_CLEANED","requestId":"req-789","jobId":"test_job","runId":"run-456","count":0}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeMaintenanceCleanup > debería usar parámetros de retención personalizados
{"ts":"2026-02-08T06:34:46.707Z","level":"info","scope":"cron-jobs-maxiconsumo:job:maintenance","message":"JOB_COMPLETE","requestId":"req-789","jobId":"test_job","runId":"run-456","metrics":{"logs_deleted":0,"metrics_deleted":0,"alerts_deleted":0},"duration":1}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeMaintenanceCleanup > debería recomendar reducir retención si limpia muchos registros
{"ts":"2026-02-08T06:34:46.707Z","level":"info","scope":"cron-jobs-maxiconsumo:job:maintenance","message":"JOB_START","requestId":"req-789","jobId":"test_job","runId":"run-456"}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeMaintenanceCleanup > debería recomendar reducir retención si limpia muchos registros
{"ts":"2026-02-08T06:34:46.708Z","level":"info","scope":"cron-jobs-maxiconsumo:job:maintenance","message":"LOGS_CLEANED","requestId":"req-789","jobId":"test_job","runId":"run-456","count":500}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeMaintenanceCleanup > debería recomendar reducir retención si limpia muchos registros
{"ts":"2026-02-08T06:34:46.708Z","level":"info","scope":"cron-jobs-maxiconsumo:job:maintenance","message":"JOB_COMPLETE","requestId":"req-789","jobId":"test_job","runId":"run-456","metrics":{"logs_deleted":500,"metrics_deleted":400,"alerts_deleted":200},"duration":1}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeMaintenanceCleanup > debería manejar excepción durante ejecución
{"ts":"2026-02-08T06:34:46.709Z","level":"info","scope":"cron-jobs-maxiconsumo:job:maintenance","message":"JOB_START","requestId":"req-789","jobId":"test_job","runId":"run-456"}

stderr | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeMaintenanceCleanup > debería manejar excepción durante ejecución
{"ts":"2026-02-08T06:34:46.709Z","level":"error","scope":"cron-jobs-maxiconsumo:job:maintenance","message":"JOB_ERROR","requestId":"req-789","jobId":"test_job","runId":"run-456","error":"Database error"}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeMaintenanceCleanup > debería usar headers correctos para DELETE
{"ts":"2026-02-08T06:34:46.709Z","level":"info","scope":"cron-jobs-maxiconsumo:job:maintenance","message":"JOB_START","requestId":"req-789","jobId":"test_job","runId":"run-456"}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeMaintenanceCleanup > debería usar headers correctos para DELETE
{"ts":"2026-02-08T06:34:46.709Z","level":"info","scope":"cron-jobs-maxiconsumo:job:maintenance","message":"LOGS_CLEANED","requestId":"req-789","jobId":"test_job","runId":"run-456","count":0}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeMaintenanceCleanup > debería usar headers correctos para DELETE
{"ts":"2026-02-08T06:34:46.710Z","level":"info","scope":"cron-jobs-maxiconsumo:job:maintenance","message":"JOB_COMPLETE","requestId":"req-789","jobId":"test_job","runId":"run-456","metrics":{"logs_deleted":0,"metrics_deleted":0,"alerts_deleted":0},"duration":1}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeMaintenanceCleanup > debería calcular productsProcessed como total limpiado
{"ts":"2026-02-08T06:34:46.710Z","level":"info","scope":"cron-jobs-maxiconsumo:job:maintenance","message":"JOB_START","requestId":"req-789","jobId":"test_job","runId":"run-456"}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeMaintenanceCleanup > debería calcular productsProcessed como total limpiado
{"ts":"2026-02-08T06:34:46.710Z","level":"info","scope":"cron-jobs-maxiconsumo:job:maintenance","message":"LOGS_CLEANED","requestId":"req-789","jobId":"test_job","runId":"run-456","count":3}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeMaintenanceCleanup > debería calcular productsProcessed como total limpiado
{"ts":"2026-02-08T06:34:46.710Z","level":"info","scope":"cron-jobs-maxiconsumo:job:maintenance","message":"JOB_COMPLETE","requestId":"req-789","jobId":"test_job","runId":"run-456","metrics":{"logs_deleted":3,"metrics_deleted":2,"alerts_deleted":1},"duration":0}

stderr | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeRealtimeAlerts > debería retornar error si contexto es inválido
{"ts":"2026-02-08T06:34:46.711Z","level":"error","scope":"cron-jobs-maxiconsumo:job:realtime-alerts","message":"VALIDATION_FAILED","field":"ctx.jobId","reason":"must be a non-empty string"}

stderr | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeRealtimeAlerts > debería retornar error si supabaseUrl está vacío
{"ts":"2026-02-08T06:34:46.715Z","level":"error","scope":"cron-jobs-maxiconsumo:job:realtime-alerts","message":"VALIDATION_FAILED","field":"supabaseUrl","reason":"must be a valid URL"}

stderr | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeRealtimeAlerts > debería retornar error si serviceRoleKey está vacío
{"ts":"2026-02-08T06:34:46.715Z","level":"error","scope":"cron-jobs-maxiconsumo:job:realtime-alerts","message":"VALIDATION_FAILED","field":"serviceRoleKey","reason":"must be a non-empty string"}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeRealtimeAlerts > debería procesar alertas críticas correctamente
{"ts":"2026-02-08T06:34:46.716Z","level":"info","scope":"cron-jobs-maxiconsumo:job:realtime-alerts","message":"JOB_START","requestId":"req-789","jobId":"test_job","runId":"run-456"}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeRealtimeAlerts > debería procesar alertas críticas correctamente
{"ts":"2026-02-08T06:34:46.718Z","level":"info","scope":"cron-jobs-maxiconsumo:job:realtime-alerts","message":"CHANGES_DETECTED","requestId":"req-789","jobId":"test_job","runId":"run-456","total":2,"critical":2}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeRealtimeAlerts > debería procesar alertas críticas correctamente
{"ts":"2026-02-08T06:34:46.718Z","level":"info","scope":"cron-jobs-maxiconsumo:job:realtime-alerts","message":"JOB_COMPLETE","requestId":"req-789","jobId":"test_job","runId":"run-456","alerts":2,"duration":2}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeRealtimeAlerts > debería no generar alertas si cambios están bajo threshold
{"ts":"2026-02-08T06:34:46.719Z","level":"info","scope":"cron-jobs-maxiconsumo:job:realtime-alerts","message":"JOB_START","requestId":"req-789","jobId":"test_job","runId":"run-456"}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeRealtimeAlerts > debería no generar alertas si cambios están bajo threshold
{"ts":"2026-02-08T06:34:46.719Z","level":"info","scope":"cron-jobs-maxiconsumo:job:realtime-alerts","message":"CHANGES_DETECTED","requestId":"req-789","jobId":"test_job","runId":"run-456","total":1,"critical":0}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeRealtimeAlerts > debería no generar alertas si cambios están bajo threshold
{"ts":"2026-02-08T06:34:46.719Z","level":"info","scope":"cron-jobs-maxiconsumo:job:realtime-alerts","message":"JOB_COMPLETE","requestId":"req-789","jobId":"test_job","runId":"run-456","alerts":0,"duration":0}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeRealtimeAlerts > debería usar threshold personalizado de parámetros
{"ts":"2026-02-08T06:34:46.720Z","level":"info","scope":"cron-jobs-maxiconsumo:job:realtime-alerts","message":"JOB_START","requestId":"req-789","jobId":"test_job","runId":"run-456"}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeRealtimeAlerts > debería usar threshold personalizado de parámetros
{"ts":"2026-02-08T06:34:46.721Z","level":"info","scope":"cron-jobs-maxiconsumo:job:realtime-alerts","message":"CHANGES_DETECTED","requestId":"req-789","jobId":"test_job","runId":"run-456","total":1,"critical":1}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeRealtimeAlerts > debería usar threshold personalizado de parámetros
{"ts":"2026-02-08T06:34:46.721Z","level":"info","scope":"cron-jobs-maxiconsumo:job:realtime-alerts","message":"JOB_COMPLETE","requestId":"req-789","jobId":"test_job","runId":"run-456","alerts":1,"duration":1}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeRealtimeAlerts > debería manejar excepción durante ejecución
{"ts":"2026-02-08T06:34:46.722Z","level":"info","scope":"cron-jobs-maxiconsumo:job:realtime-alerts","message":"JOB_START","requestId":"req-789","jobId":"test_job","runId":"run-456"}

stderr | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeRealtimeAlerts > debería manejar excepción durante ejecución
{"ts":"2026-02-08T06:34:46.722Z","level":"error","scope":"cron-jobs-maxiconsumo:job:realtime-alerts","message":"JOB_ERROR","requestId":"req-789","jobId":"test_job","runId":"run-456","error":"Database timeout"}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeRealtimeAlerts > debería calcular executionTimeMs correctamente
{"ts":"2026-02-08T06:34:46.723Z","level":"info","scope":"cron-jobs-maxiconsumo:job:realtime-alerts","message":"JOB_START","requestId":"req-789","jobId":"test_job","runId":"run-456"}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeRealtimeAlerts > debería calcular executionTimeMs correctamente
{"ts":"2026-02-08T06:34:46.723Z","level":"info","scope":"cron-jobs-maxiconsumo:job:realtime-alerts","message":"CHANGES_DETECTED","requestId":"req-789","jobId":"test_job","runId":"run-456","total":0,"critical":0}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeRealtimeAlerts > debería calcular executionTimeMs correctamente
{"ts":"2026-02-08T06:34:46.723Z","level":"info","scope":"cron-jobs-maxiconsumo:job:realtime-alerts","message":"JOB_COMPLETE","requestId":"req-789","jobId":"test_job","runId":"run-456","alerts":0,"duration":0}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeRealtimeAlerts > debería consultar precios de los últimos 15 minutos
{"ts":"2026-02-08T06:34:46.724Z","level":"info","scope":"cron-jobs-maxiconsumo:job:realtime-alerts","message":"JOB_START","requestId":"req-789","jobId":"test_job","runId":"run-456"}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeRealtimeAlerts > debería consultar precios de los últimos 15 minutos
{"ts":"2026-02-08T06:34:46.724Z","level":"info","scope":"cron-jobs-maxiconsumo:job:realtime-alerts","message":"CHANGES_DETECTED","requestId":"req-789","jobId":"test_job","runId":"run-456","total":0,"critical":0}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeRealtimeAlerts > debería consultar precios de los últimos 15 minutos
{"ts":"2026-02-08T06:34:46.724Z","level":"info","scope":"cron-jobs-maxiconsumo:job:realtime-alerts","message":"JOB_COMPLETE","requestId":"req-789","jobId":"test_job","runId":"run-456","alerts":0,"duration":0}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeRealtimeAlerts > debería crear alertas con severidad crítica
{"ts":"2026-02-08T06:34:46.725Z","level":"info","scope":"cron-jobs-maxiconsumo:job:realtime-alerts","message":"JOB_START","requestId":"req-789","jobId":"test_job","runId":"run-456"}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeRealtimeAlerts > debería crear alertas con severidad crítica
{"ts":"2026-02-08T06:34:46.725Z","level":"info","scope":"cron-jobs-maxiconsumo:job:realtime-alerts","message":"CHANGES_DETECTED","requestId":"req-789","jobId":"test_job","runId":"run-456","total":1,"critical":1}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeRealtimeAlerts > debería crear alertas con severidad crítica
{"ts":"2026-02-08T06:34:46.725Z","level":"info","scope":"cron-jobs-maxiconsumo:job:realtime-alerts","message":"JOB_COMPLETE","requestId":"req-789","jobId":"test_job","runId":"run-456","alerts":1,"duration":0}

stderr | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeWeeklyAnalysis > debería retornar error si contexto es inválido
{"ts":"2026-02-08T06:34:46.727Z","level":"error","scope":"cron-jobs-maxiconsumo:job:weekly-analysis","message":"VALIDATION_FAILED","field":"ctx.jobId","reason":"must be a non-empty string"}

stderr | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeWeeklyAnalysis > debería retornar error si supabaseUrl está vacío
{"ts":"2026-02-08T06:34:46.728Z","level":"error","scope":"cron-jobs-maxiconsumo:job:weekly-analysis","message":"VALIDATION_FAILED","field":"supabaseUrl","reason":"must be a valid URL"}

stderr | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeWeeklyAnalysis > debería retornar error si serviceRoleKey está vacío
{"ts":"2026-02-08T06:34:46.728Z","level":"error","scope":"cron-jobs-maxiconsumo:job:weekly-analysis","message":"VALIDATION_FAILED","field":"serviceRoleKey","reason":"must be a non-empty string"}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeWeeklyAnalysis > debería calcular trends correctamente con datos válidos
{"ts":"2026-02-08T06:34:46.729Z","level":"info","scope":"cron-jobs-maxiconsumo:job:weekly-analysis","message":"JOB_START","requestId":"req-789","jobId":"test_job","runId":"run-456"}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeWeeklyAnalysis > debería calcular trends correctamente con datos válidos
{"ts":"2026-02-08T06:34:46.730Z","level":"info","scope":"cron-jobs-maxiconsumo:job:weekly-analysis","message":"TRENDS_CALCULATED","requestId":"req-789","jobId":"test_job","runId":"run-456","trends":{"total_cambios":2,"promedio_cambio":"20.00","alertas_semana":2,"alertas_criticas":1}}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeWeeklyAnalysis > debería calcular trends correctamente con datos válidos
{"ts":"2026-02-08T06:34:46.730Z","level":"info","scope":"cron-jobs-maxiconsumo:job:weekly-analysis","message":"JOB_COMPLETE","requestId":"req-789","jobId":"test_job","runId":"run-456","trends":{"total_cambios":2,"promedio_cambio":"20.00","alertas_semana":2,"alertas_criticas":1},"duration":1}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeWeeklyAnalysis > debería manejar respuestas vacías correctamente
{"ts":"2026-02-08T06:34:46.732Z","level":"info","scope":"cron-jobs-maxiconsumo:job:weekly-analysis","message":"JOB_START","requestId":"req-789","jobId":"test_job","runId":"run-456"}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeWeeklyAnalysis > debería manejar respuestas vacías correctamente
{"ts":"2026-02-08T06:34:46.733Z","level":"info","scope":"cron-jobs-maxiconsumo:job:weekly-analysis","message":"TRENDS_CALCULATED","requestId":"req-789","jobId":"test_job","runId":"run-456","trends":{"total_cambios":0,"promedio_cambio":"0.00","alertas_semana":0,"alertas_criticas":0}}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeWeeklyAnalysis > debería manejar respuestas vacías correctamente
{"ts":"2026-02-08T06:34:46.733Z","level":"info","scope":"cron-jobs-maxiconsumo:job:weekly-analysis","message":"JOB_COMPLETE","requestId":"req-789","jobId":"test_job","runId":"run-456","trends":{"total_cambios":0,"promedio_cambio":"0.00","alertas_semana":0,"alertas_criticas":0},"duration":1}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeWeeklyAnalysis > debería generar recomendación si alertas críticas > 10
{"ts":"2026-02-08T06:34:46.735Z","level":"info","scope":"cron-jobs-maxiconsumo:job:weekly-analysis","message":"JOB_START","requestId":"req-789","jobId":"test_job","runId":"run-456"}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeWeeklyAnalysis > debería generar recomendación si alertas críticas > 10
{"ts":"2026-02-08T06:34:46.735Z","level":"info","scope":"cron-jobs-maxiconsumo:job:weekly-analysis","message":"TRENDS_CALCULATED","requestId":"req-789","jobId":"test_job","runId":"run-456","trends":{"total_cambios":0,"promedio_cambio":"0.00","alertas_semana":12,"alertas_criticas":12}}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeWeeklyAnalysis > debería generar recomendación si alertas críticas > 10
{"ts":"2026-02-08T06:34:46.736Z","level":"info","scope":"cron-jobs-maxiconsumo:job:weekly-analysis","message":"JOB_COMPLETE","requestId":"req-789","jobId":"test_job","runId":"run-456","trends":{"total_cambios":0,"promedio_cambio":"0.00","alertas_semana":12,"alertas_criticas":12},"duration":0}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeWeeklyAnalysis > debería generar recomendación si totalChanges > 100
{"ts":"2026-02-08T06:34:46.737Z","level":"info","scope":"cron-jobs-maxiconsumo:job:weekly-analysis","message":"JOB_START","requestId":"req-789","jobId":"test_job","runId":"run-456"}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeWeeklyAnalysis > debería generar recomendación si totalChanges > 100
{"ts":"2026-02-08T06:34:46.737Z","level":"info","scope":"cron-jobs-maxiconsumo:job:weekly-analysis","message":"TRENDS_CALCULATED","requestId":"req-789","jobId":"test_job","runId":"run-456","trends":{"total_cambios":105,"promedio_cambio":"10.00","alertas_semana":0,"alertas_criticas":0}}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeWeeklyAnalysis > debería generar recomendación si totalChanges > 100
{"ts":"2026-02-08T06:34:46.738Z","level":"info","scope":"cron-jobs-maxiconsumo:job:weekly-analysis","message":"JOB_COMPLETE","requestId":"req-789","jobId":"test_job","runId":"run-456","trends":{"total_cambios":105,"promedio_cambio":"10.00","alertas_semana":0,"alertas_criticas":0},"duration":0}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeWeeklyAnalysis > debería guardar métricas en cron_jobs_metrics
{"ts":"2026-02-08T06:34:46.739Z","level":"info","scope":"cron-jobs-maxiconsumo:job:weekly-analysis","message":"JOB_START","requestId":"req-789","jobId":"test_job","runId":"run-456"}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeWeeklyAnalysis > debería guardar métricas en cron_jobs_metrics
{"ts":"2026-02-08T06:34:46.739Z","level":"info","scope":"cron-jobs-maxiconsumo:job:weekly-analysis","message":"TRENDS_CALCULATED","requestId":"req-789","jobId":"test_job","runId":"run-456","trends":{"total_cambios":1,"promedio_cambio":"10.00","alertas_semana":0,"alertas_criticas":0}}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeWeeklyAnalysis > debería guardar métricas en cron_jobs_metrics
{"ts":"2026-02-08T06:34:46.739Z","level":"info","scope":"cron-jobs-maxiconsumo:job:weekly-analysis","message":"JOB_COMPLETE","requestId":"req-789","jobId":"test_job","runId":"run-456","trends":{"total_cambios":1,"promedio_cambio":"10.00","alertas_semana":0,"alertas_criticas":0},"duration":0}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeWeeklyAnalysis > debería manejar excepción durante ejecución
{"ts":"2026-02-08T06:34:46.739Z","level":"info","scope":"cron-jobs-maxiconsumo:job:weekly-analysis","message":"JOB_START","requestId":"req-789","jobId":"test_job","runId":"run-456"}

stderr | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeWeeklyAnalysis > debería manejar excepción durante ejecución
{"ts":"2026-02-08T06:34:46.740Z","level":"error","scope":"cron-jobs-maxiconsumo:job:weekly-analysis","message":"JOB_ERROR","requestId":"req-789","jobId":"test_job","runId":"run-456","error":"Connection refused"}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeWeeklyAnalysis > debería calcular productsProcessed como totalChanges
{"ts":"2026-02-08T06:34:46.740Z","level":"info","scope":"cron-jobs-maxiconsumo:job:weekly-analysis","message":"JOB_START","requestId":"req-789","jobId":"test_job","runId":"run-456"}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeWeeklyAnalysis > debería calcular productsProcessed como totalChanges
{"ts":"2026-02-08T06:34:46.740Z","level":"info","scope":"cron-jobs-maxiconsumo:job:weekly-analysis","message":"TRENDS_CALCULATED","requestId":"req-789","jobId":"test_job","runId":"run-456","trends":{"total_cambios":3,"promedio_cambio":"10.00","alertas_semana":0,"alertas_criticas":0}}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeWeeklyAnalysis > debería calcular productsProcessed como totalChanges
{"ts":"2026-02-08T06:34:46.740Z","level":"info","scope":"cron-jobs-maxiconsumo:job:weekly-analysis","message":"JOB_COMPLETE","requestId":"req-789","jobId":"test_job","runId":"run-456","trends":{"total_cambios":3,"promedio_cambio":"10.00","alertas_semana":0,"alertas_criticas":0},"duration":0}

 ✓ tests/unit/cron-jobs-handlers.test.ts (35 tests) 65ms
 ✓ tests/unit/api-proveedor-read-mode.test.ts (34 tests) 22ms
 ✓ tests/unit/shared-response.test.ts (22 tests) 25ms
 ✓ tests/unit/shared-circuit-breaker.test.ts (18 tests) 20ms
 ✓ tests/unit/scraper-anti-detection.test.ts (35 tests) 37ms
 ✓ tests/unit/frontend-utils.test.ts (8 tests) 7ms
stdout | tests/unit/shared-audit.test.ts > auditLog > should work in dry-run mode without supabase client
{"ts":"2026-02-08T06:34:49.190Z","level":"info","scope":"audit","message":"[AUDIT] precio_actualizado","usuario_id":"user-123","entidad_tipo":"productos","entidad_id":"prod-456","detalles":{"precio_anterior":100,"precio_nuevo":150},"nivel":"info"}

stderr | tests/unit/shared-audit.test.ts > auditLog > should work in dry-run mode without supabase client
{"ts":"2026-02-08T06:34:49.191Z","level":"warn","scope":"audit","message":"Audit log: dry-run mode, no database insert"}

stdout | tests/unit/shared-audit.test.ts > auditLog > should insert audit log with supabase client
{"ts":"2026-02-08T06:34:49.194Z","level":"info","scope":"audit","message":"[AUDIT] stock_ajustado","usuario_id":"user-456","entidad_tipo":"stock_deposito","entidad_id":"stock-789","nivel":"warning"}

stdout | tests/unit/shared-audit.test.ts > auditLog > should return error when database insert fails
{"ts":"2026-02-08T06:34:49.205Z","level":"info","scope":"audit","message":"[AUDIT] producto_eliminado","nivel":"info"}

stderr | tests/unit/shared-audit.test.ts > auditLog > should return error when database insert fails
{"ts":"2026-02-08T06:34:49.206Z","level":"error","scope":"audit","message":"Error inserting audit log","error":{"message":"Database error"}}

stdout | tests/unit/shared-audit.test.ts > auditLog > should handle exceptions gracefully
{"ts":"2026-02-08T06:34:49.208Z","level":"info","scope":"audit","message":"[AUDIT] login_fallido","nivel":"info"}

stderr | tests/unit/shared-audit.test.ts > auditLog > should handle exceptions gracefully
{"ts":"2026-02-08T06:34:49.208Z","level":"error","scope":"audit","message":"Exception in auditLog","error":"Connection failed"}

stdout | tests/unit/shared-audit.test.ts > auditLog > should use default nivel when not specified
{"ts":"2026-02-08T06:34:49.211Z","level":"info","scope":"audit","message":"[AUDIT] producto_creado","nivel":"info"}

stderr | tests/unit/shared-audit.test.ts > queryAuditLogs > should return error when query fails
{"ts":"2026-02-08T06:34:49.215Z","level":"error","scope":"audit","message":"Error querying audit logs","error":{"message":"Query failed"}}

stderr | tests/unit/shared-audit.test.ts > queryAuditLogs > should handle exceptions gracefully
{"ts":"2026-02-08T06:34:49.217Z","level":"error","scope":"audit","message":"Exception in queryAuditLogs","error":"Connection timeout"}

 ✓ tests/unit/shared-audit.test.ts (21 tests) 39ms
 ✓ tests/unit/scraper-parsing-edge-cases.test.ts (26 tests) 58ms
 ✓ tests/unit/api-reservas-concurrencia.test.ts (4 tests) 71ms
stderr | tests/unit/cron-jobs-execution-log.test.ts > execution-log > writeExecutionLog > debería manejar errores de fetch sin lanzar excepción
{"ts":"2026-02-08T06:34:50.677Z","level":"warn","scope":"cron-jobs-maxiconsumo:execution-log","message":"EXECUTION_LOG_INSERT_FAILED","requestId":"req-789","jobId":"daily_price_update","runId":"run-456","error":"Network error"}

stderr | tests/unit/cron-jobs-execution-log.test.ts > execution-log > writeExecutionLog > debería manejar respuestas no-ok sin lanzar excepción
{"ts":"2026-02-08T06:34:50.681Z","level":"warn","scope":"cron-jobs-maxiconsumo:execution-log","message":"EXECUTION_LOG_INSERT_FAILED","requestId":"req-789","jobId":"daily_price_update","runId":"run-456","status":500,"status_text":"Internal Server Error"}

 ✓ tests/unit/cron-jobs-execution-log.test.ts (17 tests) 18ms
 ✓ tests/unit/api-ofertas.test.ts (5 tests) 13ms
 ✓ tests/unit/api-proveedor-routing.test.ts (17 tests) 20ms
 ✓ tests/unit/gateway-validation.test.ts (43 tests) 18ms
 ✓ tests/unit/shared-logger.test.ts (13 tests) 12ms
 ✓ tests/unit/circuit-breaker-shared.test.ts (9 tests) 21ms
 ✓ tests/unit/api-proveedor-auth.test.ts (17 tests) 13ms
 ✓ tests/unit/shared-cors.test.ts (21 tests) 51ms
stdout | tests/unit/cron-jobs-locking.test.ts > cron-jobs-maxiconsumo/orchestrator locking > skips si no se adquiere lock
{"ts":"2026-02-08T06:34:54.508Z","level":"info","scope":"cron-jobs-maxiconsumo:orchestrator","message":"ORCHESTRATOR_EXECUTE_START","requestId":"req-1","jobId":"daily_price_update","runId":"run_1770532494508_6md3qq"}

stderr | tests/unit/cron-jobs-locking.test.ts > cron-jobs-maxiconsumo/orchestrator locking > skips si no se adquiere lock
{"ts":"2026-02-08T06:34:54.518Z","level":"warn","scope":"cron-jobs-maxiconsumo:orchestrator","message":"JOB_LOCKED","requestId":"req-1","jobId":"daily_price_update","runId":"run_1770532494508_6md3qq","lockSeconds":360}

stdout | tests/unit/cron-jobs-locking.test.ts > cron-jobs-maxiconsumo/orchestrator locking > adquiere y libera lock en ejecución exitosa
{"ts":"2026-02-08T06:34:54.539Z","level":"info","scope":"cron-jobs-maxiconsumo:orchestrator","message":"ORCHESTRATOR_EXECUTE_START","requestId":"req-2","jobId":"daily_price_update","runId":"run_1770532494538_3cgzhp"}

stdout | tests/unit/cron-jobs-locking.test.ts > cron-jobs-maxiconsumo/orchestrator locking > fallback: si RPC de lock no existe (404), ejecuta job igualmente
{"ts":"2026-02-08T06:34:54.549Z","level":"info","scope":"cron-jobs-maxiconsumo:orchestrator","message":"ORCHESTRATOR_EXECUTE_START","requestId":"req-3","jobId":"daily_price_update","runId":"run_1770532494549_5wp046"}

stderr | tests/unit/cron-jobs-locking.test.ts > cron-jobs-maxiconsumo/orchestrator locking > fallback: si RPC de lock no existe (404), ejecuta job igualmente
{"ts":"2026-02-08T06:34:54.549Z","level":"warn","scope":"cron-jobs-maxiconsumo:orchestrator","message":"JOB_LOCK_RPC_MISSING","jobId":"daily_price_update","owner":"df5ac6d3-f64b-49fe-aab6-ab2c7df47b12","action":"fallback_no_lock"}

stderr | tests/unit/cron-jobs-locking.test.ts > cron-jobs-maxiconsumo/orchestrator locking > fallback: si RPC de lock no existe (404), ejecuta job igualmente
{"ts":"2026-02-08T06:34:54.557Z","level":"warn","scope":"cron-jobs-maxiconsumo:orchestrator","message":"JOB_LOCK_RELEASE_FAILED","jobId":"daily_price_update","error":"RPC sp_release_job_lock failed: 404 Not Found"}

 ✓ tests/unit/cron-jobs-locking.test.ts (3 tests) 74ms
stdout | tests/unit/scraper-matching.test.ts > scraper-maxiconsumo/matching > performAdvancedMatching > omite coincidencias con confianza <= 20
{"ts":"2026-02-08T06:34:54.877Z","level":"info","scope":"scraper-maxiconsumo:matching","message":"MATCHING_COMPLETE","total":0}

stdout | tests/unit/scraper-matching.test.ts > scraper-maxiconsumo/matching > performAdvancedMatching > hace match por nombre normalizado cuando no hay SKU ni barcode
{"ts":"2026-02-08T06:34:54.887Z","level":"info","scope":"scraper-maxiconsumo:matching","message":"MATCHING_COMPLETE","total":1}

 ✓ tests/unit/scraper-matching.test.ts (31 tests) 52ms
 ✓ tests/unit/api-bitacora.test.ts (3 tests) 18ms
 ✓ tests/unit/cron-validators.test.ts (38 tests) 47ms
 ✓ tests/unit/shared-rate-limit.test.ts (22 tests) 18ms
 ✓ tests/unit/gateway-auth.test.ts (28 tests) 16ms
 ✓ tests/unit/frontend-hooks.test.ts (5 tests) 13ms
 ✓ tests/unit/api-ventas-pos.test.ts (4 tests) 20ms
 ✓ tests/unit/rate-limit-shared.test.ts (14 tests) 19ms
 ✓ tests/unit/cron-notifications.test.ts (10 tests) 11ms
 ✓ tests/unit/cron-jobs.test.ts (8 tests) 8ms
 ✓ tests/unit/pedidos-handlers.test.ts (29 tests) 24ms
 ✓ tests/unit/integration-contracts.test.ts (5 tests) 93ms
 ✓ tests/unit/scraper-parsing.test.ts (34 tests) 22ms
 ✓ tests/unit/cron-health-monitor.test.ts (10 tests) 11ms
 ✓ tests/unit/security-gaps.test.ts (6 tests) 15ms
 ✓ tests/unit/scraper-cache.test.ts (4 tests) 16ms
 ✓ tests/unit/gateway-pagination.test.ts (20 tests) 13ms
 ✓ tests/unit/scraper-alertas.test.ts (3 tests) 4ms

 Test Files  44 passed (44)
      Tests  785 passed (785)
   Start at  06:34:42
   Duration  21.76s (transform 2.19s, setup 6.08s, import 3.03s, tests 1.68s, environment 40.41s)

JUNIT report written to /home/eevan/ProyectosIA/aidrive_genspark__review_fase1_fase2_20260208/test-reports/junit.xml
```

## RETEST (api-proveedor auth)

```bash
npm run test:unit -- tests/unit/api-proveedor-auth.test.ts 
```

```

> workspace@1.0.0 test:unit
> vitest run tests/unit tests/unit/api-proveedor-auth.test.ts


 RUN  v4.0.16 /home/eevan/ProyectosIA/aidrive_genspark__review_fase1_fase2_20260208

 ✓ tests/unit/resilience-gaps.test.ts (5 tests) 98ms
 ✓ tests/unit/strategic-high-value.test.ts (27 tests) 123ms
stdout | tests/unit/scraper-storage-auth.test.ts > storage key separation runtime > usa readKey para lecturas y writeKey para inserciones/actualizaciones
{"ts":"2026-02-08T06:35:05.847Z","level":"info","scope":"scraper-maxiconsumo:storage","message":"BATCH_INSERT_SUCCESS","requestId":"rw-1","count":1}

stdout | tests/unit/scraper-storage-auth.test.ts > storage key separation runtime > usa readKey para lecturas y writeKey para inserciones/actualizaciones
{"ts":"2026-02-08T06:35:05.964Z","level":"info","scope":"scraper-maxiconsumo:storage","message":"BATCH_UPDATE_COMPLETE","requestId":"rw-1","count":1}

stdout | tests/unit/scraper-storage-auth.test.ts > storage key separation runtime > usa writeKey también para lecturas cuando readKey=service (modo service)
{"ts":"2026-02-08T06:35:05.968Z","level":"info","scope":"scraper-maxiconsumo:storage","message":"BATCH_INSERT_SUCCESS","requestId":"rw-2","count":1}

 ✓ tests/unit/scraper-storage-auth.test.ts (32 tests) 138ms
 ✓ tests/unit/scraper-config.test.ts (22 tests) 39ms
 ✓ tests/unit/integration-contracts.test.ts (5 tests) 47ms
 ✓ tests/unit/boundary-edge-cases.test.ts (9 tests) 71ms
 ✓ tests/unit/api-reservas-concurrencia.test.ts (4 tests) 40ms
stdout | tests/unit/cron-jobs-locking.test.ts > cron-jobs-maxiconsumo/orchestrator locking > skips si no se adquiere lock
{"ts":"2026-02-08T06:35:08.540Z","level":"info","scope":"cron-jobs-maxiconsumo:orchestrator","message":"ORCHESTRATOR_EXECUTE_START","requestId":"req-1","jobId":"daily_price_update","runId":"run_1770532508540_e1p1wc"}

stderr | tests/unit/cron-jobs-locking.test.ts > cron-jobs-maxiconsumo/orchestrator locking > skips si no se adquiere lock
{"ts":"2026-02-08T06:35:08.542Z","level":"warn","scope":"cron-jobs-maxiconsumo:orchestrator","message":"JOB_LOCKED","requestId":"req-1","jobId":"daily_price_update","runId":"run_1770532508540_e1p1wc","lockSeconds":360}

stdout | tests/unit/cron-jobs-locking.test.ts > cron-jobs-maxiconsumo/orchestrator locking > adquiere y libera lock en ejecución exitosa
{"ts":"2026-02-08T06:35:08.552Z","level":"info","scope":"cron-jobs-maxiconsumo:orchestrator","message":"ORCHESTRATOR_EXECUTE_START","requestId":"req-2","jobId":"daily_price_update","runId":"run_1770532508552_yzl1k6"}

stderr | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeDailyPriceUpdate > debería retornar error si contexto es inválido
{"ts":"2026-02-08T06:35:08.545Z","level":"error","scope":"cron-jobs-maxiconsumo:job:daily-price-update","message":"VALIDATION_FAILED","field":"ctx.jobId","reason":"must be a non-empty string"}

stdout | tests/unit/cron-jobs-locking.test.ts > cron-jobs-maxiconsumo/orchestrator locking > fallback: si RPC de lock no existe (404), ejecuta job igualmente
{"ts":"2026-02-08T06:35:08.553Z","level":"info","scope":"cron-jobs-maxiconsumo:orchestrator","message":"ORCHESTRATOR_EXECUTE_START","requestId":"req-3","jobId":"daily_price_update","runId":"run_1770532508553_muw9w9"}

stderr | tests/unit/cron-jobs-locking.test.ts > cron-jobs-maxiconsumo/orchestrator locking > fallback: si RPC de lock no existe (404), ejecuta job igualmente
{"ts":"2026-02-08T06:35:08.553Z","level":"warn","scope":"cron-jobs-maxiconsumo:orchestrator","message":"JOB_LOCK_RPC_MISSING","jobId":"daily_price_update","owner":"e410c0c9-dbba-43ef-99f4-932d396610c3","action":"fallback_no_lock"}

stderr | tests/unit/cron-jobs-locking.test.ts > cron-jobs-maxiconsumo/orchestrator locking > fallback: si RPC de lock no existe (404), ejecuta job igualmente
{"ts":"2026-02-08T06:35:08.554Z","level":"warn","scope":"cron-jobs-maxiconsumo:orchestrator","message":"JOB_LOCK_RELEASE_FAILED","jobId":"daily_price_update","error":"RPC sp_release_job_lock failed: 404 Not Found"}

stderr | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeDailyPriceUpdate > debería retornar error si supabaseUrl está vacío
{"ts":"2026-02-08T06:35:08.554Z","level":"error","scope":"cron-jobs-maxiconsumo:job:daily-price-update","message":"VALIDATION_FAILED","field":"supabaseUrl","reason":"must be a valid URL"}

stderr | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeDailyPriceUpdate > debería retornar error si serviceRoleKey está vacío
{"ts":"2026-02-08T06:35:08.555Z","level":"error","scope":"cron-jobs-maxiconsumo:job:daily-price-update","message":"VALIDATION_FAILED","field":"serviceRoleKey","reason":"must be a non-empty string"}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeDailyPriceUpdate > debería procesar correctamente cuando scraper responde OK
{"ts":"2026-02-08T06:35:08.556Z","level":"info","scope":"cron-jobs-maxiconsumo:job:daily-price-update","message":"JOB_START","requestId":"req-789","jobId":"test_job","runId":"run-456"}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeDailyPriceUpdate > debería procesar correctamente cuando scraper responde OK
{"ts":"2026-02-08T06:35:08.556Z","level":"info","scope":"cron-jobs-maxiconsumo:job:daily-price-update","message":"SCRAPING_COMPLETE","requestId":"req-789","jobId":"test_job","runId":"run-456","processed":50,"successful":45}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeDailyPriceUpdate > debería procesar correctamente cuando scraper responde OK
{"ts":"2026-02-08T06:35:08.557Z","level":"info","scope":"cron-jobs-maxiconsumo:job:daily-price-update","message":"JOB_COMPLETE","requestId":"req-789","jobId":"test_job","runId":"run-456","processed":50,"alerts":5,"duration":0}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeDailyPriceUpdate > debería manejar error del scraper
{"ts":"2026-02-08T06:35:08.557Z","level":"info","scope":"cron-jobs-maxiconsumo:job:daily-price-update","message":"JOB_START","requestId":"req-789","jobId":"test_job","runId":"run-456"}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeDailyPriceUpdate > debería manejar error del scraper
{"ts":"2026-02-08T06:35:08.557Z","level":"info","scope":"cron-jobs-maxiconsumo:job:daily-price-update","message":"JOB_COMPLETE","requestId":"req-789","jobId":"test_job","runId":"run-456","processed":0,"alerts":0,"duration":0}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeDailyPriceUpdate > debería manejar excepción durante ejecución
{"ts":"2026-02-08T06:35:08.559Z","level":"info","scope":"cron-jobs-maxiconsumo:job:daily-price-update","message":"JOB_START","requestId":"req-789","jobId":"test_job","runId":"run-456"}

stderr | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeDailyPriceUpdate > debería manejar excepción durante ejecución
{"ts":"2026-02-08T06:35:08.560Z","level":"error","scope":"cron-jobs-maxiconsumo:job:daily-price-update","message":"JOB_ERROR","requestId":"req-789","jobId":"test_job","runId":"run-456","error":"Network failure"}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeDailyPriceUpdate > debería calcular executionTimeMs correctamente
{"ts":"2026-02-08T06:35:08.561Z","level":"info","scope":"cron-jobs-maxiconsumo:job:daily-price-update","message":"JOB_START","requestId":"req-789","jobId":"test_job","runId":"run-456"}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeDailyPriceUpdate > debería calcular executionTimeMs correctamente
{"ts":"2026-02-08T06:35:08.561Z","level":"info","scope":"cron-jobs-maxiconsumo:job:daily-price-update","message":"SCRAPING_COMPLETE","requestId":"req-789","jobId":"test_job","runId":"run-456","processed":10,"successful":10}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeDailyPriceUpdate > debería calcular executionTimeMs correctamente
{"ts":"2026-02-08T06:35:08.562Z","level":"info","scope":"cron-jobs-maxiconsumo:job:daily-price-update","message":"JOB_COMPLETE","requestId":"req-789","jobId":"test_job","runId":"run-456","processed":10,"alerts":0,"duration":1}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeDailyPriceUpdate > debería llamar al endpoint correcto del scraper
{"ts":"2026-02-08T06:35:08.563Z","level":"info","scope":"cron-jobs-maxiconsumo:job:daily-price-update","message":"JOB_START","requestId":"req-789","jobId":"test_job","runId":"run-456"}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeDailyPriceUpdate > debería llamar al endpoint correcto del scraper
{"ts":"2026-02-08T06:35:08.563Z","level":"info","scope":"cron-jobs-maxiconsumo:job:daily-price-update","message":"SCRAPING_COMPLETE","requestId":"req-789","jobId":"test_job","runId":"run-456","processed":0,"successful":0}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeDailyPriceUpdate > debería llamar al endpoint correcto del scraper
{"ts":"2026-02-08T06:35:08.563Z","level":"info","scope":"cron-jobs-maxiconsumo:job:daily-price-update","message":"JOB_COMPLETE","requestId":"req-789","jobId":"test_job","runId":"run-456","processed":0,"alerts":0,"duration":0}

 ✓ tests/unit/cron-jobs-locking.test.ts (3 tests) 21ms
stderr | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeMaintenanceCleanup > debería retornar error si contexto es inválido
{"ts":"2026-02-08T06:35:08.569Z","level":"error","scope":"cron-jobs-maxiconsumo:job:maintenance","message":"VALIDATION_FAILED","field":"ctx.jobId","reason":"must be a non-empty string"}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeMaintenanceCleanup > debería limpiar registros antiguos correctamente
{"ts":"2026-02-08T06:35:08.573Z","level":"info","scope":"cron-jobs-maxiconsumo:job:maintenance","message":"JOB_START","requestId":"req-789","jobId":"test_job","runId":"run-456"}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeMaintenanceCleanup > debería limpiar registros antiguos correctamente
{"ts":"2026-02-08T06:35:08.574Z","level":"info","scope":"cron-jobs-maxiconsumo:job:maintenance","message":"LOGS_CLEANED","requestId":"req-789","jobId":"test_job","runId":"run-456","count":2}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeMaintenanceCleanup > debería limpiar registros antiguos correctamente
{"ts":"2026-02-08T06:35:08.575Z","level":"info","scope":"cron-jobs-maxiconsumo:job:maintenance","message":"JOB_COMPLETE","requestId":"req-789","jobId":"test_job","runId":"run-456","metrics":{"logs_deleted":2,"metrics_deleted":1,"alerts_deleted":0},"duration":1}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeMaintenanceCleanup > debería usar parámetros de retención personalizados
{"ts":"2026-02-08T06:35:08.575Z","level":"info","scope":"cron-jobs-maxiconsumo:job:maintenance","message":"JOB_START","requestId":"req-789","jobId":"test_job","runId":"run-456"}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeMaintenanceCleanup > debería usar parámetros de retención personalizados
{"ts":"2026-02-08T06:35:08.578Z","level":"info","scope":"cron-jobs-maxiconsumo:job:maintenance","message":"LOGS_CLEANED","requestId":"req-789","jobId":"test_job","runId":"run-456","count":0}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeMaintenanceCleanup > debería usar parámetros de retención personalizados
{"ts":"2026-02-08T06:35:08.579Z","level":"info","scope":"cron-jobs-maxiconsumo:job:maintenance","message":"JOB_COMPLETE","requestId":"req-789","jobId":"test_job","runId":"run-456","metrics":{"logs_deleted":0,"metrics_deleted":0,"alerts_deleted":0},"duration":2}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeMaintenanceCleanup > debería recomendar reducir retención si limpia muchos registros
{"ts":"2026-02-08T06:35:08.581Z","level":"info","scope":"cron-jobs-maxiconsumo:job:maintenance","message":"JOB_START","requestId":"req-789","jobId":"test_job","runId":"run-456"}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeMaintenanceCleanup > debería recomendar reducir retención si limpia muchos registros
{"ts":"2026-02-08T06:35:08.581Z","level":"info","scope":"cron-jobs-maxiconsumo:job:maintenance","message":"LOGS_CLEANED","requestId":"req-789","jobId":"test_job","runId":"run-456","count":500}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeMaintenanceCleanup > debería recomendar reducir retención si limpia muchos registros
{"ts":"2026-02-08T06:35:08.582Z","level":"info","scope":"cron-jobs-maxiconsumo:job:maintenance","message":"JOB_COMPLETE","requestId":"req-789","jobId":"test_job","runId":"run-456","metrics":{"logs_deleted":500,"metrics_deleted":400,"alerts_deleted":200},"duration":1}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeMaintenanceCleanup > debería manejar excepción durante ejecución
{"ts":"2026-02-08T06:35:08.582Z","level":"info","scope":"cron-jobs-maxiconsumo:job:maintenance","message":"JOB_START","requestId":"req-789","jobId":"test_job","runId":"run-456"}

stderr | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeMaintenanceCleanup > debería manejar excepción durante ejecución
{"ts":"2026-02-08T06:35:08.582Z","level":"error","scope":"cron-jobs-maxiconsumo:job:maintenance","message":"JOB_ERROR","requestId":"req-789","jobId":"test_job","runId":"run-456","error":"Database error"}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeMaintenanceCleanup > debería usar headers correctos para DELETE
{"ts":"2026-02-08T06:35:08.583Z","level":"info","scope":"cron-jobs-maxiconsumo:job:maintenance","message":"JOB_START","requestId":"req-789","jobId":"test_job","runId":"run-456"}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeMaintenanceCleanup > debería usar headers correctos para DELETE
{"ts":"2026-02-08T06:35:08.583Z","level":"info","scope":"cron-jobs-maxiconsumo:job:maintenance","message":"LOGS_CLEANED","requestId":"req-789","jobId":"test_job","runId":"run-456","count":0}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeMaintenanceCleanup > debería usar headers correctos para DELETE
{"ts":"2026-02-08T06:35:08.583Z","level":"info","scope":"cron-jobs-maxiconsumo:job:maintenance","message":"JOB_COMPLETE","requestId":"req-789","jobId":"test_job","runId":"run-456","metrics":{"logs_deleted":0,"metrics_deleted":0,"alerts_deleted":0},"duration":0}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeMaintenanceCleanup > debería calcular productsProcessed como total limpiado
{"ts":"2026-02-08T06:35:08.587Z","level":"info","scope":"cron-jobs-maxiconsumo:job:maintenance","message":"JOB_START","requestId":"req-789","jobId":"test_job","runId":"run-456"}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeMaintenanceCleanup > debería calcular productsProcessed como total limpiado
{"ts":"2026-02-08T06:35:08.589Z","level":"info","scope":"cron-jobs-maxiconsumo:job:maintenance","message":"LOGS_CLEANED","requestId":"req-789","jobId":"test_job","runId":"run-456","count":3}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeMaintenanceCleanup > debería calcular productsProcessed como total limpiado
{"ts":"2026-02-08T06:35:08.589Z","level":"info","scope":"cron-jobs-maxiconsumo:job:maintenance","message":"JOB_COMPLETE","requestId":"req-789","jobId":"test_job","runId":"run-456","metrics":{"logs_deleted":3,"metrics_deleted":2,"alerts_deleted":1},"duration":0}

stderr | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeRealtimeAlerts > debería retornar error si contexto es inválido
{"ts":"2026-02-08T06:35:08.592Z","level":"error","scope":"cron-jobs-maxiconsumo:job:realtime-alerts","message":"VALIDATION_FAILED","field":"ctx.jobId","reason":"must be a non-empty string"}

stderr | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeRealtimeAlerts > debería retornar error si supabaseUrl está vacío
{"ts":"2026-02-08T06:35:08.593Z","level":"error","scope":"cron-jobs-maxiconsumo:job:realtime-alerts","message":"VALIDATION_FAILED","field":"supabaseUrl","reason":"must be a valid URL"}

stderr | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeRealtimeAlerts > debería retornar error si serviceRoleKey está vacío
{"ts":"2026-02-08T06:35:08.596Z","level":"error","scope":"cron-jobs-maxiconsumo:job:realtime-alerts","message":"VALIDATION_FAILED","field":"serviceRoleKey","reason":"must be a non-empty string"}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeRealtimeAlerts > debería procesar alertas críticas correctamente
{"ts":"2026-02-08T06:35:08.598Z","level":"info","scope":"cron-jobs-maxiconsumo:job:realtime-alerts","message":"JOB_START","requestId":"req-789","jobId":"test_job","runId":"run-456"}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeRealtimeAlerts > debería procesar alertas críticas correctamente
{"ts":"2026-02-08T06:35:08.602Z","level":"info","scope":"cron-jobs-maxiconsumo:job:realtime-alerts","message":"CHANGES_DETECTED","requestId":"req-789","jobId":"test_job","runId":"run-456","total":2,"critical":2}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeRealtimeAlerts > debería procesar alertas críticas correctamente
{"ts":"2026-02-08T06:35:08.602Z","level":"info","scope":"cron-jobs-maxiconsumo:job:realtime-alerts","message":"JOB_COMPLETE","requestId":"req-789","jobId":"test_job","runId":"run-456","alerts":2,"duration":4}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeRealtimeAlerts > debería no generar alertas si cambios están bajo threshold
{"ts":"2026-02-08T06:35:08.603Z","level":"info","scope":"cron-jobs-maxiconsumo:job:realtime-alerts","message":"JOB_START","requestId":"req-789","jobId":"test_job","runId":"run-456"}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeRealtimeAlerts > debería no generar alertas si cambios están bajo threshold
{"ts":"2026-02-08T06:35:08.603Z","level":"info","scope":"cron-jobs-maxiconsumo:job:realtime-alerts","message":"CHANGES_DETECTED","requestId":"req-789","jobId":"test_job","runId":"run-456","total":1,"critical":0}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeRealtimeAlerts > debería no generar alertas si cambios están bajo threshold
{"ts":"2026-02-08T06:35:08.603Z","level":"info","scope":"cron-jobs-maxiconsumo:job:realtime-alerts","message":"JOB_COMPLETE","requestId":"req-789","jobId":"test_job","runId":"run-456","alerts":0,"duration":0}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeRealtimeAlerts > debería usar threshold personalizado de parámetros
{"ts":"2026-02-08T06:35:08.604Z","level":"info","scope":"cron-jobs-maxiconsumo:job:realtime-alerts","message":"JOB_START","requestId":"req-789","jobId":"test_job","runId":"run-456"}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeRealtimeAlerts > debería usar threshold personalizado de parámetros
{"ts":"2026-02-08T06:35:08.604Z","level":"info","scope":"cron-jobs-maxiconsumo:job:realtime-alerts","message":"CHANGES_DETECTED","requestId":"req-789","jobId":"test_job","runId":"run-456","total":1,"critical":1}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeRealtimeAlerts > debería usar threshold personalizado de parámetros
{"ts":"2026-02-08T06:35:08.604Z","level":"info","scope":"cron-jobs-maxiconsumo:job:realtime-alerts","message":"JOB_COMPLETE","requestId":"req-789","jobId":"test_job","runId":"run-456","alerts":1,"duration":0}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeRealtimeAlerts > debería manejar excepción durante ejecución
{"ts":"2026-02-08T06:35:08.604Z","level":"info","scope":"cron-jobs-maxiconsumo:job:realtime-alerts","message":"JOB_START","requestId":"req-789","jobId":"test_job","runId":"run-456"}

stderr | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeRealtimeAlerts > debería manejar excepción durante ejecución
{"ts":"2026-02-08T06:35:08.605Z","level":"error","scope":"cron-jobs-maxiconsumo:job:realtime-alerts","message":"JOB_ERROR","requestId":"req-789","jobId":"test_job","runId":"run-456","error":"Database timeout"}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeRealtimeAlerts > debería calcular executionTimeMs correctamente
{"ts":"2026-02-08T06:35:08.605Z","level":"info","scope":"cron-jobs-maxiconsumo:job:realtime-alerts","message":"JOB_START","requestId":"req-789","jobId":"test_job","runId":"run-456"}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeRealtimeAlerts > debería calcular executionTimeMs correctamente
{"ts":"2026-02-08T06:35:08.605Z","level":"info","scope":"cron-jobs-maxiconsumo:job:realtime-alerts","message":"CHANGES_DETECTED","requestId":"req-789","jobId":"test_job","runId":"run-456","total":0,"critical":0}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeRealtimeAlerts > debería calcular executionTimeMs correctamente
{"ts":"2026-02-08T06:35:08.605Z","level":"info","scope":"cron-jobs-maxiconsumo:job:realtime-alerts","message":"JOB_COMPLETE","requestId":"req-789","jobId":"test_job","runId":"run-456","alerts":0,"duration":0}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeRealtimeAlerts > debería consultar precios de los últimos 15 minutos
{"ts":"2026-02-08T06:35:08.606Z","level":"info","scope":"cron-jobs-maxiconsumo:job:realtime-alerts","message":"JOB_START","requestId":"req-789","jobId":"test_job","runId":"run-456"}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeRealtimeAlerts > debería consultar precios de los últimos 15 minutos
{"ts":"2026-02-08T06:35:08.606Z","level":"info","scope":"cron-jobs-maxiconsumo:job:realtime-alerts","message":"CHANGES_DETECTED","requestId":"req-789","jobId":"test_job","runId":"run-456","total":0,"critical":0}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeRealtimeAlerts > debería consultar precios de los últimos 15 minutos
{"ts":"2026-02-08T06:35:08.606Z","level":"info","scope":"cron-jobs-maxiconsumo:job:realtime-alerts","message":"JOB_COMPLETE","requestId":"req-789","jobId":"test_job","runId":"run-456","alerts":0,"duration":0}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeRealtimeAlerts > debería crear alertas con severidad crítica
{"ts":"2026-02-08T06:35:08.606Z","level":"info","scope":"cron-jobs-maxiconsumo:job:realtime-alerts","message":"JOB_START","requestId":"req-789","jobId":"test_job","runId":"run-456"}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeRealtimeAlerts > debería crear alertas con severidad crítica
{"ts":"2026-02-08T06:35:08.606Z","level":"info","scope":"cron-jobs-maxiconsumo:job:realtime-alerts","message":"CHANGES_DETECTED","requestId":"req-789","jobId":"test_job","runId":"run-456","total":1,"critical":1}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeRealtimeAlerts > debería crear alertas con severidad crítica
{"ts":"2026-02-08T06:35:08.614Z","level":"info","scope":"cron-jobs-maxiconsumo:job:realtime-alerts","message":"JOB_COMPLETE","requestId":"req-789","jobId":"test_job","runId":"run-456","alerts":1,"duration":8}

stderr | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeWeeklyAnalysis > debería retornar error si contexto es inválido
{"ts":"2026-02-08T06:35:08.615Z","level":"error","scope":"cron-jobs-maxiconsumo:job:weekly-analysis","message":"VALIDATION_FAILED","field":"ctx.jobId","reason":"must be a non-empty string"}

stderr | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeWeeklyAnalysis > debería retornar error si supabaseUrl está vacío
{"ts":"2026-02-08T06:35:08.616Z","level":"error","scope":"cron-jobs-maxiconsumo:job:weekly-analysis","message":"VALIDATION_FAILED","field":"supabaseUrl","reason":"must be a valid URL"}

stderr | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeWeeklyAnalysis > debería retornar error si serviceRoleKey está vacío
{"ts":"2026-02-08T06:35:08.616Z","level":"error","scope":"cron-jobs-maxiconsumo:job:weekly-analysis","message":"VALIDATION_FAILED","field":"serviceRoleKey","reason":"must be a non-empty string"}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeWeeklyAnalysis > debería calcular trends correctamente con datos válidos
{"ts":"2026-02-08T06:35:08.617Z","level":"info","scope":"cron-jobs-maxiconsumo:job:weekly-analysis","message":"JOB_START","requestId":"req-789","jobId":"test_job","runId":"run-456"}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeWeeklyAnalysis > debería calcular trends correctamente con datos válidos
{"ts":"2026-02-08T06:35:08.617Z","level":"info","scope":"cron-jobs-maxiconsumo:job:weekly-analysis","message":"TRENDS_CALCULATED","requestId":"req-789","jobId":"test_job","runId":"run-456","trends":{"total_cambios":2,"promedio_cambio":"20.00","alertas_semana":2,"alertas_criticas":1}}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeWeeklyAnalysis > debería calcular trends correctamente con datos válidos
{"ts":"2026-02-08T06:35:08.617Z","level":"info","scope":"cron-jobs-maxiconsumo:job:weekly-analysis","message":"JOB_COMPLETE","requestId":"req-789","jobId":"test_job","runId":"run-456","trends":{"total_cambios":2,"promedio_cambio":"20.00","alertas_semana":2,"alertas_criticas":1},"duration":0}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeWeeklyAnalysis > debería manejar respuestas vacías correctamente
{"ts":"2026-02-08T06:35:08.617Z","level":"info","scope":"cron-jobs-maxiconsumo:job:weekly-analysis","message":"JOB_START","requestId":"req-789","jobId":"test_job","runId":"run-456"}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeWeeklyAnalysis > debería manejar respuestas vacías correctamente
{"ts":"2026-02-08T06:35:08.618Z","level":"info","scope":"cron-jobs-maxiconsumo:job:weekly-analysis","message":"TRENDS_CALCULATED","requestId":"req-789","jobId":"test_job","runId":"run-456","trends":{"total_cambios":0,"promedio_cambio":"0.00","alertas_semana":0,"alertas_criticas":0}}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeWeeklyAnalysis > debería manejar respuestas vacías correctamente
{"ts":"2026-02-08T06:35:08.618Z","level":"info","scope":"cron-jobs-maxiconsumo:job:weekly-analysis","message":"JOB_COMPLETE","requestId":"req-789","jobId":"test_job","runId":"run-456","trends":{"total_cambios":0,"promedio_cambio":"0.00","alertas_semana":0,"alertas_criticas":0},"duration":1}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeWeeklyAnalysis > debería generar recomendación si alertas críticas > 10
{"ts":"2026-02-08T06:35:08.618Z","level":"info","scope":"cron-jobs-maxiconsumo:job:weekly-analysis","message":"JOB_START","requestId":"req-789","jobId":"test_job","runId":"run-456"}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeWeeklyAnalysis > debería generar recomendación si alertas críticas > 10
{"ts":"2026-02-08T06:35:08.618Z","level":"info","scope":"cron-jobs-maxiconsumo:job:weekly-analysis","message":"TRENDS_CALCULATED","requestId":"req-789","jobId":"test_job","runId":"run-456","trends":{"total_cambios":0,"promedio_cambio":"0.00","alertas_semana":12,"alertas_criticas":12}}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeWeeklyAnalysis > debería generar recomendación si alertas críticas > 10
{"ts":"2026-02-08T06:35:08.618Z","level":"info","scope":"cron-jobs-maxiconsumo:job:weekly-analysis","message":"JOB_COMPLETE","requestId":"req-789","jobId":"test_job","runId":"run-456","trends":{"total_cambios":0,"promedio_cambio":"0.00","alertas_semana":12,"alertas_criticas":12},"duration":0}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeWeeklyAnalysis > debería generar recomendación si totalChanges > 100
{"ts":"2026-02-08T06:35:08.623Z","level":"info","scope":"cron-jobs-maxiconsumo:job:weekly-analysis","message":"JOB_START","requestId":"req-789","jobId":"test_job","runId":"run-456"}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeWeeklyAnalysis > debería generar recomendación si totalChanges > 100
{"ts":"2026-02-08T06:35:08.624Z","level":"info","scope":"cron-jobs-maxiconsumo:job:weekly-analysis","message":"TRENDS_CALCULATED","requestId":"req-789","jobId":"test_job","runId":"run-456","trends":{"total_cambios":105,"promedio_cambio":"10.00","alertas_semana":0,"alertas_criticas":0}}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeWeeklyAnalysis > debería generar recomendación si totalChanges > 100
{"ts":"2026-02-08T06:35:08.624Z","level":"info","scope":"cron-jobs-maxiconsumo:job:weekly-analysis","message":"JOB_COMPLETE","requestId":"req-789","jobId":"test_job","runId":"run-456","trends":{"total_cambios":105,"promedio_cambio":"10.00","alertas_semana":0,"alertas_criticas":0},"duration":1}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeWeeklyAnalysis > debería guardar métricas en cron_jobs_metrics
{"ts":"2026-02-08T06:35:08.624Z","level":"info","scope":"cron-jobs-maxiconsumo:job:weekly-analysis","message":"JOB_START","requestId":"req-789","jobId":"test_job","runId":"run-456"}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeWeeklyAnalysis > debería guardar métricas en cron_jobs_metrics
{"ts":"2026-02-08T06:35:08.625Z","level":"info","scope":"cron-jobs-maxiconsumo:job:weekly-analysis","message":"TRENDS_CALCULATED","requestId":"req-789","jobId":"test_job","runId":"run-456","trends":{"total_cambios":1,"promedio_cambio":"10.00","alertas_semana":0,"alertas_criticas":0}}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeWeeklyAnalysis > debería guardar métricas en cron_jobs_metrics
{"ts":"2026-02-08T06:35:08.625Z","level":"info","scope":"cron-jobs-maxiconsumo:job:weekly-analysis","message":"JOB_COMPLETE","requestId":"req-789","jobId":"test_job","runId":"run-456","trends":{"total_cambios":1,"promedio_cambio":"10.00","alertas_semana":0,"alertas_criticas":0},"duration":1}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeWeeklyAnalysis > debería manejar excepción durante ejecución
{"ts":"2026-02-08T06:35:08.625Z","level":"info","scope":"cron-jobs-maxiconsumo:job:weekly-analysis","message":"JOB_START","requestId":"req-789","jobId":"test_job","runId":"run-456"}

stderr | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeWeeklyAnalysis > debería manejar excepción durante ejecución
{"ts":"2026-02-08T06:35:08.625Z","level":"error","scope":"cron-jobs-maxiconsumo:job:weekly-analysis","message":"JOB_ERROR","requestId":"req-789","jobId":"test_job","runId":"run-456","error":"Connection refused"}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeWeeklyAnalysis > debería calcular productsProcessed como totalChanges
{"ts":"2026-02-08T06:35:08.626Z","level":"info","scope":"cron-jobs-maxiconsumo:job:weekly-analysis","message":"JOB_START","requestId":"req-789","jobId":"test_job","runId":"run-456"}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeWeeklyAnalysis > debería calcular productsProcessed como totalChanges
{"ts":"2026-02-08T06:35:08.626Z","level":"info","scope":"cron-jobs-maxiconsumo:job:weekly-analysis","message":"TRENDS_CALCULATED","requestId":"req-789","jobId":"test_job","runId":"run-456","trends":{"total_cambios":3,"promedio_cambio":"10.00","alertas_semana":0,"alertas_criticas":0}}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeWeeklyAnalysis > debería calcular productsProcessed como totalChanges
{"ts":"2026-02-08T06:35:08.626Z","level":"info","scope":"cron-jobs-maxiconsumo:job:weekly-analysis","message":"JOB_COMPLETE","requestId":"req-789","jobId":"test_job","runId":"run-456","trends":{"total_cambios":3,"promedio_cambio":"10.00","alertas_semana":0,"alertas_criticas":0},"duration":0}

 ✓ tests/unit/cron-jobs-handlers.test.ts (35 tests) 88ms
 ✓ tests/unit/scraper-parsing-edge-cases.test.ts (26 tests) 45ms
stdout | tests/unit/scraper-matching.test.ts > scraper-maxiconsumo/matching > performAdvancedMatching > omite coincidencias con confianza <= 20
{"ts":"2026-02-08T06:35:10.085Z","level":"info","scope":"scraper-maxiconsumo:matching","message":"MATCHING_COMPLETE","total":0}

stdout | tests/unit/scraper-matching.test.ts > scraper-maxiconsumo/matching > performAdvancedMatching > hace match por nombre normalizado cuando no hay SKU ni barcode
{"ts":"2026-02-08T06:35:10.096Z","level":"info","scope":"scraper-maxiconsumo:matching","message":"MATCHING_COMPLETE","total":1}

 ✓ tests/unit/scraper-matching.test.ts (31 tests) 78ms
 ✓ tests/unit/shared-cors.test.ts (21 tests) 46ms
 ✓ tests/unit/cron-validators.test.ts (38 tests) 18ms
 ✓ tests/unit/auth-resilient.test.ts (16 tests) 68ms
 ✓ tests/unit/scraper-cookie-jar.test.ts (20 tests) 51ms
stdout | tests/unit/shared-audit.test.ts > auditLog > should work in dry-run mode without supabase client
{"ts":"2026-02-08T06:35:12.775Z","level":"info","scope":"audit","message":"[AUDIT] precio_actualizado","usuario_id":"user-123","entidad_tipo":"productos","entidad_id":"prod-456","detalles":{"precio_anterior":100,"precio_nuevo":150},"nivel":"info"}

stderr | tests/unit/shared-audit.test.ts > auditLog > should work in dry-run mode without supabase client
{"ts":"2026-02-08T06:35:12.777Z","level":"warn","scope":"audit","message":"Audit log: dry-run mode, no database insert"}

stdout | tests/unit/shared-audit.test.ts > auditLog > should insert audit log with supabase client
{"ts":"2026-02-08T06:35:12.782Z","level":"info","scope":"audit","message":"[AUDIT] stock_ajustado","usuario_id":"user-456","entidad_tipo":"stock_deposito","entidad_id":"stock-789","nivel":"warning"}

stdout | tests/unit/shared-audit.test.ts > auditLog > should return error when database insert fails
{"ts":"2026-02-08T06:35:12.786Z","level":"info","scope":"audit","message":"[AUDIT] producto_eliminado","nivel":"info"}

stderr | tests/unit/shared-audit.test.ts > auditLog > should return error when database insert fails
{"ts":"2026-02-08T06:35:12.787Z","level":"error","scope":"audit","message":"Error inserting audit log","error":{"message":"Database error"}}

stdout | tests/unit/shared-audit.test.ts > auditLog > should handle exceptions gracefully
{"ts":"2026-02-08T06:35:12.789Z","level":"info","scope":"audit","message":"[AUDIT] login_fallido","nivel":"info"}

stderr | tests/unit/shared-audit.test.ts > auditLog > should handle exceptions gracefully
{"ts":"2026-02-08T06:35:12.789Z","level":"error","scope":"audit","message":"Exception in auditLog","error":"Connection failed"}

stdout | tests/unit/shared-audit.test.ts > auditLog > should use default nivel when not specified
{"ts":"2026-02-08T06:35:12.791Z","level":"info","scope":"audit","message":"[AUDIT] producto_creado","nivel":"info"}

stderr | tests/unit/shared-audit.test.ts > queryAuditLogs > should return error when query fails
{"ts":"2026-02-08T06:35:12.795Z","level":"error","scope":"audit","message":"Error querying audit logs","error":{"message":"Query failed"}}

stderr | tests/unit/shared-audit.test.ts > queryAuditLogs > should handle exceptions gracefully
{"ts":"2026-02-08T06:35:12.796Z","level":"error","scope":"audit","message":"Exception in queryAuditLogs","error":"Connection timeout"}

 ✓ tests/unit/shared-audit.test.ts (21 tests) 35ms
 ✓ tests/unit/scraper-anti-detection.test.ts (35 tests) 43ms
 ✓ tests/unit/shared-response.test.ts (22 tests) 37ms
 ✓ tests/unit/shared-errors.test.ts (32 tests) 30ms
 ✓ tests/unit/pedidos-handlers.test.ts (29 tests) 18ms
 ✓ tests/unit/scraper-parsing.test.ts (34 tests) 14ms
 ✓ tests/unit/api-proveedor-read-mode.test.ts (34 tests) 28ms
 ✓ tests/unit/circuit-breaker-shared.test.ts (9 tests) 11ms
 ✓ tests/unit/api-proveedor-routing.test.ts (17 tests) 21ms
 ✓ tests/unit/shared-circuit-breaker.test.ts (18 tests) 21ms
 ✓ tests/unit/api-ventas-pos.test.ts (4 tests) 18ms
 ✓ tests/unit/rate-limit-shared.test.ts (14 tests) 38ms
 ✓ tests/unit/api-bitacora.test.ts (3 tests) 12ms
stderr | tests/unit/cron-jobs-execution-log.test.ts > execution-log > writeExecutionLog > debería manejar errores de fetch sin lanzar excepción
{"ts":"2026-02-08T06:35:18.257Z","level":"warn","scope":"cron-jobs-maxiconsumo:execution-log","message":"EXECUTION_LOG_INSERT_FAILED","requestId":"req-789","jobId":"daily_price_update","runId":"run-456","error":"Network error"}

stderr | tests/unit/cron-jobs-execution-log.test.ts > execution-log > writeExecutionLog > debería manejar respuestas no-ok sin lanzar excepción
{"ts":"2026-02-08T06:35:18.261Z","level":"warn","scope":"cron-jobs-maxiconsumo:execution-log","message":"EXECUTION_LOG_INSERT_FAILED","requestId":"req-789","jobId":"daily_price_update","runId":"run-456","status":500,"status_text":"Internal Server Error"}

 ✓ tests/unit/cron-jobs-execution-log.test.ts (17 tests) 51ms
 ✓ tests/unit/gateway-validation.test.ts (43 tests) 30ms
 ✓ tests/unit/shared-rate-limit.test.ts (22 tests) 17ms
 ✓ tests/unit/scraper-cache.test.ts (4 tests) 9ms
 ✓ tests/unit/gateway-auth.test.ts (28 tests) 19ms
 ✓ tests/unit/security-gaps.test.ts (6 tests) 12ms
 ✓ tests/unit/gateway-pagination.test.ts (20 tests) 14ms
 ✓ tests/unit/frontend-hooks.test.ts (5 tests) 11ms
 ✓ tests/unit/api-proveedor-auth.test.ts (17 tests) 19ms
 ✓ tests/unit/api-ofertas.test.ts (5 tests) 17ms
 ✓ tests/unit/shared-logger.test.ts (13 tests) 17ms
 ✓ tests/unit/cron-notifications.test.ts (10 tests) 13ms
 ✓ tests/unit/cron-health-monitor.test.ts (10 tests) 9ms
 ✓ tests/unit/cron-jobs.test.ts (8 tests) 18ms
 ✓ tests/unit/frontend-utils.test.ts (8 tests) 11ms
 ✓ tests/unit/scraper-alertas.test.ts (3 tests) 4ms

 Test Files  44 passed (44)
      Tests  785 passed (785)
   Start at  06:35:04
   Duration  20.91s (transform 2.38s, setup 5.43s, import 3.43s, tests 1.57s, environment 39.74s)

JUNIT report written to /home/eevan/ProyectosIA/aidrive_genspark__review_fase1_fase2_20260208/test-reports/junit.xml
```

## TEST (global) npm run test:unit

```bash
npm run test:unit
```

```

> workspace@1.0.0 test:unit
> vitest run tests/unit


 RUN  v4.0.16 /home/eevan/ProyectosIA/aidrive_genspark__review_fase1_fase2_20260208

 ✓ tests/unit/resilience-gaps.test.ts (5 tests) 121ms
 ✓ tests/unit/strategic-high-value.test.ts (27 tests) 142ms
stdout | tests/unit/scraper-storage-auth.test.ts > storage key separation runtime > usa readKey para lecturas y writeKey para inserciones/actualizaciones
{"ts":"2026-02-08T06:35:34.243Z","level":"info","scope":"scraper-maxiconsumo:storage","message":"BATCH_INSERT_SUCCESS","requestId":"rw-1","count":1}

stdout | tests/unit/scraper-storage-auth.test.ts > storage key separation runtime > usa readKey para lecturas y writeKey para inserciones/actualizaciones
{"ts":"2026-02-08T06:35:34.360Z","level":"info","scope":"scraper-maxiconsumo:storage","message":"BATCH_UPDATE_COMPLETE","requestId":"rw-1","count":1}

stdout | tests/unit/scraper-storage-auth.test.ts > storage key separation runtime > usa writeKey también para lecturas cuando readKey=service (modo service)
{"ts":"2026-02-08T06:35:34.361Z","level":"info","scope":"scraper-maxiconsumo:storage","message":"BATCH_INSERT_SUCCESS","requestId":"rw-2","count":1}

 ✓ tests/unit/scraper-storage-auth.test.ts (32 tests) 163ms
stderr | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeDailyPriceUpdate > debería retornar error si contexto es inválido
{"ts":"2026-02-08T06:35:35.261Z","level":"error","scope":"cron-jobs-maxiconsumo:job:daily-price-update","message":"VALIDATION_FAILED","field":"ctx.jobId","reason":"must be a non-empty string"}

stderr | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeDailyPriceUpdate > debería retornar error si supabaseUrl está vacío
{"ts":"2026-02-08T06:35:35.267Z","level":"error","scope":"cron-jobs-maxiconsumo:job:daily-price-update","message":"VALIDATION_FAILED","field":"supabaseUrl","reason":"must be a valid URL"}

stderr | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeDailyPriceUpdate > debería retornar error si serviceRoleKey está vacío
{"ts":"2026-02-08T06:35:35.269Z","level":"error","scope":"cron-jobs-maxiconsumo:job:daily-price-update","message":"VALIDATION_FAILED","field":"serviceRoleKey","reason":"must be a non-empty string"}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeDailyPriceUpdate > debería procesar correctamente cuando scraper responde OK
{"ts":"2026-02-08T06:35:35.270Z","level":"info","scope":"cron-jobs-maxiconsumo:job:daily-price-update","message":"JOB_START","requestId":"req-789","jobId":"test_job","runId":"run-456"}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeDailyPriceUpdate > debería procesar correctamente cuando scraper responde OK
{"ts":"2026-02-08T06:35:35.270Z","level":"info","scope":"cron-jobs-maxiconsumo:job:daily-price-update","message":"SCRAPING_COMPLETE","requestId":"req-789","jobId":"test_job","runId":"run-456","processed":50,"successful":45}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeDailyPriceUpdate > debería procesar correctamente cuando scraper responde OK
{"ts":"2026-02-08T06:35:35.270Z","level":"info","scope":"cron-jobs-maxiconsumo:job:daily-price-update","message":"JOB_COMPLETE","requestId":"req-789","jobId":"test_job","runId":"run-456","processed":50,"alerts":5,"duration":0}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeDailyPriceUpdate > debería manejar error del scraper
{"ts":"2026-02-08T06:35:35.271Z","level":"info","scope":"cron-jobs-maxiconsumo:job:daily-price-update","message":"JOB_START","requestId":"req-789","jobId":"test_job","runId":"run-456"}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeDailyPriceUpdate > debería manejar error del scraper
{"ts":"2026-02-08T06:35:35.271Z","level":"info","scope":"cron-jobs-maxiconsumo:job:daily-price-update","message":"JOB_COMPLETE","requestId":"req-789","jobId":"test_job","runId":"run-456","processed":0,"alerts":0,"duration":0}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeDailyPriceUpdate > debería manejar excepción durante ejecución
{"ts":"2026-02-08T06:35:35.273Z","level":"info","scope":"cron-jobs-maxiconsumo:job:daily-price-update","message":"JOB_START","requestId":"req-789","jobId":"test_job","runId":"run-456"}

stderr | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeDailyPriceUpdate > debería manejar excepción durante ejecución
{"ts":"2026-02-08T06:35:35.273Z","level":"error","scope":"cron-jobs-maxiconsumo:job:daily-price-update","message":"JOB_ERROR","requestId":"req-789","jobId":"test_job","runId":"run-456","error":"Network failure"}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeDailyPriceUpdate > debería calcular executionTimeMs correctamente
{"ts":"2026-02-08T06:35:35.274Z","level":"info","scope":"cron-jobs-maxiconsumo:job:daily-price-update","message":"JOB_START","requestId":"req-789","jobId":"test_job","runId":"run-456"}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeDailyPriceUpdate > debería calcular executionTimeMs correctamente
{"ts":"2026-02-08T06:35:35.274Z","level":"info","scope":"cron-jobs-maxiconsumo:job:daily-price-update","message":"SCRAPING_COMPLETE","requestId":"req-789","jobId":"test_job","runId":"run-456","processed":10,"successful":10}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeDailyPriceUpdate > debería calcular executionTimeMs correctamente
{"ts":"2026-02-08T06:35:35.274Z","level":"info","scope":"cron-jobs-maxiconsumo:job:daily-price-update","message":"JOB_COMPLETE","requestId":"req-789","jobId":"test_job","runId":"run-456","processed":10,"alerts":0,"duration":0}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeDailyPriceUpdate > debería llamar al endpoint correcto del scraper
{"ts":"2026-02-08T06:35:35.275Z","level":"info","scope":"cron-jobs-maxiconsumo:job:daily-price-update","message":"JOB_START","requestId":"req-789","jobId":"test_job","runId":"run-456"}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeDailyPriceUpdate > debería llamar al endpoint correcto del scraper
{"ts":"2026-02-08T06:35:35.276Z","level":"info","scope":"cron-jobs-maxiconsumo:job:daily-price-update","message":"SCRAPING_COMPLETE","requestId":"req-789","jobId":"test_job","runId":"run-456","processed":0,"successful":0}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeDailyPriceUpdate > debería llamar al endpoint correcto del scraper
{"ts":"2026-02-08T06:35:35.277Z","level":"info","scope":"cron-jobs-maxiconsumo:job:daily-price-update","message":"JOB_COMPLETE","requestId":"req-789","jobId":"test_job","runId":"run-456","processed":0,"alerts":0,"duration":2}

stderr | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeMaintenanceCleanup > debería retornar error si contexto es inválido
{"ts":"2026-02-08T06:35:35.282Z","level":"error","scope":"cron-jobs-maxiconsumo:job:maintenance","message":"VALIDATION_FAILED","field":"ctx.jobId","reason":"must be a non-empty string"}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeMaintenanceCleanup > debería limpiar registros antiguos correctamente
{"ts":"2026-02-08T06:35:35.283Z","level":"info","scope":"cron-jobs-maxiconsumo:job:maintenance","message":"JOB_START","requestId":"req-789","jobId":"test_job","runId":"run-456"}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeMaintenanceCleanup > debería limpiar registros antiguos correctamente
{"ts":"2026-02-08T06:35:35.284Z","level":"info","scope":"cron-jobs-maxiconsumo:job:maintenance","message":"LOGS_CLEANED","requestId":"req-789","jobId":"test_job","runId":"run-456","count":2}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeMaintenanceCleanup > debería limpiar registros antiguos correctamente
{"ts":"2026-02-08T06:35:35.285Z","level":"info","scope":"cron-jobs-maxiconsumo:job:maintenance","message":"JOB_COMPLETE","requestId":"req-789","jobId":"test_job","runId":"run-456","metrics":{"logs_deleted":2,"metrics_deleted":1,"alerts_deleted":0},"duration":1}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeMaintenanceCleanup > debería usar parámetros de retención personalizados
{"ts":"2026-02-08T06:35:35.286Z","level":"info","scope":"cron-jobs-maxiconsumo:job:maintenance","message":"JOB_START","requestId":"req-789","jobId":"test_job","runId":"run-456"}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeMaintenanceCleanup > debería usar parámetros de retención personalizados
{"ts":"2026-02-08T06:35:35.287Z","level":"info","scope":"cron-jobs-maxiconsumo:job:maintenance","message":"LOGS_CLEANED","requestId":"req-789","jobId":"test_job","runId":"run-456","count":0}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeMaintenanceCleanup > debería usar parámetros de retención personalizados
{"ts":"2026-02-08T06:35:35.288Z","level":"info","scope":"cron-jobs-maxiconsumo:job:maintenance","message":"JOB_COMPLETE","requestId":"req-789","jobId":"test_job","runId":"run-456","metrics":{"logs_deleted":0,"metrics_deleted":0,"alerts_deleted":0},"duration":2}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeMaintenanceCleanup > debería recomendar reducir retención si limpia muchos registros
{"ts":"2026-02-08T06:35:35.289Z","level":"info","scope":"cron-jobs-maxiconsumo:job:maintenance","message":"JOB_START","requestId":"req-789","jobId":"test_job","runId":"run-456"}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeMaintenanceCleanup > debería recomendar reducir retención si limpia muchos registros
{"ts":"2026-02-08T06:35:35.290Z","level":"info","scope":"cron-jobs-maxiconsumo:job:maintenance","message":"LOGS_CLEANED","requestId":"req-789","jobId":"test_job","runId":"run-456","count":500}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeMaintenanceCleanup > debería recomendar reducir retención si limpia muchos registros
{"ts":"2026-02-08T06:35:35.291Z","level":"info","scope":"cron-jobs-maxiconsumo:job:maintenance","message":"JOB_COMPLETE","requestId":"req-789","jobId":"test_job","runId":"run-456","metrics":{"logs_deleted":500,"metrics_deleted":400,"alerts_deleted":200},"duration":2}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeMaintenanceCleanup > debería manejar excepción durante ejecución
{"ts":"2026-02-08T06:35:35.292Z","level":"info","scope":"cron-jobs-maxiconsumo:job:maintenance","message":"JOB_START","requestId":"req-789","jobId":"test_job","runId":"run-456"}

stderr | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeMaintenanceCleanup > debería manejar excepción durante ejecución
{"ts":"2026-02-08T06:35:35.292Z","level":"error","scope":"cron-jobs-maxiconsumo:job:maintenance","message":"JOB_ERROR","requestId":"req-789","jobId":"test_job","runId":"run-456","error":"Database error"}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeMaintenanceCleanup > debería usar headers correctos para DELETE
{"ts":"2026-02-08T06:35:35.293Z","level":"info","scope":"cron-jobs-maxiconsumo:job:maintenance","message":"JOB_START","requestId":"req-789","jobId":"test_job","runId":"run-456"}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeMaintenanceCleanup > debería usar headers correctos para DELETE
{"ts":"2026-02-08T06:35:35.294Z","level":"info","scope":"cron-jobs-maxiconsumo:job:maintenance","message":"LOGS_CLEANED","requestId":"req-789","jobId":"test_job","runId":"run-456","count":0}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeMaintenanceCleanup > debería usar headers correctos para DELETE
{"ts":"2026-02-08T06:35:35.294Z","level":"info","scope":"cron-jobs-maxiconsumo:job:maintenance","message":"JOB_COMPLETE","requestId":"req-789","jobId":"test_job","runId":"run-456","metrics":{"logs_deleted":0,"metrics_deleted":0,"alerts_deleted":0},"duration":1}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeMaintenanceCleanup > debería calcular productsProcessed como total limpiado
{"ts":"2026-02-08T06:35:35.294Z","level":"info","scope":"cron-jobs-maxiconsumo:job:maintenance","message":"JOB_START","requestId":"req-789","jobId":"test_job","runId":"run-456"}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeMaintenanceCleanup > debería calcular productsProcessed como total limpiado
{"ts":"2026-02-08T06:35:35.294Z","level":"info","scope":"cron-jobs-maxiconsumo:job:maintenance","message":"LOGS_CLEANED","requestId":"req-789","jobId":"test_job","runId":"run-456","count":3}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeMaintenanceCleanup > debería calcular productsProcessed como total limpiado
{"ts":"2026-02-08T06:35:35.295Z","level":"info","scope":"cron-jobs-maxiconsumo:job:maintenance","message":"JOB_COMPLETE","requestId":"req-789","jobId":"test_job","runId":"run-456","metrics":{"logs_deleted":3,"metrics_deleted":2,"alerts_deleted":1},"duration":1}

stderr | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeRealtimeAlerts > debería retornar error si contexto es inválido
{"ts":"2026-02-08T06:35:35.297Z","level":"error","scope":"cron-jobs-maxiconsumo:job:realtime-alerts","message":"VALIDATION_FAILED","field":"ctx.jobId","reason":"must be a non-empty string"}

stderr | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeRealtimeAlerts > debería retornar error si supabaseUrl está vacío
{"ts":"2026-02-08T06:35:35.298Z","level":"error","scope":"cron-jobs-maxiconsumo:job:realtime-alerts","message":"VALIDATION_FAILED","field":"supabaseUrl","reason":"must be a valid URL"}

stderr | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeRealtimeAlerts > debería retornar error si serviceRoleKey está vacío
{"ts":"2026-02-08T06:35:35.299Z","level":"error","scope":"cron-jobs-maxiconsumo:job:realtime-alerts","message":"VALIDATION_FAILED","field":"serviceRoleKey","reason":"must be a non-empty string"}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeRealtimeAlerts > debería procesar alertas críticas correctamente
{"ts":"2026-02-08T06:35:35.300Z","level":"info","scope":"cron-jobs-maxiconsumo:job:realtime-alerts","message":"JOB_START","requestId":"req-789","jobId":"test_job","runId":"run-456"}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeRealtimeAlerts > debería procesar alertas críticas correctamente
{"ts":"2026-02-08T06:35:35.301Z","level":"info","scope":"cron-jobs-maxiconsumo:job:realtime-alerts","message":"CHANGES_DETECTED","requestId":"req-789","jobId":"test_job","runId":"run-456","total":2,"critical":2}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeRealtimeAlerts > debería procesar alertas críticas correctamente
{"ts":"2026-02-08T06:35:35.301Z","level":"info","scope":"cron-jobs-maxiconsumo:job:realtime-alerts","message":"JOB_COMPLETE","requestId":"req-789","jobId":"test_job","runId":"run-456","alerts":2,"duration":1}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeRealtimeAlerts > debería no generar alertas si cambios están bajo threshold
{"ts":"2026-02-08T06:35:35.303Z","level":"info","scope":"cron-jobs-maxiconsumo:job:realtime-alerts","message":"JOB_START","requestId":"req-789","jobId":"test_job","runId":"run-456"}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeRealtimeAlerts > debería no generar alertas si cambios están bajo threshold
{"ts":"2026-02-08T06:35:35.303Z","level":"info","scope":"cron-jobs-maxiconsumo:job:realtime-alerts","message":"CHANGES_DETECTED","requestId":"req-789","jobId":"test_job","runId":"run-456","total":1,"critical":0}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeRealtimeAlerts > debería no generar alertas si cambios están bajo threshold
{"ts":"2026-02-08T06:35:35.304Z","level":"info","scope":"cron-jobs-maxiconsumo:job:realtime-alerts","message":"JOB_COMPLETE","requestId":"req-789","jobId":"test_job","runId":"run-456","alerts":0,"duration":0}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeRealtimeAlerts > debería usar threshold personalizado de parámetros
{"ts":"2026-02-08T06:35:35.305Z","level":"info","scope":"cron-jobs-maxiconsumo:job:realtime-alerts","message":"JOB_START","requestId":"req-789","jobId":"test_job","runId":"run-456"}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeRealtimeAlerts > debería usar threshold personalizado de parámetros
{"ts":"2026-02-08T06:35:35.306Z","level":"info","scope":"cron-jobs-maxiconsumo:job:realtime-alerts","message":"CHANGES_DETECTED","requestId":"req-789","jobId":"test_job","runId":"run-456","total":1,"critical":1}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeRealtimeAlerts > debería usar threshold personalizado de parámetros
{"ts":"2026-02-08T06:35:35.306Z","level":"info","scope":"cron-jobs-maxiconsumo:job:realtime-alerts","message":"JOB_COMPLETE","requestId":"req-789","jobId":"test_job","runId":"run-456","alerts":1,"duration":0}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeRealtimeAlerts > debería manejar excepción durante ejecución
{"ts":"2026-02-08T06:35:35.307Z","level":"info","scope":"cron-jobs-maxiconsumo:job:realtime-alerts","message":"JOB_START","requestId":"req-789","jobId":"test_job","runId":"run-456"}

stderr | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeRealtimeAlerts > debería manejar excepción durante ejecución
{"ts":"2026-02-08T06:35:35.307Z","level":"error","scope":"cron-jobs-maxiconsumo:job:realtime-alerts","message":"JOB_ERROR","requestId":"req-789","jobId":"test_job","runId":"run-456","error":"Database timeout"}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeRealtimeAlerts > debería calcular executionTimeMs correctamente
{"ts":"2026-02-08T06:35:35.308Z","level":"info","scope":"cron-jobs-maxiconsumo:job:realtime-alerts","message":"JOB_START","requestId":"req-789","jobId":"test_job","runId":"run-456"}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeRealtimeAlerts > debería calcular executionTimeMs correctamente
{"ts":"2026-02-08T06:35:35.308Z","level":"info","scope":"cron-jobs-maxiconsumo:job:realtime-alerts","message":"CHANGES_DETECTED","requestId":"req-789","jobId":"test_job","runId":"run-456","total":0,"critical":0}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeRealtimeAlerts > debería calcular executionTimeMs correctamente
{"ts":"2026-02-08T06:35:35.308Z","level":"info","scope":"cron-jobs-maxiconsumo:job:realtime-alerts","message":"JOB_COMPLETE","requestId":"req-789","jobId":"test_job","runId":"run-456","alerts":0,"duration":0}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeRealtimeAlerts > debería consultar precios de los últimos 15 minutos
{"ts":"2026-02-08T06:35:35.308Z","level":"info","scope":"cron-jobs-maxiconsumo:job:realtime-alerts","message":"JOB_START","requestId":"req-789","jobId":"test_job","runId":"run-456"}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeRealtimeAlerts > debería consultar precios de los últimos 15 minutos
{"ts":"2026-02-08T06:35:35.308Z","level":"info","scope":"cron-jobs-maxiconsumo:job:realtime-alerts","message":"CHANGES_DETECTED","requestId":"req-789","jobId":"test_job","runId":"run-456","total":0,"critical":0}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeRealtimeAlerts > debería consultar precios de los últimos 15 minutos
{"ts":"2026-02-08T06:35:35.308Z","level":"info","scope":"cron-jobs-maxiconsumo:job:realtime-alerts","message":"JOB_COMPLETE","requestId":"req-789","jobId":"test_job","runId":"run-456","alerts":0,"duration":0}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeRealtimeAlerts > debería crear alertas con severidad crítica
{"ts":"2026-02-08T06:35:35.309Z","level":"info","scope":"cron-jobs-maxiconsumo:job:realtime-alerts","message":"JOB_START","requestId":"req-789","jobId":"test_job","runId":"run-456"}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeRealtimeAlerts > debería crear alertas con severidad crítica
{"ts":"2026-02-08T06:35:35.309Z","level":"info","scope":"cron-jobs-maxiconsumo:job:realtime-alerts","message":"CHANGES_DETECTED","requestId":"req-789","jobId":"test_job","runId":"run-456","total":1,"critical":1}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeRealtimeAlerts > debería crear alertas con severidad crítica
{"ts":"2026-02-08T06:35:35.309Z","level":"info","scope":"cron-jobs-maxiconsumo:job:realtime-alerts","message":"JOB_COMPLETE","requestId":"req-789","jobId":"test_job","runId":"run-456","alerts":1,"duration":0}

stderr | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeWeeklyAnalysis > debería retornar error si contexto es inválido
{"ts":"2026-02-08T06:35:35.311Z","level":"error","scope":"cron-jobs-maxiconsumo:job:weekly-analysis","message":"VALIDATION_FAILED","field":"ctx.jobId","reason":"must be a non-empty string"}

stderr | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeWeeklyAnalysis > debería retornar error si supabaseUrl está vacío
{"ts":"2026-02-08T06:35:35.313Z","level":"error","scope":"cron-jobs-maxiconsumo:job:weekly-analysis","message":"VALIDATION_FAILED","field":"supabaseUrl","reason":"must be a valid URL"}

stderr | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeWeeklyAnalysis > debería retornar error si serviceRoleKey está vacío
{"ts":"2026-02-08T06:35:35.314Z","level":"error","scope":"cron-jobs-maxiconsumo:job:weekly-analysis","message":"VALIDATION_FAILED","field":"serviceRoleKey","reason":"must be a non-empty string"}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeWeeklyAnalysis > debería calcular trends correctamente con datos válidos
{"ts":"2026-02-08T06:35:35.315Z","level":"info","scope":"cron-jobs-maxiconsumo:job:weekly-analysis","message":"JOB_START","requestId":"req-789","jobId":"test_job","runId":"run-456"}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeWeeklyAnalysis > debería calcular trends correctamente con datos válidos
{"ts":"2026-02-08T06:35:35.316Z","level":"info","scope":"cron-jobs-maxiconsumo:job:weekly-analysis","message":"TRENDS_CALCULATED","requestId":"req-789","jobId":"test_job","runId":"run-456","trends":{"total_cambios":2,"promedio_cambio":"20.00","alertas_semana":2,"alertas_criticas":1}}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeWeeklyAnalysis > debería calcular trends correctamente con datos válidos
{"ts":"2026-02-08T06:35:35.316Z","level":"info","scope":"cron-jobs-maxiconsumo:job:weekly-analysis","message":"JOB_COMPLETE","requestId":"req-789","jobId":"test_job","runId":"run-456","trends":{"total_cambios":2,"promedio_cambio":"20.00","alertas_semana":2,"alertas_criticas":1},"duration":1}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeWeeklyAnalysis > debería manejar respuestas vacías correctamente
{"ts":"2026-02-08T06:35:35.317Z","level":"info","scope":"cron-jobs-maxiconsumo:job:weekly-analysis","message":"JOB_START","requestId":"req-789","jobId":"test_job","runId":"run-456"}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeWeeklyAnalysis > debería manejar respuestas vacías correctamente
{"ts":"2026-02-08T06:35:35.318Z","level":"info","scope":"cron-jobs-maxiconsumo:job:weekly-analysis","message":"TRENDS_CALCULATED","requestId":"req-789","jobId":"test_job","runId":"run-456","trends":{"total_cambios":0,"promedio_cambio":"0.00","alertas_semana":0,"alertas_criticas":0}}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeWeeklyAnalysis > debería manejar respuestas vacías correctamente
{"ts":"2026-02-08T06:35:35.318Z","level":"info","scope":"cron-jobs-maxiconsumo:job:weekly-analysis","message":"JOB_COMPLETE","requestId":"req-789","jobId":"test_job","runId":"run-456","trends":{"total_cambios":0,"promedio_cambio":"0.00","alertas_semana":0,"alertas_criticas":0},"duration":1}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeWeeklyAnalysis > debería generar recomendación si alertas críticas > 10
{"ts":"2026-02-08T06:35:35.319Z","level":"info","scope":"cron-jobs-maxiconsumo:job:weekly-analysis","message":"JOB_START","requestId":"req-789","jobId":"test_job","runId":"run-456"}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeWeeklyAnalysis > debería generar recomendación si alertas críticas > 10
{"ts":"2026-02-08T06:35:35.319Z","level":"info","scope":"cron-jobs-maxiconsumo:job:weekly-analysis","message":"TRENDS_CALCULATED","requestId":"req-789","jobId":"test_job","runId":"run-456","trends":{"total_cambios":0,"promedio_cambio":"0.00","alertas_semana":12,"alertas_criticas":12}}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeWeeklyAnalysis > debería generar recomendación si alertas críticas > 10
{"ts":"2026-02-08T06:35:35.320Z","level":"info","scope":"cron-jobs-maxiconsumo:job:weekly-analysis","message":"JOB_COMPLETE","requestId":"req-789","jobId":"test_job","runId":"run-456","trends":{"total_cambios":0,"promedio_cambio":"0.00","alertas_semana":12,"alertas_criticas":12},"duration":0}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeWeeklyAnalysis > debería generar recomendación si totalChanges > 100
{"ts":"2026-02-08T06:35:35.320Z","level":"info","scope":"cron-jobs-maxiconsumo:job:weekly-analysis","message":"JOB_START","requestId":"req-789","jobId":"test_job","runId":"run-456"}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeWeeklyAnalysis > debería generar recomendación si totalChanges > 100
{"ts":"2026-02-08T06:35:35.321Z","level":"info","scope":"cron-jobs-maxiconsumo:job:weekly-analysis","message":"TRENDS_CALCULATED","requestId":"req-789","jobId":"test_job","runId":"run-456","trends":{"total_cambios":105,"promedio_cambio":"10.00","alertas_semana":0,"alertas_criticas":0}}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeWeeklyAnalysis > debería generar recomendación si totalChanges > 100
{"ts":"2026-02-08T06:35:35.321Z","level":"info","scope":"cron-jobs-maxiconsumo:job:weekly-analysis","message":"JOB_COMPLETE","requestId":"req-789","jobId":"test_job","runId":"run-456","trends":{"total_cambios":105,"promedio_cambio":"10.00","alertas_semana":0,"alertas_criticas":0},"duration":1}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeWeeklyAnalysis > debería guardar métricas en cron_jobs_metrics
{"ts":"2026-02-08T06:35:35.321Z","level":"info","scope":"cron-jobs-maxiconsumo:job:weekly-analysis","message":"JOB_START","requestId":"req-789","jobId":"test_job","runId":"run-456"}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeWeeklyAnalysis > debería guardar métricas en cron_jobs_metrics
{"ts":"2026-02-08T06:35:35.321Z","level":"info","scope":"cron-jobs-maxiconsumo:job:weekly-analysis","message":"TRENDS_CALCULATED","requestId":"req-789","jobId":"test_job","runId":"run-456","trends":{"total_cambios":1,"promedio_cambio":"10.00","alertas_semana":0,"alertas_criticas":0}}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeWeeklyAnalysis > debería guardar métricas en cron_jobs_metrics
{"ts":"2026-02-08T06:35:35.321Z","level":"info","scope":"cron-jobs-maxiconsumo:job:weekly-analysis","message":"JOB_COMPLETE","requestId":"req-789","jobId":"test_job","runId":"run-456","trends":{"total_cambios":1,"promedio_cambio":"10.00","alertas_semana":0,"alertas_criticas":0},"duration":0}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeWeeklyAnalysis > debería manejar excepción durante ejecución
{"ts":"2026-02-08T06:35:35.322Z","level":"info","scope":"cron-jobs-maxiconsumo:job:weekly-analysis","message":"JOB_START","requestId":"req-789","jobId":"test_job","runId":"run-456"}

stderr | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeWeeklyAnalysis > debería manejar excepción durante ejecución
{"ts":"2026-02-08T06:35:35.322Z","level":"error","scope":"cron-jobs-maxiconsumo:job:weekly-analysis","message":"JOB_ERROR","requestId":"req-789","jobId":"test_job","runId":"run-456","error":"Connection refused"}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeWeeklyAnalysis > debería calcular productsProcessed como totalChanges
{"ts":"2026-02-08T06:35:35.322Z","level":"info","scope":"cron-jobs-maxiconsumo:job:weekly-analysis","message":"JOB_START","requestId":"req-789","jobId":"test_job","runId":"run-456"}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeWeeklyAnalysis > debería calcular productsProcessed como totalChanges
{"ts":"2026-02-08T06:35:35.323Z","level":"info","scope":"cron-jobs-maxiconsumo:job:weekly-analysis","message":"TRENDS_CALCULATED","requestId":"req-789","jobId":"test_job","runId":"run-456","trends":{"total_cambios":3,"promedio_cambio":"10.00","alertas_semana":0,"alertas_criticas":0}}

stdout | tests/unit/cron-jobs-handlers.test.ts > cron-jobs-maxiconsumo/jobs > executeWeeklyAnalysis > debería calcular productsProcessed como totalChanges
{"ts":"2026-02-08T06:35:35.323Z","level":"info","scope":"cron-jobs-maxiconsumo:job:weekly-analysis","message":"JOB_COMPLETE","requestId":"req-789","jobId":"test_job","runId":"run-456","trends":{"total_cambios":3,"promedio_cambio":"10.00","alertas_semana":0,"alertas_criticas":0},"duration":1}

 ✓ tests/unit/cron-jobs-handlers.test.ts (35 tests) 66ms
stdout | tests/unit/scraper-matching.test.ts > scraper-maxiconsumo/matching > performAdvancedMatching > omite coincidencias con confianza <= 20
{"ts":"2026-02-08T06:35:35.425Z","level":"info","scope":"scraper-maxiconsumo:matching","message":"MATCHING_COMPLETE","total":0}

stdout | tests/unit/scraper-matching.test.ts > scraper-maxiconsumo/matching > performAdvancedMatching > hace match por nombre normalizado cuando no hay SKU ni barcode
{"ts":"2026-02-08T06:35:35.428Z","level":"info","scope":"scraper-maxiconsumo:matching","message":"MATCHING_COMPLETE","total":1}

 ✓ tests/unit/scraper-matching.test.ts (31 tests) 13ms
 ✓ tests/unit/boundary-edge-cases.test.ts (9 tests) 54ms
 ✓ tests/unit/auth-resilient.test.ts (16 tests) 38ms
stderr | tests/unit/cron-jobs-execution-log.test.ts > execution-log > writeExecutionLog > debería manejar errores de fetch sin lanzar excepción
{"ts":"2026-02-08T06:35:36.647Z","level":"warn","scope":"cron-jobs-maxiconsumo:execution-log","message":"EXECUTION_LOG_INSERT_FAILED","requestId":"req-789","jobId":"daily_price_update","runId":"run-456","error":"Network error"}

stderr | tests/unit/cron-jobs-execution-log.test.ts > execution-log > writeExecutionLog > debería manejar respuestas no-ok sin lanzar excepción
{"ts":"2026-02-08T06:35:36.649Z","level":"warn","scope":"cron-jobs-maxiconsumo:execution-log","message":"EXECUTION_LOG_INSERT_FAILED","requestId":"req-789","jobId":"daily_price_update","runId":"run-456","status":500,"status_text":"Internal Server Error"}

 ✓ tests/unit/cron-jobs-execution-log.test.ts (17 tests) 17ms
 ✓ tests/unit/scraper-cookie-jar.test.ts (20 tests) 35ms
 ✓ tests/unit/integration-contracts.test.ts (5 tests) 31ms
 ✓ tests/unit/shared-cors.test.ts (21 tests) 19ms
 ✓ tests/unit/scraper-parsing-edge-cases.test.ts (26 tests) 24ms
 ✓ tests/unit/scraper-anti-detection.test.ts (35 tests) 37ms
 ✓ tests/unit/api-reservas-concurrencia.test.ts (4 tests) 40ms
 ✓ tests/unit/scraper-config.test.ts (22 tests) 54ms
 ✓ tests/unit/rate-limit-shared.test.ts (14 tests) 15ms
 ✓ tests/unit/shared-response.test.ts (22 tests) 31ms
stdout | tests/unit/shared-audit.test.ts > auditLog > should work in dry-run mode without supabase client
{"ts":"2026-02-08T06:35:40.409Z","level":"info","scope":"audit","message":"[AUDIT] precio_actualizado","usuario_id":"user-123","entidad_tipo":"productos","entidad_id":"prod-456","detalles":{"precio_anterior":100,"precio_nuevo":150},"nivel":"info"}

stderr | tests/unit/shared-audit.test.ts > auditLog > should work in dry-run mode without supabase client
{"ts":"2026-02-08T06:35:40.410Z","level":"warn","scope":"audit","message":"Audit log: dry-run mode, no database insert"}

stdout | tests/unit/shared-audit.test.ts > auditLog > should insert audit log with supabase client
{"ts":"2026-02-08T06:35:40.415Z","level":"info","scope":"audit","message":"[AUDIT] stock_ajustado","usuario_id":"user-456","entidad_tipo":"stock_deposito","entidad_id":"stock-789","nivel":"warning"}

stdout | tests/unit/shared-audit.test.ts > auditLog > should return error when database insert fails
{"ts":"2026-02-08T06:35:40.421Z","level":"info","scope":"audit","message":"[AUDIT] producto_eliminado","nivel":"info"}

stderr | tests/unit/shared-audit.test.ts > auditLog > should return error when database insert fails
{"ts":"2026-02-08T06:35:40.422Z","level":"error","scope":"audit","message":"Error inserting audit log","error":{"message":"Database error"}}

stdout | tests/unit/shared-audit.test.ts > auditLog > should handle exceptions gracefully
{"ts":"2026-02-08T06:35:40.424Z","level":"info","scope":"audit","message":"[AUDIT] login_fallido","nivel":"info"}

stderr | tests/unit/shared-audit.test.ts > auditLog > should handle exceptions gracefully
{"ts":"2026-02-08T06:35:40.425Z","level":"error","scope":"audit","message":"Exception in auditLog","error":"Connection failed"}

stdout | tests/unit/shared-audit.test.ts > auditLog > should use default nivel when not specified
{"ts":"2026-02-08T06:35:40.426Z","level":"info","scope":"audit","message":"[AUDIT] producto_creado","nivel":"info"}

stderr | tests/unit/shared-audit.test.ts > queryAuditLogs > should return error when query fails
{"ts":"2026-02-08T06:35:40.433Z","level":"error","scope":"audit","message":"Error querying audit logs","error":{"message":"Query failed"}}

stderr | tests/unit/shared-audit.test.ts > queryAuditLogs > should handle exceptions gracefully
{"ts":"2026-02-08T06:35:40.434Z","level":"error","scope":"audit","message":"Exception in queryAuditLogs","error":"Connection timeout"}

 ✓ tests/unit/shared-audit.test.ts (21 tests) 42ms
 ✓ tests/unit/gateway-validation.test.ts (43 tests) 13ms
 ✓ tests/unit/shared-errors.test.ts (32 tests) 35ms
 ✓ tests/unit/api-proveedor-read-mode.test.ts (34 tests) 19ms
 ✓ tests/unit/api-proveedor-routing.test.ts (17 tests) 15ms
 ✓ tests/unit/shared-circuit-breaker.test.ts (18 tests) 34ms
stdout | tests/unit/cron-jobs-locking.test.ts > cron-jobs-maxiconsumo/orchestrator locking > skips si no se adquiere lock
{"ts":"2026-02-08T06:35:43.085Z","level":"info","scope":"cron-jobs-maxiconsumo:orchestrator","message":"ORCHESTRATOR_EXECUTE_START","requestId":"req-1","jobId":"daily_price_update","runId":"run_1770532543085_5lijkk"}

stderr | tests/unit/cron-jobs-locking.test.ts > cron-jobs-maxiconsumo/orchestrator locking > skips si no se adquiere lock
{"ts":"2026-02-08T06:35:43.089Z","level":"warn","scope":"cron-jobs-maxiconsumo:orchestrator","message":"JOB_LOCKED","requestId":"req-1","jobId":"daily_price_update","runId":"run_1770532543085_5lijkk","lockSeconds":360}

stdout | tests/unit/cron-jobs-locking.test.ts > cron-jobs-maxiconsumo/orchestrator locking > adquiere y libera lock en ejecución exitosa
{"ts":"2026-02-08T06:35:43.093Z","level":"info","scope":"cron-jobs-maxiconsumo:orchestrator","message":"ORCHESTRATOR_EXECUTE_START","requestId":"req-2","jobId":"daily_price_update","runId":"run_1770532543093_01nase"}

stdout | tests/unit/cron-jobs-locking.test.ts > cron-jobs-maxiconsumo/orchestrator locking > fallback: si RPC de lock no existe (404), ejecuta job igualmente
{"ts":"2026-02-08T06:35:43.096Z","level":"info","scope":"cron-jobs-maxiconsumo:orchestrator","message":"ORCHESTRATOR_EXECUTE_START","requestId":"req-3","jobId":"daily_price_update","runId":"run_1770532543095_erwgr9"}

stderr | tests/unit/cron-jobs-locking.test.ts > cron-jobs-maxiconsumo/orchestrator locking > fallback: si RPC de lock no existe (404), ejecuta job igualmente
{"ts":"2026-02-08T06:35:43.098Z","level":"warn","scope":"cron-jobs-maxiconsumo:orchestrator","message":"JOB_LOCK_RPC_MISSING","jobId":"daily_price_update","owner":"ff93debe-1393-4413-9d98-8627b354b263","action":"fallback_no_lock"}

stderr | tests/unit/cron-jobs-locking.test.ts > cron-jobs-maxiconsumo/orchestrator locking > fallback: si RPC de lock no existe (404), ejecuta job igualmente
{"ts":"2026-02-08T06:35:43.099Z","level":"warn","scope":"cron-jobs-maxiconsumo:orchestrator","message":"JOB_LOCK_RELEASE_FAILED","jobId":"daily_price_update","error":"RPC sp_release_job_lock failed: 404 Not Found"}

 ✓ tests/unit/cron-jobs-locking.test.ts (3 tests) 19ms
 ✓ tests/unit/gateway-auth.test.ts (28 tests) 15ms
 ✓ tests/unit/api-proveedor-auth.test.ts (17 tests) 18ms
 ✓ tests/unit/api-ventas-pos.test.ts (4 tests) 26ms
 ✓ tests/unit/cron-validators.test.ts (38 tests) 16ms
 ✓ tests/unit/pedidos-handlers.test.ts (29 tests) 16ms
 ✓ tests/unit/cron-jobs.test.ts (8 tests) 10ms
 ✓ tests/unit/shared-rate-limit.test.ts (22 tests) 23ms
 ✓ tests/unit/shared-logger.test.ts (13 tests) 29ms
 ✓ tests/unit/api-ofertas.test.ts (5 tests) 17ms
 ✓ tests/unit/gateway-pagination.test.ts (20 tests) 10ms
 ✓ tests/unit/scraper-parsing.test.ts (34 tests) 44ms
 ✓ tests/unit/cron-notifications.test.ts (10 tests) 8ms
 ✓ tests/unit/security-gaps.test.ts (6 tests) 10ms
 ✓ tests/unit/api-bitacora.test.ts (3 tests) 19ms
 ✓ tests/unit/circuit-breaker-shared.test.ts (9 tests) 17ms
 ✓ tests/unit/scraper-cache.test.ts (4 tests) 11ms
 ✓ tests/unit/frontend-utils.test.ts (8 tests) 24ms
 ✓ tests/unit/frontend-hooks.test.ts (5 tests) 13ms
 ✓ tests/unit/cron-health-monitor.test.ts (10 tests) 7ms
 ✓ tests/unit/scraper-alertas.test.ts (3 tests) 4ms

 Test Files  44 passed (44)
      Tests  785 passed (785)
   Start at  06:35:32
   Duration  19.40s (transform 1.81s, setup 5.28s, import 2.67s, tests 1.41s, environment 36.75s)

JUNIT report written to /home/eevan/ProyectosIA/aidrive_genspark__review_fase1_fase2_20260208/test-reports/junit.xml
```

## TEST (global) npm run test:integration

```bash
npm run test:integration 
```

```

> workspace@1.0.0 test:integration
> bash scripts/run-integration-tests.sh

============================================================================
ERROR: Archivo .env.test no encontrado
============================================================================

Los tests de integración requieren un archivo .env.test con credenciales de Supabase.

Para crear .env.test:
  1. cp .env.test.example .env.test
  2. Ejecutar: supabase start
  3. Ejecutar: supabase status
  4. Copiar los valores reales a .env.test:
     - API URL -> SUPABASE_URL
     - anon key -> SUPABASE_ANON_KEY
     - service_role key -> SUPABASE_SERVICE_ROLE_KEY

Sin .env.test, solo se pueden ejecutar tests unitarios:
  npm run test:unit
============================================================================
```

## TEST (global) npm run test:e2e

```bash
npm run test:e2e 
```

```

> workspace@1.0.0 test:e2e
> bash scripts/run-e2e-tests.sh

============================================================================
ERROR: Archivo .env.test no encontrado
============================================================================

Los tests E2E requieren un archivo .env.test con credenciales de Supabase.

Para crear .env.test:
  1. cp .env.test.example .env.test
  2. Ejecutar: supabase start
  3. Ejecutar: supabase status
  4. Copiar los valores reales a .env.test:
     - API URL -> SUPABASE_URL
     - anon key -> SUPABASE_ANON_KEY
     - service_role key -> SUPABASE_SERVICE_ROLE_KEY

Sin .env.test, solo se pueden ejecutar tests unitarios:
  npm run test:unit
============================================================================
```

## minimarket-system: pnpm lint

```bash
pnpm -C minimarket-system lint 
```

```

> react_repo@0.0.0 lint /home/eevan/ProyectosIA/aidrive_genspark__review_fase1_fase2_20260208/minimarket-system
> pnpm install --prefer-offline && eslint .

Lockfile is up to date, resolution step is skipped
Progress: resolved 1, reused 0, downloaded 0, added 0
Packages: +815
++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
Progress: resolved 815, reused 137, downloaded 0, added 0
Progress: resolved 815, reused 815, downloaded 0, added 17
Progress: resolved 815, reused 815, downloaded 0, added 412
Progress: resolved 815, reused 815, downloaded 0, added 815, done
.../esbuild@0.25.12/node_modules/esbuild postinstall$ node install.js
.../esbuild@0.25.12/node_modules/esbuild postinstall: Done

dependencies:
+ @hookform/resolvers 3.10.0
+ @radix-ui/react-accordion 1.2.12
+ @radix-ui/react-alert-dialog 1.1.15
+ @radix-ui/react-aspect-ratio 1.1.8
+ @radix-ui/react-avatar 1.1.11
+ @radix-ui/react-checkbox 1.3.3
+ @radix-ui/react-collapsible 1.1.12
+ @radix-ui/react-context-menu 2.2.16
+ @radix-ui/react-dialog 1.1.15
+ @radix-ui/react-dropdown-menu 2.1.16
+ @radix-ui/react-hover-card 1.1.15
+ @radix-ui/react-label 2.1.8
+ @radix-ui/react-menubar 1.1.16
+ @radix-ui/react-navigation-menu 1.2.14
+ @radix-ui/react-popover 1.1.15
+ @radix-ui/react-progress 1.1.8
+ @radix-ui/react-radio-group 1.3.8
+ @radix-ui/react-scroll-area 1.2.10
+ @radix-ui/react-select 2.2.6
+ @radix-ui/react-separator 1.1.8
+ @radix-ui/react-slider 1.3.6
+ @radix-ui/react-slot 1.2.4
+ @radix-ui/react-switch 1.2.6
+ @radix-ui/react-tabs 1.1.13
+ @radix-ui/react-toast 1.2.15
+ @radix-ui/react-toggle 1.1.10
+ @radix-ui/react-toggle-group 1.1.11
+ @radix-ui/react-tooltip 1.2.8
+ @supabase/supabase-js 2.89.0
+ @tanstack/react-query 5.90.17
+ @tanstack/react-query-devtools 5.91.2
+ @zxing/browser 0.1.5
+ @zxing/library 0.21.3
+ class-variance-authority 0.7.1
+ clsx 2.1.1
+ cmdk 1.0.0
+ date-fns 3.6.0
+ embla-carousel-react 8.6.0
+ input-otp 1.4.2
+ jsbarcode 3.12.3
+ lucide-react 0.364.0
+ next-themes 0.4.6
+ react 18.3.1
+ react-day-picker 8.10.1
+ react-dom 18.3.1
+ react-hook-form 7.70.0
+ react-resizable-panels 2.1.9
+ react-router-dom 6.30.2
+ recharts 2.15.4
+ sonner 1.7.4
+ tailwind-merge 2.6.0
+ tailwindcss-animate 1.0.7
+ vaul 1.1.2
+ vite-plugin-pwa 1.2.0
+ zod 3.25.76

devDependencies:
+ @eslint/js 9.39.2
+ @playwright/test 1.57.0
+ @testing-library/jest-dom 6.9.1
+ @testing-library/react 16.3.2
+ @testing-library/user-event 14.6.1
+ @types/jsbarcode 3.11.4
+ @types/node 22.19.3
+ @types/react 18.3.27
+ @types/react-dom 18.3.7
+ @vitejs/plugin-react 4.7.0
+ autoprefixer 10.4.20
+ dotenv 17.2.3
+ eslint 9.39.2
+ eslint-plugin-react-hooks 5.2.0
+ eslint-plugin-react-refresh 0.4.26
+ globals 15.15.0
+ jsdom 27.4.0
+ msw 2.12.7
+ postcss 8.4.49
+ tailwindcss 3.4.16
+ typescript 5.6.3
+ typescript-eslint 8.51.0
+ vite 6.4.1
+ vite-plugin-source-identifier 1.1.2
+ vitest 4.0.17

Done in 6s using pnpm v9.15.9
```

## minimarket-system: pnpm build

```bash
pnpm -C minimarket-system build 
```

```

> react_repo@0.0.0 build /home/eevan/ProyectosIA/aidrive_genspark__review_fase1_fase2_20260208/minimarket-system
> pnpm install --prefer-offline && rm -rf node_modules/.vite-temp && tsc -b && vite build

Lockfile is up to date, resolution step is skipped
Already up to date

Done in 2s using pnpm v9.15.9
vite v6.4.1 building for production...
transforming...
✓ 1942 modules transformed.
rendering chunks...
computing gzip size...
dist/registerSW.js                           0.13 kB
dist/manifest.webmanifest                    0.35 kB
dist/index.html                              1.08 kB │ gzip:   0.51 kB
dist/assets/index-BSiZUp4V.css              29.64 kB │ gzip:   5.99 kB
dist/assets/errorMessageUtils-Mgw3bsWp.js    4.10 kB │ gzip:   1.28 kB
dist/assets/Skeleton-B4lwvUat.js             6.59 kB │ gzip:   0.89 kB
dist/assets/Login-DPO9rUdd.js                8.89 kB │ gzip:   1.82 kB
dist/assets/Kardex-fT8OdjB9.js              19.76 kB │ gzip:   3.35 kB
dist/assets/Stock-CENOg5DR.js               21.13 kB │ gzip:   3.39 kB
dist/assets/Proveedores-RpPLr-bZ.js         27.70 kB │ gzip:   3.55 kB
dist/assets/Dashboard-CDMDVPrV.js           29.69 kB │ gzip:   3.56 kB
dist/assets/Tareas-CmnXUvCB.js              32.15 kB │ gzip:   4.75 kB
dist/assets/Rentabilidad-Hnxewtu0.js        36.32 kB │ gzip:   4.59 kB
dist/assets/Deposito-BGzes9wz.js            39.89 kB │ gzip:   5.29 kB
dist/assets/Pos-C4UkUwrt.js                 43.21 kB │ gzip:   6.83 kB
dist/assets/Clientes-CoDJs5Ea.js            49.31 kB │ gzip:   5.95 kB
dist/assets/Pocket-DYC28_Ub.js              49.47 kB │ gzip:   7.63 kB
dist/assets/Productos-C7ZITY7l.js           57.49 kB │ gzip:   7.26 kB
dist/assets/vendor-Rs3EC_N-.js              59.88 kB │ gzip:  19.21 kB
dist/assets/Pedidos-Dym2FKSW.js             63.78 kB │ gzip:   7.93 kB
dist/assets/supabase-ChnKTXnD.js           165.01 kB │ gzip:  42.68 kB
dist/assets/index-DKeaqFdr.js              168.80 kB │ gzip:  24.32 kB
dist/assets/react-BO-hTiSz.js              205.79 kB │ gzip:  63.04 kB
dist/assets/scanner-DnhfxfCx.js            457.28 kB │ gzip: 116.76 kB
✓ built in 7.05s

PWA v1.2.0
mode      generateSW
precache  24 entries (1540.12 KiB)
files generated
  dist/sw.js
  dist/workbox-ffa4df14.js
```

## minimarket-system: pnpm test:components

```bash
pnpm -C minimarket-system test:components 
```

```

> react_repo@0.0.0 test:components /home/eevan/ProyectosIA/aidrive_genspark__review_fase1_fase2_20260208/minimarket-system
> npx vitest run

npm warn Unknown env config "dir". This will stop working in the next major version of npm.

 RUN  v4.0.17 /home/eevan/ProyectosIA/aidrive_genspark__review_fase1_fase2_20260208/minimarket-system

 ✓ src/lib/roles.test.ts (56 tests) 55ms
 ✓ src/pages/Dashboard.test.tsx (5 tests) 231ms
stderr | src/components/Layout.test.tsx > Layout Component (Sidebar) > renders children content
⚠️ React Router Future Flag Warning: React Router will begin wrapping state updates in `React.startTransition` in v7. You can use the `v7_startTransition` future flag to opt-in early. For more information, see https://reactrouter.com/v6/upgrading/future#v7_starttransition.
⚠️ React Router Future Flag Warning: Relative route resolution within Splat routes is changing in v7. You can use the `v7_relativeSplatPath` future flag to opt-in early. For more information, see https://reactrouter.com/v6/upgrading/future#v7_relativesplatpath.

Error: Test error
    at ThrowingComponent (/home/eevan/ProyectosIA/aidrive_genspark__review_fase1_fase2_20260208/minimarket-system/src/components/ErrorBoundary.test.tsx:17:23)
    at renderWithHooks (/home/eevan/ProyectosIA/aidrive_genspark__review_fase1_fase2_20260208/minimarket-system/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/cjs/react-dom.development.js:15486:18)
    at mountIndeterminateComponent (/home/eevan/ProyectosIA/aidrive_genspark__review_fase1_fase2_20260208/minimarket-system/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/cjs/react-dom.development.js:20103:13)
    at beginWork (/home/eevan/ProyectosIA/aidrive_genspark__review_fase1_fase2_20260208/minimarket-system/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/cjs/react-dom.development.js:21626:16)
    at HTMLUnknownElement.callCallback (/home/eevan/ProyectosIA/aidrive_genspark__review_fase1_fase2_20260208/minimarket-system/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/cjs/react-dom.development.js:4164:14)
    at HTMLUnknownElement.callTheUserObjectsOperation (/home/eevan/ProyectosIA/aidrive_genspark__review_fase1_fase2_20260208/minimarket-system/node_modules/.pnpm/jsdom@27.4.0/node_modules/jsdom/lib/jsdom/living/generated/EventListener.js:26:30)
    at innerInvokeEventListeners (/home/eevan/ProyectosIA/aidrive_genspark__review_fase1_fase2_20260208/minimarket-system/node_modules/.pnpm/jsdom@27.4.0/node_modules/jsdom/lib/jsdom/living/events/EventTarget-impl.js:360:16)
    at invokeEventListeners (/home/eevan/ProyectosIA/aidrive_genspark__review_fase1_fase2_20260208/minimarket-system/node_modules/.pnpm/jsdom@27.4.0/node_modules/jsdom/lib/jsdom/living/events/EventTarget-impl.js:296:3)
    at HTMLUnknownElementImpl._dispatch (/home/eevan/ProyectosIA/aidrive_genspark__review_fase1_fase2_20260208/minimarket-system/node_modules/.pnpm/jsdom@27.4.0/node_modules/jsdom/lib/jsdom/living/events/EventTarget-impl.js:243:9)
    at HTMLUnknownElementImpl.dispatchEvent (/home/eevan/ProyectosIA/aidrive_genspark__review_fase1_fase2_20260208/minimarket-system/node_modules/.pnpm/jsdom@27.4.0/node_modules/jsdom/lib/jsdom/living/events/EventTarget-impl.js:114:17)
Error: Test error
    at ThrowingComponent (/home/eevan/ProyectosIA/aidrive_genspark__review_fase1_fase2_20260208/minimarket-system/src/components/ErrorBoundary.test.tsx:17:23)
    at renderWithHooks (/home/eevan/ProyectosIA/aidrive_genspark__review_fase1_fase2_20260208/minimarket-system/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/cjs/react-dom.development.js:15486:18)
    at mountIndeterminateComponent (/home/eevan/ProyectosIA/aidrive_genspark__review_fase1_fase2_20260208/minimarket-system/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/cjs/react-dom.development.js:20103:13)
    at beginWork (/home/eevan/ProyectosIA/aidrive_genspark__review_fase1_fase2_20260208/minimarket-system/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/cjs/react-dom.development.js:21626:16)
    at HTMLUnknownElement.callCallback (/home/eevan/ProyectosIA/aidrive_genspark__review_fase1_fase2_20260208/minimarket-system/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/cjs/react-dom.development.js:4164:14)
    at HTMLUnknownElement.callTheUserObjectsOperation (/home/eevan/ProyectosIA/aidrive_genspark__review_fase1_fase2_20260208/minimarket-system/node_modules/.pnpm/jsdom@27.4.0/node_modules/jsdom/lib/jsdom/living/generated/EventListener.js:26:30)
    at innerInvokeEventListeners (/home/eevan/ProyectosIA/aidrive_genspark__review_fase1_fase2_20260208/minimarket-system/node_modules/.pnpm/jsdom@27.4.0/node_modules/jsdom/lib/jsdom/living/events/EventTarget-impl.js:360:16)
    at invokeEventListeners (/home/eevan/ProyectosIA/aidrive_genspark__review_fase1_fase2_20260208/minimarket-system/node_modules/.pnpm/jsdom@27.4.0/node_modules/jsdom/lib/jsdom/living/events/EventTarget-impl.js:296:3)
    at HTMLUnknownElementImpl._dispatch (/home/eevan/ProyectosIA/aidrive_genspark__review_fase1_fase2_20260208/minimarket-system/node_modules/.pnpm/jsdom@27.4.0/node_modules/jsdom/lib/jsdom/living/events/EventTarget-impl.js:243:9)
    at HTMLUnknownElementImpl.dispatchEvent (/home/eevan/ProyectosIA/aidrive_genspark__review_fase1_fase2_20260208/minimarket-system/node_modules/.pnpm/jsdom@27.4.0/node_modules/jsdom/lib/jsdom/living/events/EventTarget-impl.js:114:17)
Error: Test error
    at ThrowingComponent (/home/eevan/ProyectosIA/aidrive_genspark__review_fase1_fase2_20260208/minimarket-system/src/components/ErrorBoundary.test.tsx:17:23)
    at renderWithHooks (/home/eevan/ProyectosIA/aidrive_genspark__review_fase1_fase2_20260208/minimarket-system/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/cjs/react-dom.development.js:15486:18)
    at mountIndeterminateComponent (/home/eevan/ProyectosIA/aidrive_genspark__review_fase1_fase2_20260208/minimarket-system/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/cjs/react-dom.development.js:20103:13)
    at beginWork (/home/eevan/ProyectosIA/aidrive_genspark__review_fase1_fase2_20260208/minimarket-system/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/cjs/react-dom.development.js:21626:16)
    at HTMLUnknownElement.callCallback (/home/eevan/ProyectosIA/aidrive_genspark__review_fase1_fase2_20260208/minimarket-system/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/cjs/react-dom.development.js:4164:14)
    at HTMLUnknownElement.callTheUserObjectsOperation (/home/eevan/ProyectosIA/aidrive_genspark__review_fase1_fase2_20260208/minimarket-system/node_modules/.pnpm/jsdom@27.4.0/node_modules/jsdom/lib/jsdom/living/generated/EventListener.js:26:30)
    at innerInvokeEventListeners (/home/eevan/ProyectosIA/aidrive_genspark__review_fase1_fase2_20260208/minimarket-system/node_modules/.pnpm/jsdom@27.4.0/node_modules/jsdom/lib/jsdom/living/events/EventTarget-impl.js:360:16)
    at invokeEventListeners (/home/eevan/ProyectosIA/aidrive_genspark__review_fase1_fase2_20260208/minimarket-system/node_modules/.pnpm/jsdom@27.4.0/node_modules/jsdom/lib/jsdom/living/events/EventTarget-impl.js:296:3)
    at HTMLUnknownElementImpl._dispatch (/home/eevan/ProyectosIA/aidrive_genspark__review_fase1_fase2_20260208/minimarket-system/node_modules/.pnpm/jsdom@27.4.0/node_modules/jsdom/lib/jsdom/living/events/EventTarget-impl.js:243:9)
    at HTMLUnknownElementImpl.dispatchEvent (/home/eevan/ProyectosIA/aidrive_genspark__review_fase1_fase2_20260208/minimarket-system/node_modules/.pnpm/jsdom@27.4.0/node_modules/jsdom/lib/jsdom/living/events/EventTarget-impl.js:114:17)
 ✓ src/components/Layout.test.tsx (7 tests) 1688ms
     ✓ opens logout modal and allows exit without note  635ms
     ✓ saves bitacora note before signing out  671ms
Error: Test error
    at ThrowingComponent (/home/eevan/ProyectosIA/aidrive_genspark__review_fase1_fase2_20260208/minimarket-system/src/components/ErrorBoundary.test.tsx:17:23)
    at renderWithHooks (/home/eevan/ProyectosIA/aidrive_genspark__review_fase1_fase2_20260208/minimarket-system/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/cjs/react-dom.development.js:15486:18)
    at mountIndeterminateComponent (/home/eevan/ProyectosIA/aidrive_genspark__review_fase1_fase2_20260208/minimarket-system/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/cjs/react-dom.development.js:20103:13)
    at beginWork (/home/eevan/ProyectosIA/aidrive_genspark__review_fase1_fase2_20260208/minimarket-system/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/cjs/react-dom.development.js:21626:16)
    at HTMLUnknownElement.callCallback (/home/eevan/ProyectosIA/aidrive_genspark__review_fase1_fase2_20260208/minimarket-system/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/cjs/react-dom.development.js:4164:14)
    at HTMLUnknownElement.callTheUserObjectsOperation (/home/eevan/ProyectosIA/aidrive_genspark__review_fase1_fase2_20260208/minimarket-system/node_modules/.pnpm/jsdom@27.4.0/node_modules/jsdom/lib/jsdom/living/generated/EventListener.js:26:30)
    at innerInvokeEventListeners (/home/eevan/ProyectosIA/aidrive_genspark__review_fase1_fase2_20260208/minimarket-system/node_modules/.pnpm/jsdom@27.4.0/node_modules/jsdom/lib/jsdom/living/events/EventTarget-impl.js:360:16)
    at invokeEventListeners (/home/eevan/ProyectosIA/aidrive_genspark__review_fase1_fase2_20260208/minimarket-system/node_modules/.pnpm/jsdom@27.4.0/node_modules/jsdom/lib/jsdom/living/events/EventTarget-impl.js:296:3)
    at HTMLUnknownElementImpl._dispatch (/home/eevan/ProyectosIA/aidrive_genspark__review_fase1_fase2_20260208/minimarket-system/node_modules/.pnpm/jsdom@27.4.0/node_modules/jsdom/lib/jsdom/living/events/EventTarget-impl.js:243:9)
    at HTMLUnknownElementImpl.dispatchEvent (/home/eevan/ProyectosIA/aidrive_genspark__review_fase1_fase2_20260208/minimarket-system/node_modules/.pnpm/jsdom@27.4.0/node_modules/jsdom/lib/jsdom/living/events/EventTarget-impl.js:114:17)
Error: Test error
    at ThrowingComponent (/home/eevan/ProyectosIA/aidrive_genspark__review_fase1_fase2_20260208/minimarket-system/src/components/ErrorBoundary.test.tsx:17:23)
    at renderWithHooks (/home/eevan/ProyectosIA/aidrive_genspark__review_fase1_fase2_20260208/minimarket-system/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/cjs/react-dom.development.js:15486:18)
    at mountIndeterminateComponent (/home/eevan/ProyectosIA/aidrive_genspark__review_fase1_fase2_20260208/minimarket-system/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/cjs/react-dom.development.js:20103:13)
    at beginWork (/home/eevan/ProyectosIA/aidrive_genspark__review_fase1_fase2_20260208/minimarket-system/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/cjs/react-dom.development.js:21626:16)
    at HTMLUnknownElement.callCallback (/home/eevan/ProyectosIA/aidrive_genspark__review_fase1_fase2_20260208/minimarket-system/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/cjs/react-dom.development.js:4164:14)
    at HTMLUnknownElement.callTheUserObjectsOperation (/home/eevan/ProyectosIA/aidrive_genspark__review_fase1_fase2_20260208/minimarket-system/node_modules/.pnpm/jsdom@27.4.0/node_modules/jsdom/lib/jsdom/living/generated/EventListener.js:26:30)
    at innerInvokeEventListeners (/home/eevan/ProyectosIA/aidrive_genspark__review_fase1_fase2_20260208/minimarket-system/node_modules/.pnpm/jsdom@27.4.0/node_modules/jsdom/lib/jsdom/living/events/EventTarget-impl.js:360:16)
    at invokeEventListeners (/home/eevan/ProyectosIA/aidrive_genspark__review_fase1_fase2_20260208/minimarket-system/node_modules/.pnpm/jsdom@27.4.0/node_modules/jsdom/lib/jsdom/living/events/EventTarget-impl.js:296:3)
    at HTMLUnknownElementImpl._dispatch (/home/eevan/ProyectosIA/aidrive_genspark__review_fase1_fase2_20260208/minimarket-system/node_modules/.pnpm/jsdom@27.4.0/node_modules/jsdom/lib/jsdom/living/events/EventTarget-impl.js:243:9)
    at HTMLUnknownElementImpl.dispatchEvent (/home/eevan/ProyectosIA/aidrive_genspark__review_fase1_fase2_20260208/minimarket-system/node_modules/.pnpm/jsdom@27.4.0/node_modules/jsdom/lib/jsdom/living/events/EventTarget-impl.js:114:17)
Error: Test error
    at ThrowingComponent (/home/eevan/ProyectosIA/aidrive_genspark__review_fase1_fase2_20260208/minimarket-system/src/components/ErrorBoundary.test.tsx:17:23)
    at renderWithHooks (/home/eevan/ProyectosIA/aidrive_genspark__review_fase1_fase2_20260208/minimarket-system/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/cjs/react-dom.development.js:15486:18)
    at mountIndeterminateComponent (/home/eevan/ProyectosIA/aidrive_genspark__review_fase1_fase2_20260208/minimarket-system/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/cjs/react-dom.development.js:20103:13)
    at beginWork (/home/eevan/ProyectosIA/aidrive_genspark__review_fase1_fase2_20260208/minimarket-system/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/cjs/react-dom.development.js:21626:16)
    at HTMLUnknownElement.callCallback (/home/eevan/ProyectosIA/aidrive_genspark__review_fase1_fase2_20260208/minimarket-system/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/cjs/react-dom.development.js:4164:14)
    at HTMLUnknownElement.callTheUserObjectsOperation (/home/eevan/ProyectosIA/aidrive_genspark__review_fase1_fase2_20260208/minimarket-system/node_modules/.pnpm/jsdom@27.4.0/node_modules/jsdom/lib/jsdom/living/generated/EventListener.js:26:30)
    at innerInvokeEventListeners (/home/eevan/ProyectosIA/aidrive_genspark__review_fase1_fase2_20260208/minimarket-system/node_modules/.pnpm/jsdom@27.4.0/node_modules/jsdom/lib/jsdom/living/events/EventTarget-impl.js:360:16)
    at invokeEventListeners (/home/eevan/ProyectosIA/aidrive_genspark__review_fase1_fase2_20260208/minimarket-system/node_modules/.pnpm/jsdom@27.4.0/node_modules/jsdom/lib/jsdom/living/events/EventTarget-impl.js:296:3)
    at HTMLUnknownElementImpl._dispatch (/home/eevan/ProyectosIA/aidrive_genspark__review_fase1_fase2_20260208/minimarket-system/node_modules/.pnpm/jsdom@27.4.0/node_modules/jsdom/lib/jsdom/living/events/EventTarget-impl.js:243:9)
    at HTMLUnknownElementImpl.dispatchEvent (/home/eevan/ProyectosIA/aidrive_genspark__review_fase1_fase2_20260208/minimarket-system/node_modules/.pnpm/jsdom@27.4.0/node_modules/jsdom/lib/jsdom/living/events/EventTarget-impl.js:114:17)
Error: Test error
    at ThrowingComponent (/home/eevan/ProyectosIA/aidrive_genspark__review_fase1_fase2_20260208/minimarket-system/src/components/ErrorBoundary.test.tsx:17:23)
    at renderWithHooks (/home/eevan/ProyectosIA/aidrive_genspark__review_fase1_fase2_20260208/minimarket-system/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/cjs/react-dom.development.js:15486:18)
    at mountIndeterminateComponent (/home/eevan/ProyectosIA/aidrive_genspark__review_fase1_fase2_20260208/minimarket-system/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/cjs/react-dom.development.js:20103:13)
    at beginWork (/home/eevan/ProyectosIA/aidrive_genspark__review_fase1_fase2_20260208/minimarket-system/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/cjs/react-dom.development.js:21626:16)
    at HTMLUnknownElement.callCallback (/home/eevan/ProyectosIA/aidrive_genspark__review_fase1_fase2_20260208/minimarket-system/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/cjs/react-dom.development.js:4164:14)
    at HTMLUnknownElement.callTheUserObjectsOperation (/home/eevan/ProyectosIA/aidrive_genspark__review_fase1_fase2_20260208/minimarket-system/node_modules/.pnpm/jsdom@27.4.0/node_modules/jsdom/lib/jsdom/living/generated/EventListener.js:26:30)
    at innerInvokeEventListeners (/home/eevan/ProyectosIA/aidrive_genspark__review_fase1_fase2_20260208/minimarket-system/node_modules/.pnpm/jsdom@27.4.0/node_modules/jsdom/lib/jsdom/living/events/EventTarget-impl.js:360:16)
    at invokeEventListeners (/home/eevan/ProyectosIA/aidrive_genspark__review_fase1_fase2_20260208/minimarket-system/node_modules/.pnpm/jsdom@27.4.0/node_modules/jsdom/lib/jsdom/living/events/EventTarget-impl.js:296:3)
    at HTMLUnknownElementImpl._dispatch (/home/eevan/ProyectosIA/aidrive_genspark__review_fase1_fase2_20260208/minimarket-system/node_modules/.pnpm/jsdom@27.4.0/node_modules/jsdom/lib/jsdom/living/events/EventTarget-impl.js:243:9)
    at HTMLUnknownElementImpl.dispatchEvent (/home/eevan/ProyectosIA/aidrive_genspark__review_fase1_fase2_20260208/minimarket-system/node_modules/.pnpm/jsdom@27.4.0/node_modules/jsdom/lib/jsdom/living/events/EventTarget-impl.js:114:17)
Error: Test error
    at ThrowingComponent (/home/eevan/ProyectosIA/aidrive_genspark__review_fase1_fase2_20260208/minimarket-system/src/components/ErrorBoundary.test.tsx:17:23)
    at renderWithHooks (/home/eevan/ProyectosIA/aidrive_genspark__review_fase1_fase2_20260208/minimarket-system/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/cjs/react-dom.development.js:15486:18)
    at mountIndeterminateComponent (/home/eevan/ProyectosIA/aidrive_genspark__review_fase1_fase2_20260208/minimarket-system/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/cjs/react-dom.development.js:20103:13)
    at beginWork (/home/eevan/ProyectosIA/aidrive_genspark__review_fase1_fase2_20260208/minimarket-system/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/cjs/react-dom.development.js:21626:16)
    at HTMLUnknownElement.callCallback (/home/eevan/ProyectosIA/aidrive_genspark__review_fase1_fase2_20260208/minimarket-system/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/cjs/react-dom.development.js:4164:14)
    at HTMLUnknownElement.callTheUserObjectsOperation (/home/eevan/ProyectosIA/aidrive_genspark__review_fase1_fase2_20260208/minimarket-system/node_modules/.pnpm/jsdom@27.4.0/node_modules/jsdom/lib/jsdom/living/generated/EventListener.js:26:30)
    at innerInvokeEventListeners (/home/eevan/ProyectosIA/aidrive_genspark__review_fase1_fase2_20260208/minimarket-system/node_modules/.pnpm/jsdom@27.4.0/node_modules/jsdom/lib/jsdom/living/events/EventTarget-impl.js:360:16)
    at invokeEventListeners (/home/eevan/ProyectosIA/aidrive_genspark__review_fase1_fase2_20260208/minimarket-system/node_modules/.pnpm/jsdom@27.4.0/node_modules/jsdom/lib/jsdom/living/events/EventTarget-impl.js:296:3)
    at HTMLUnknownElementImpl._dispatch (/home/eevan/ProyectosIA/aidrive_genspark__review_fase1_fase2_20260208/minimarket-system/node_modules/.pnpm/jsdom@27.4.0/node_modules/jsdom/lib/jsdom/living/events/EventTarget-impl.js:243:9)
    at HTMLUnknownElementImpl.dispatchEvent (/home/eevan/ProyectosIA/aidrive_genspark__review_fase1_fase2_20260208/minimarket-system/node_modules/.pnpm/jsdom@27.4.0/node_modules/jsdom/lib/jsdom/living/events/EventTarget-impl.js:114:17)
Error: Test error
    at ThrowingComponent (/home/eevan/ProyectosIA/aidrive_genspark__review_fase1_fase2_20260208/minimarket-system/src/components/ErrorBoundary.test.tsx:17:23)
    at renderWithHooks (/home/eevan/ProyectosIA/aidrive_genspark__review_fase1_fase2_20260208/minimarket-system/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/cjs/react-dom.development.js:15486:18)
    at mountIndeterminateComponent (/home/eevan/ProyectosIA/aidrive_genspark__review_fase1_fase2_20260208/minimarket-system/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/cjs/react-dom.development.js:20103:13)
    at beginWork (/home/eevan/ProyectosIA/aidrive_genspark__review_fase1_fase2_20260208/minimarket-system/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/cjs/react-dom.development.js:21626:16)
    at HTMLUnknownElement.callCallback (/home/eevan/ProyectosIA/aidrive_genspark__review_fase1_fase2_20260208/minimarket-system/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/cjs/react-dom.development.js:4164:14)
    at HTMLUnknownElement.callTheUserObjectsOperation (/home/eevan/ProyectosIA/aidrive_genspark__review_fase1_fase2_20260208/minimarket-system/node_modules/.pnpm/jsdom@27.4.0/node_modules/jsdom/lib/jsdom/living/generated/EventListener.js:26:30)
    at innerInvokeEventListeners (/home/eevan/ProyectosIA/aidrive_genspark__review_fase1_fase2_20260208/minimarket-system/node_modules/.pnpm/jsdom@27.4.0/node_modules/jsdom/lib/jsdom/living/events/EventTarget-impl.js:360:16)
    at invokeEventListeners (/home/eevan/ProyectosIA/aidrive_genspark__review_fase1_fase2_20260208/minimarket-system/node_modules/.pnpm/jsdom@27.4.0/node_modules/jsdom/lib/jsdom/living/events/EventTarget-impl.js:296:3)
    at HTMLUnknownElementImpl._dispatch (/home/eevan/ProyectosIA/aidrive_genspark__review_fase1_fase2_20260208/minimarket-system/node_modules/.pnpm/jsdom@27.4.0/node_modules/jsdom/lib/jsdom/living/events/EventTarget-impl.js:243:9)
    at HTMLUnknownElementImpl.dispatchEvent (/home/eevan/ProyectosIA/aidrive_genspark__review_fase1_fase2_20260208/minimarket-system/node_modules/.pnpm/jsdom@27.4.0/node_modules/jsdom/lib/jsdom/living/events/EventTarget-impl.js:114:17)
Error: Test error
    at ThrowingComponent (/home/eevan/ProyectosIA/aidrive_genspark__review_fase1_fase2_20260208/minimarket-system/src/components/ErrorBoundary.test.tsx:17:23)
    at renderWithHooks (/home/eevan/ProyectosIA/aidrive_genspark__review_fase1_fase2_20260208/minimarket-system/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/cjs/react-dom.development.js:15486:18)
    at mountIndeterminateComponent (/home/eevan/ProyectosIA/aidrive_genspark__review_fase1_fase2_20260208/minimarket-system/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/cjs/react-dom.development.js:20103:13)
    at beginWork (/home/eevan/ProyectosIA/aidrive_genspark__review_fase1_fase2_20260208/minimarket-system/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/cjs/react-dom.development.js:21626:16)
    at HTMLUnknownElement.callCallback (/home/eevan/ProyectosIA/aidrive_genspark__review_fase1_fase2_20260208/minimarket-system/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/cjs/react-dom.development.js:4164:14)
    at HTMLUnknownElement.callTheUserObjectsOperation (/home/eevan/ProyectosIA/aidrive_genspark__review_fase1_fase2_20260208/minimarket-system/node_modules/.pnpm/jsdom@27.4.0/node_modules/jsdom/lib/jsdom/living/generated/EventListener.js:26:30)
    at innerInvokeEventListeners (/home/eevan/ProyectosIA/aidrive_genspark__review_fase1_fase2_20260208/minimarket-system/node_modules/.pnpm/jsdom@27.4.0/node_modules/jsdom/lib/jsdom/living/events/EventTarget-impl.js:360:16)
    at invokeEventListeners (/home/eevan/ProyectosIA/aidrive_genspark__review_fase1_fase2_20260208/minimarket-system/node_modules/.pnpm/jsdom@27.4.0/node_modules/jsdom/lib/jsdom/living/events/EventTarget-impl.js:296:3)
    at HTMLUnknownElementImpl._dispatch (/home/eevan/ProyectosIA/aidrive_genspark__review_fase1_fase2_20260208/minimarket-system/node_modules/.pnpm/jsdom@27.4.0/node_modules/jsdom/lib/jsdom/living/events/EventTarget-impl.js:243:9)
    at HTMLUnknownElementImpl.dispatchEvent (/home/eevan/ProyectosIA/aidrive_genspark__review_fase1_fase2_20260208/minimarket-system/node_modules/.pnpm/jsdom@27.4.0/node_modules/jsdom/lib/jsdom/living/events/EventTarget-impl.js:114:17)
 ✓ src/components/ErrorBoundary.test.tsx (5 tests) 516ms
     ✓ shows retry button that resets error state  357ms
stderr | src/pages/Login.test.tsx > Login Component > renders login form correctly
⚠️ React Router Future Flag Warning: React Router will begin wrapping state updates in `React.startTransition` in v7. You can use the `v7_startTransition` future flag to opt-in early. For more information, see https://reactrouter.com/v6/upgrading/future#v7_starttransition.
⚠️ React Router Future Flag Warning: Relative route resolution within Splat routes is changing in v7. You can use the `v7_relativeSplatPath` future flag to opt-in early. For more information, see https://reactrouter.com/v6/upgrading/future#v7_relativesplatpath.

 ✓ src/pages/Login.test.tsx (3 tests) 562ms
     ✓ renders login form correctly  409ms
 ✓ src/hooks/queries/useDashboardStats.test.tsx (3 tests) 101ms
 ✓ src/hooks/queries/useProductos.test.tsx (3 tests) 185ms
 ✓ src/pages/Tareas.optimistic.test.tsx (1 test) 1562ms
     ✓ shows optimistic task immediately on create  1545ms
 ✓ src/hooks/queries/useTareas.test.tsx (3 tests) 119ms
 ✓ src/hooks/queries/useKardex.test.tsx (3 tests) 117ms
 ✓ src/hooks/queries/useStock.test.tsx (3 tests) 112ms
 ✓ src/hooks/queries/useProveedores.test.tsx (3 tests) 121ms
 ✓ src/hooks/queries/useRentabilidad.test.tsx (3 tests) 103ms
 ✓ src/hooks/queries/useDeposito.test.tsx (3 tests) 114ms

 Test Files  14 passed (14)
      Tests  101 passed (101)
   Start at  06:36:45
   Duration  15.57s (transform 1.80s, setup 7.16s, import 7.72s, tests 5.59s, environment 18.25s)

```

## REMOTE BASELINE (pre-push) supabase migration list --linked

```bash
supabase migration list --linked 
```

```
Cannot find project ref. Have you run supabase link?
Try rerunning the command with --debug to troubleshoot the error.
```

## REMOTE APPLY pending migrations supabase db push --linked --yes

```bash
supabase db push --linked --yes 
```

```
Cannot find project ref. Have you run supabase link?
Try rerunning the command with --debug to troubleshoot the error.
```

## REMOTE VERIFY (post-push) supabase migration list --linked

```bash
supabase migration list --linked 
```

```
Cannot find project ref. Have you run supabase link?
Try rerunning the command with --debug to troubleshoot the error.
```

## REMOTE DEPLOY api-minimarket (verify_jwt=false)

```bash
supabase functions deploy api-minimarket --use-api --no-verify-jwt 
```

```
Cannot find project ref. Have you run supabase link?
Try rerunning the command with --debug to troubleshoot the error.
```

## REMOTE DEPLOY api-proveedor

```bash
supabase functions deploy api-proveedor --use-api 
```

```
Cannot find project ref. Have you run supabase link?
Try rerunning the command with --debug to troubleshoot the error.
```

## REMOTE VERIFY functions list (versions + verify_jwt)

```bash
bash -lc supabase\ functions\ list\ --project-ref\ dqaygmjpzoqjjrywdsxi\ --output\ json\ \|\ jq\ -r\ \'.\[\].name\ +\ \"\\t\"\ +\ \"v\"\ +\ \(\ .version\|tostring\ \)\ +\ \"\\tverify_jwt=\"\ +\ \(\ .verify_jwt\|tostring\ \)\'\ \|\ sort 
```

```
jq: error (at <stdin>:166): Cannot index array with string "verify_jwt"
A new version of Supabase CLI is available: v2.75.0 (currently installed v2.72.7)
We recommend updating regularly for new features and bug fixes: https://supabase.com/docs/guides/cli/getting-started#updating-the-supabase-cli
```

## REMOTE (linked) supabase migration list --linked

```bash
supabase migration list --linked 
```

```
Initialising login role...
Connecting to remote database...

  
   Local          | Remote         | Time (UTC)          
  ----------------|----------------|---------------------
   20250101000000 | 20250101000000 | 2025-01-01 00:00:00 
   20251103       | 20251103       | 20251103            
   20260104020000 | 20260104020000 | 2026-01-04 02:00:00 
   20260104083000 | 20260104083000 | 2026-01-04 08:30:00 
   20260109060000 | 20260109060000 | 2026-01-09 06:00:00 
   20260109070000 | 20260109070000 | 2026-01-09 07:00:00 
   20260109090000 | 20260109090000 | 2026-01-09 09:00:00 
   20260110000000 | 20260110000000 | 2026-01-10 00:00:00 
   20260110100000 | 20260110100000 | 2026-01-10 10:00:00 
   20260116000000 | 20260116000000 | 2026-01-16 00:00:00 
   20260131000000 | 20260131000000 | 2026-01-31 00:00:00 
   20260131020000 | 20260131020000 | 2026-01-31 02:00:00 
   20260131034034 | 20260131034034 | 2026-01-31 03:40:34 
   20260131034328 | 20260131034328 | 2026-01-31 03:43:28 
   20260202000000 | 20260202000000 | 2026-02-02 00:00:00 
   20260202083000 | 20260202083000 | 2026-02-02 08:30:00 
   20260204100000 | 20260204100000 | 2026-02-04 10:00:00 
   20260204110000 | 20260204110000 | 2026-02-04 11:00:00 
   20260204120000 | 20260204120000 | 2026-02-04 12:00:00 
   20260206000000 | 20260206000000 | 2026-02-06 00:00:00 
   20260206010000 | 20260206010000 | 2026-02-06 01:00:00 
   20260206020000 | 20260206020000 | 2026-02-06 02:00:00 
   20260206030000 | 20260206030000 | 2026-02-06 03:00:00 
   20260206235900 | 20260206235900 | 2026-02-06 23:59:00 
   20260207000000 | 20260207000000 | 2026-02-07 00:00:00 
   20260207010000 | 20260207010000 | 2026-02-07 01:00:00 
   20260207020000 | 20260207020000 | 2026-02-07 02:00:00 
   20260207030000 | 20260207030000 | 2026-02-07 03:00:00 
   20260208000000 | 20260208000000 | 2026-02-08 00:00:00 
   20260208010000 | 20260208010000 | 2026-02-08 01:00:00 
   20260208020000 |                | 2026-02-08 02:00:00 
   20260208030000 |                | 2026-02-08 03:00:00 

A new version of Supabase CLI is available: v2.75.0 (currently installed v2.72.7)
We recommend updating regularly for new features and bug fixes: https://supabase.com/docs/guides/cli/getting-started#updating-the-supabase-cli
```

## REMOTE (linked) supabase db push --linked --yes

```bash
supabase db push --linked --yes 
```

```
Initialising login role...
Connecting to remote database...
Do you want to push these migrations to the remote database?
 • 20260208020000_add_rate_limit_state.sql
 • 20260208030000_add_circuit_breaker_state.sql

 [Y/n] y
Applying migration 20260208020000_add_rate_limit_state.sql...
Applying migration 20260208030000_add_circuit_breaker_state.sql...
Finished supabase db push.
A new version of Supabase CLI is available: v2.75.0 (currently installed v2.72.7)
We recommend updating regularly for new features and bug fixes: https://supabase.com/docs/guides/cli/getting-started#updating-the-supabase-cli
```

## REMOTE (linked) supabase migration list --linked (post-push)

```bash
supabase migration list --linked 
```

```
Initialising login role...
Connecting to remote database...

  
   Local          | Remote         | Time (UTC)          
  ----------------|----------------|---------------------
   20250101000000 | 20250101000000 | 2025-01-01 00:00:00 
   20251103       | 20251103       | 20251103            
   20260104020000 | 20260104020000 | 2026-01-04 02:00:00 
   20260104083000 | 20260104083000 | 2026-01-04 08:30:00 
   20260109060000 | 20260109060000 | 2026-01-09 06:00:00 
   20260109070000 | 20260109070000 | 2026-01-09 07:00:00 
   20260109090000 | 20260109090000 | 2026-01-09 09:00:00 
   20260110000000 | 20260110000000 | 2026-01-10 00:00:00 
   20260110100000 | 20260110100000 | 2026-01-10 10:00:00 
   20260116000000 | 20260116000000 | 2026-01-16 00:00:00 
   20260131000000 | 20260131000000 | 2026-01-31 00:00:00 
   20260131020000 | 20260131020000 | 2026-01-31 02:00:00 
   20260131034034 | 20260131034034 | 2026-01-31 03:40:34 
   20260131034328 | 20260131034328 | 2026-01-31 03:43:28 
   20260202000000 | 20260202000000 | 2026-02-02 00:00:00 
   20260202083000 | 20260202083000 | 2026-02-02 08:30:00 
   20260204100000 | 20260204100000 | 2026-02-04 10:00:00 
   20260204110000 | 20260204110000 | 2026-02-04 11:00:00 
   20260204120000 | 20260204120000 | 2026-02-04 12:00:00 
   20260206000000 | 20260206000000 | 2026-02-06 00:00:00 
   20260206010000 | 20260206010000 | 2026-02-06 01:00:00 
   20260206020000 | 20260206020000 | 2026-02-06 02:00:00 
   20260206030000 | 20260206030000 | 2026-02-06 03:00:00 
   20260206235900 | 20260206235900 | 2026-02-06 23:59:00 
   20260207000000 | 20260207000000 | 2026-02-07 00:00:00 
   20260207010000 | 20260207010000 | 2026-02-07 01:00:00 
   20260207020000 | 20260207020000 | 2026-02-07 02:00:00 
   20260207030000 | 20260207030000 | 2026-02-07 03:00:00 
   20260208000000 | 20260208000000 | 2026-02-08 00:00:00 
   20260208010000 | 20260208010000 | 2026-02-08 01:00:00 
   20260208020000 | 20260208020000 | 2026-02-08 02:00:00 
   20260208030000 | 20260208030000 | 2026-02-08 03:00:00 

A new version of Supabase CLI is available: v2.75.0 (currently installed v2.72.7)
We recommend updating regularly for new features and bug fixes: https://supabase.com/docs/guides/cli/getting-started#updating-the-supabase-cli
```

## REMOTE DEPLOY api-minimarket (verify_jwt=false)

```bash
supabase functions deploy api-minimarket --use-api --no-verify-jwt 
```

```
WARNING: Functions using fallback import map: api-minimarket
Please use recommended per function dependency declaration  https://supabase.com/docs/guides/functions/import-maps
Uploading asset (api-minimarket): supabase/functions/import_map.json
Uploading asset (api-minimarket): supabase/functions/api-minimarket/index.ts
Uploading asset (api-minimarket): supabase/functions/api-minimarket/handlers/bitacora.ts
Uploading asset (api-minimarket): supabase/functions/api-minimarket/helpers/supabase.ts
Uploading asset (api-minimarket): supabase/functions/_shared/errors.ts
Uploading asset (api-minimarket): supabase/functions/_shared/logger.ts
Uploading asset (api-minimarket): supabase/functions/_shared/response.ts
Uploading asset (api-minimarket): supabase/functions/api-minimarket/handlers/ofertas.ts
Uploading asset (api-minimarket): supabase/functions/api-minimarket/helpers/validation.ts
Uploading asset (api-minimarket): supabase/functions/api-minimarket/handlers/cuentas_corrientes.ts
Uploading asset (api-minimarket): supabase/functions/api-minimarket/handlers/clientes.ts
Uploading asset (api-minimarket): supabase/functions/api-minimarket/handlers/ventas.ts
Uploading asset (api-minimarket): supabase/functions/api-minimarket/handlers/insights.ts
Uploading asset (api-minimarket): supabase/functions/api-minimarket/handlers/search.ts
Uploading asset (api-minimarket): supabase/functions/api-minimarket/handlers/pedidos.ts
Uploading asset (api-minimarket): supabase/functions/api-minimarket/handlers/reservas.ts
Uploading asset (api-minimarket): supabase/functions/api-minimarket/handlers/utils.ts
Uploading asset (api-minimarket): supabase/functions/api-minimarket/helpers/pagination.ts
Uploading asset (api-minimarket): supabase/functions/api-minimarket/helpers/auth.ts
Uploading asset (api-minimarket): supabase/functions/_shared/audit.ts
Uploading asset (api-minimarket): supabase/functions/_shared/circuit-breaker.ts
Uploading asset (api-minimarket): supabase/functions/_shared/rate-limit.ts
Uploading asset (api-minimarket): supabase/functions/_shared/cors.ts
Deployed Functions on project dqaygmjpzoqjjrywdsxi: api-minimarket
You can inspect your deployment in the Dashboard: https://supabase.com/dashboard/project/dqaygmjpzoqjjrywdsxi/functions
A new version of Supabase CLI is available: v2.75.0 (currently installed v2.72.7)
We recommend updating regularly for new features and bug fixes: https://supabase.com/docs/guides/cli/getting-started#updating-the-supabase-cli
```

## REMOTE DEPLOY api-proveedor

```bash
supabase functions deploy api-proveedor --use-api 
```

```
WARNING: Functions using fallback import map: api-proveedor
Please use recommended per function dependency declaration  https://supabase.com/docs/guides/functions/import-maps
Uploading asset (api-proveedor): supabase/functions/import_map.json
Uploading asset (api-proveedor): supabase/functions/api-proveedor/index.ts
Uploading asset (api-proveedor): supabase/functions/api-proveedor/utils/auth.ts
Uploading asset (api-proveedor): supabase/functions/_shared/response.ts
Uploading asset (api-proveedor): supabase/functions/api-proveedor/utils/metrics.ts
Uploading asset (api-proveedor): supabase/functions/api-proveedor/utils/http.ts
Uploading asset (api-proveedor): supabase/functions/api-proveedor/utils/constants.ts
Uploading asset (api-proveedor): supabase/functions/api-proveedor/handlers/status.ts
Uploading asset (api-proveedor): supabase/functions/_shared/errors.ts
Uploading asset (api-proveedor): supabase/functions/_shared/logger.ts
Uploading asset (api-proveedor): supabase/functions/api-proveedor/utils/cache.ts
Uploading asset (api-proveedor): supabase/functions/api-proveedor/handlers/sincronizar.ts
Uploading asset (api-proveedor): supabase/functions/api-proveedor/handlers/productos.ts
Uploading asset (api-proveedor): supabase/functions/api-proveedor/utils/format.ts
Uploading asset (api-proveedor): supabase/functions/api-proveedor/validators.ts
Uploading asset (api-proveedor): supabase/functions/api-proveedor/utils/params.ts
Uploading asset (api-proveedor): supabase/functions/api-proveedor/handlers/precios.ts
Uploading asset (api-proveedor): supabase/functions/_shared/circuit-breaker.ts
Uploading asset (api-proveedor): supabase/functions/api-proveedor/handlers/estadisticas.ts
Uploading asset (api-proveedor): supabase/functions/api-proveedor/utils/estadisticas.ts
Uploading asset (api-proveedor): supabase/functions/api-proveedor/handlers/health.ts
Uploading asset (api-proveedor): supabase/functions/api-proveedor/utils/health.ts
Uploading asset (api-proveedor): supabase/functions/api-proveedor/handlers/configuracion.ts
Uploading asset (api-proveedor): supabase/functions/api-proveedor/utils/config.ts
Uploading asset (api-proveedor): supabase/functions/api-proveedor/handlers/comparacion.ts
Uploading asset (api-proveedor): supabase/functions/api-proveedor/utils/comparacion.ts
Uploading asset (api-proveedor): supabase/functions/api-proveedor/handlers/alertas.ts
Uploading asset (api-proveedor): supabase/functions/api-proveedor/utils/alertas.ts
Uploading asset (api-proveedor): supabase/functions/api-proveedor/schemas.ts
Uploading asset (api-proveedor): supabase/functions/api-proveedor/router.ts
Uploading asset (api-proveedor): supabase/functions/_shared/cors.ts
Uploading asset (api-proveedor): supabase/functions/_shared/rate-limit.ts
Deployed Functions on project dqaygmjpzoqjjrywdsxi: api-proveedor
You can inspect your deployment in the Dashboard: https://supabase.com/dashboard/project/dqaygmjpzoqjjrywdsxi/functions
A new version of Supabase CLI is available: v2.75.0 (currently installed v2.72.7)
We recommend updating regularly for new features and bug fixes: https://supabase.com/docs/guides/cli/getting-started#updating-the-supabase-cli
```

## REMOTE VERIFY functions list (raw json)

```bash
supabase functions list --project-ref dqaygmjpzoqjjrywdsxi --output json 
```

```
[
  {
    "created_at": 1769141292931,
    "entrypoint_path": "file:///home/eevan/ProyectosIA/aidrive_genspark/supabase/functions/reportes-automaticos/index.ts",
    "ezbr_sha256": "8e96319f35e2d159e5781d66d26157662fb6d05eb85c746652b2b6f941995a75",
    "id": "400fd5b8-0b8b-4f2a-bdaf-2a68582e5024",
    "name": "reportes-automaticos",
    "slug": "reportes-automaticos",
    "status": "ACTIVE",
    "updated_at": 1769141731545,
    "verify_jwt": true,
    "version": 10
  },
  {
    "created_at": 1769141298629,
    "entrypoint_path": "file:///home/eevan/ProyectosIA/aidrive_genspark/supabase/functions/reposicion-sugerida/index.ts",
    "ezbr_sha256": "9c91774901c56328d7200ff33585944bfe798a1cc8d6b8619a50a2ff8a1c3e65",
    "id": "c1ea7102-9996-42ae-8bd5-fc5fe28f02f9",
    "name": "reposicion-sugerida",
    "slug": "reposicion-sugerida",
    "status": "ACTIVE",
    "updated_at": 1769141731545,
    "verify_jwt": true,
    "version": 10
  },
  {
    "created_at": 1769141299635,
    "entrypoint_path": "file:///home/eevan/ProyectosIA/aidrive_genspark/supabase/functions/alertas-vencimientos/index.ts",
    "ezbr_sha256": "4fb1899e42c7477145645ed5b6f0233c76d2067ee6b8b82b82a9c2d0bc0803dd",
    "id": "23a4fa3b-953c-4666-ac6c-a2476b8e111d",
    "name": "alertas-vencimientos",
    "slug": "alertas-vencimientos",
    "status": "ACTIVE",
    "updated_at": 1769141731545,
    "verify_jwt": true,
    "version": 10
  },
  {
    "created_at": 1769141302172,
    "entrypoint_path": "file:///tmp/user_fn_dqaygmjpzoqjjrywdsxi_b6c8726c-d1d0-4323-8e97-1308903cd8f5_20/source/supabase/functions/api-minimarket/index.ts",
    "ezbr_sha256": "9e8ca425893b6020d0763da5033c1763234b2f045b2b8b000a227212294dee15",
    "id": "b6c8726c-d1d0-4323-8e97-1308903cd8f5",
    "import_map": true,
    "import_map_path": "file:///tmp/user_fn_dqaygmjpzoqjjrywdsxi_b6c8726c-d1d0-4323-8e97-1308903cd8f5_20/source/supabase/functions/import_map.json",
    "name": "api-minimarket",
    "slug": "api-minimarket",
    "status": "ACTIVE",
    "updated_at": 1770532823980,
    "verify_jwt": false,
    "version": 20
  },
  {
    "created_at": 1769141303311,
    "entrypoint_path": "file:///tmp/user_fn_dqaygmjpzoqjjrywdsxi_d72fc25d-607e-4f56-83ec-34253c1e2b3d_11/source/supabase/functions/api-proveedor/index.ts",
    "ezbr_sha256": "630c2ecb398f803c7ed290e2a8e84e13c4e4052f311c95e52c9e2f64b1705dc5",
    "id": "d72fc25d-607e-4f56-83ec-34253c1e2b3d",
    "import_map": true,
    "import_map_path": "file:///tmp/user_fn_dqaygmjpzoqjjrywdsxi_d72fc25d-607e-4f56-83ec-34253c1e2b3d_11/source/supabase/functions/import_map.json",
    "name": "api-proveedor",
    "slug": "api-proveedor",
    "status": "ACTIVE",
    "updated_at": 1770532825747,
    "verify_jwt": true,
    "version": 11
  },
  {
    "created_at": 1769141304283,
    "entrypoint_path": "file:///home/eevan/ProyectosIA/aidrive_genspark/supabase/functions/cron-testing-suite/index.ts",
    "ezbr_sha256": "63d2c894e985c88cc3a7d23ec028bab369b3c79703438b6afd2cf56b05cf39bd",
    "id": "e021912e-df17-4b7b-882e-c3a33d5bbf55",
    "name": "cron-testing-suite",
    "slug": "cron-testing-suite",
    "status": "ACTIVE",
    "updated_at": 1769141731545,
    "verify_jwt": true,
    "version": 10
  },
  {
    "created_at": 1769141305263,
    "entrypoint_path": "file:///tmp/user_fn_dqaygmjpzoqjjrywdsxi_ba974c01-0d73-4ea3-99b3-ed7bb1a214b1_11/source/supabase/functions/scraper-maxiconsumo/index.ts",
    "ezbr_sha256": "d0acf5e83abb4ffae57cf35aa885bbdd9cd5045ec1eb412c136a23b1ff85ad32",
    "id": "ba974c01-0d73-4ea3-99b3-ed7bb1a214b1",
    "import_map": true,
    "import_map_path": "file:///tmp/user_fn_dqaygmjpzoqjjrywdsxi_ba974c01-0d73-4ea3-99b3-ed7bb1a214b1_11/source/supabase/functions/import_map.json",
    "name": "scraper-maxiconsumo",
    "slug": "scraper-maxiconsumo",
    "status": "ACTIVE",
    "updated_at": 1770522698563,
    "verify_jwt": true,
    "version": 11
  },
  {
    "created_at": 1769141306082,
    "entrypoint_path": "file:///home/eevan/ProyectosIA/aidrive_genspark/supabase/functions/alertas-stock/index.ts",
    "ezbr_sha256": "392650f932778ee364a3c760f169dfcad3deb999f02241610c484f6fc4f3d9dc",
    "id": "72f7638a-72da-48c0-ab1e-8b99901b5962",
    "name": "alertas-stock",
    "slug": "alertas-stock",
    "status": "ACTIVE",
    "updated_at": 1769141731545,
    "verify_jwt": true,
    "version": 10
  },
  {
    "created_at": 1769141307104,
    "entrypoint_path": "file:///home/eevan/ProyectosIA/aidrive_genspark/supabase/functions/cron-dashboard/index.ts",
    "ezbr_sha256": "b404ef8cc18ad041eaa442d3178fca025536dcd0fcccffe46e76b2fb42fb170b",
    "id": "901f3f89-e821-4158-8477-4bfb5d868c73",
    "name": "cron-dashboard",
    "slug": "cron-dashboard",
    "status": "ACTIVE",
    "updated_at": 1769141731545,
    "verify_jwt": true,
    "version": 10
  },
  {
    "created_at": 1769141308048,
    "entrypoint_path": "file:///home/eevan/ProyectosIA/aidrive_genspark/supabase/functions/cron-health-monitor/index.ts",
    "ezbr_sha256": "ce169d80f70cc9502af1291c00208354dd20cde99f73dc4ab0422453ea42cfd7",
    "id": "cc205e24-ddc5-4ada-8c36-73b86c94638d",
    "name": "cron-health-monitor",
    "slug": "cron-health-monitor",
    "status": "ACTIVE",
    "updated_at": 1769141731545,
    "verify_jwt": true,
    "version": 10
  },
  {
    "created_at": 1769141308989,
    "entrypoint_path": "file:///tmp/user_fn_dqaygmjpzoqjjrywdsxi_c06af035-2646-4200-8a97-a7d812370593_12/source/supabase/functions/cron-jobs-maxiconsumo/index.ts",
    "ezbr_sha256": "92325889d0a736c20987332e93eeaf45dab14c429da62e3ed2fef9baa3489f98",
    "id": "c06af035-2646-4200-8a97-a7d812370593",
    "import_map": true,
    "import_map_path": "file:///tmp/user_fn_dqaygmjpzoqjjrywdsxi_c06af035-2646-4200-8a97-a7d812370593_12/source/supabase/functions/import_map.json",
    "name": "cron-jobs-maxiconsumo",
    "slug": "cron-jobs-maxiconsumo",
    "status": "ACTIVE",
    "updated_at": 1770209056745,
    "verify_jwt": true,
    "version": 12
  },
  {
    "created_at": 1769141309931,
    "entrypoint_path": "file:///tmp/user_fn_dqaygmjpzoqjjrywdsxi_eae240cc-b707-4887-b295-821e165474c1_11/source/supabase/functions/cron-notifications/index.ts",
    "ezbr_sha256": "cfabc943b39b1105bf8583cb4df4233eb1363ae3bec6289ddc026f81efd901cd",
    "id": "eae240cc-b707-4887-b295-821e165474c1",
    "import_map": true,
    "import_map_path": "file:///tmp/user_fn_dqaygmjpzoqjjrywdsxi_eae240cc-b707-4887-b295-821e165474c1_11/source/supabase/functions/import_map.json",
    "name": "cron-notifications",
    "slug": "cron-notifications",
    "status": "ACTIVE",
    "updated_at": 1770208835773,
    "verify_jwt": true,
    "version": 11
  },
  {
    "created_at": 1769141310817,
    "entrypoint_path": "file:///home/eevan/ProyectosIA/aidrive_genspark/supabase/functions/notificaciones-tareas/index.ts",
    "ezbr_sha256": "b6e64c2819b36d7f244f9c301cd67f3d13b7bdd465389fdc89f0ec078e4469ed",
    "id": "f1a9ad79-0a4b-4821-bb5a-b55fd70e7437",
    "name": "notificaciones-tareas",
    "slug": "notificaciones-tareas",
    "status": "ACTIVE",
    "updated_at": 1769141731545,
    "verify_jwt": true,
    "version": 10
  }
]
A new version of Supabase CLI is available: v2.75.0 (currently installed v2.72.7)
We recommend updating regularly for new features and bug fixes: https://supabase.com/docs/guides/cli/getting-started#updating-the-supabase-cli
```

## REMOTE VERIFY functions list (formatted)

```bash
bash -lc supabase\ functions\ list\ --project-ref\ dqaygmjpzoqjjrywdsxi\ --output\ json\ \|\ jq\ -r\ \'.\[\].name\ +\ \"\\t\"\ +\ \"v\"\ +\ \(\ .version\|tostring\ \)\ +\ \"\\tverify_jwt=\"\ +\ \(\ .verify_jwt\|tostring\ \)\'\ \|\ sort 
```

```
A new version of Supabase CLI is available: v2.75.0 (currently installed v2.72.7)
We recommend updating regularly for new features and bug fixes: https://supabase.com/docs/guides/cli/getting-started#updating-the-supabase-cli
jq: error (at <stdin>:168): Cannot index array with string "verify_jwt"
```

## REMOTE VERIFY functions list (correct jq)

```bash
supabase functions list --project-ref dqaygmjpzoqjjrywdsxi --output json | jq -r '.[] | "\(.name)\tv\(.version)\tverify_jwt=\(.verify_jwt)"' | sort
```

```
A new version of Supabase CLI is available: v2.75.0 (currently installed v2.72.7)
We recommend updating regularly for new features and bug fixes: https://supabase.com/docs/guides/cli/getting-started#updating-the-supabase-cli
alertas-stock	v10	verify_jwt=true
alertas-vencimientos	v10	verify_jwt=true
api-minimarket	v20	verify_jwt=false
api-proveedor	v11	verify_jwt=true
cron-dashboard	v10	verify_jwt=true
cron-health-monitor	v10	verify_jwt=true
cron-jobs-maxiconsumo	v12	verify_jwt=true
cron-notifications	v11	verify_jwt=true
cron-testing-suite	v10	verify_jwt=true
notificaciones-tareas	v10	verify_jwt=true
reportes-automaticos	v10	verify_jwt=true
reposicion-sugerida	v10	verify_jwt=true
scraper-maxiconsumo	v11	verify_jwt=true
```

## SMOKE REMOTO (read-only) node scripts/smoke-minimarket-features.mjs

```bash
node scripts/smoke-minimarket-features.mjs
```

```
--- AUTH ---
AUTH_STATUS: OK

--- SEARCH ---
STATUS: 200
CONTENT_TYPE: application/json
SUCCESS: true
DATA_SUMMARY: {"type":"object","keys":["productos","proveedores","tareas","pedidos","clientes"]}

--- INSIGHTS/ARBITRAJE ---
STATUS: 200
CONTENT_TYPE: application/json
SUCCESS: true
DATA_SUMMARY: {"type":"array","length":0}

--- CLIENTES ---
STATUS: 200
CONTENT_TYPE: application/json
SUCCESS: true
DATA_SUMMARY: {"type":"array","length":0}

--- CUENTAS-CORRIENTES/RESUMEN ---
STATUS: 200
CONTENT_TYPE: application/json
SUCCESS: true
DATA_SUMMARY: {"type":"object","keys":["dinero_en_la_calle","clientes_con_deuda","as_of"]}

--- OFERTAS/SUGERIDAS ---
STATUS: 200
CONTENT_TYPE: application/json
SUCCESS: true
DATA_SUMMARY: {"type":"array","length":0}

--- BITACORA ---
STATUS: 200
CONTENT_TYPE: application/json
SUCCESS: true
DATA_SUMMARY: {"type":"array","length":0}

--- SUMMARY ---
TOTAL: 6
PASSED: 6
FAILED: 0
RESULT: ALL_PASS
```

SMOKE_EXIT_CODE: 0
