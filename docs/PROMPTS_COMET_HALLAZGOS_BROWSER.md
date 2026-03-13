# Prompts para Comet — Bloqueantes externos reales

Documento canonico para ejecutar en ventanas nuevas de Comet los bloqueantes externos que siguen abiertos despues del hardening interno del repo.

## Reglas de uso

- Ejecutar **un solo prompt por ventana**.
- No mezclar plataformas en la misma corrida.
- Usar estos prompts solo para tareas de navegador/dashboard, no para editar el repo local.
- Si Comet encuentra un bloqueo de permisos o credenciales, debe dejar evidencia exacta y el siguiente paso minimo.

## Contexto canonico previo

- Proyecto remoto Supabase operativo: `minimarket-system` (`project_ref dqaygmjpzoqjjrywdsxi`).
- `aidrive_genspark` es el identificador local del repo/CLI y **no** debe usarse como criterio unico para buscar el proyecto remoto en dashboard.
- Proyecto GCP canonico del OCR: `gen-lang-client-0312126042`.
- Cuenta de billing documentada para OCR: `0156DA-EB3EB0-9C9339`.
- Estado externo revalidado por Comet (2026-03-13):
  - Supabase: `SSL enforcement` activo, `Secure password change=ON`, `Minimum password length=8`
  - GCP: billing reactivado y proyecto OCR ya vinculado a la cuenta correcta
  - GitHub: `main` ya refleja el nightly endurecido; la corrida `23038842082` genero `ops-smoke-report` + `migration-drift-report`
- `EXH-B-001` y `EXH-B-002` quedaron cerrados con evidencia remota en `main`.
- `EXH-B-003` ya esta cubierto por `ops-smoke`, pero `cron-health-monitor/health-check` devuelve `401` no critico y mantiene el gate en warning-only.
- `EXH-B-009` esta mitigado en repo y ya es efectivo en `main` (`SUPABASE_CLI_VERSION: 2.75.0`).

## Prompt 1 — Supabase Dashboard

```text
Actua como un operador tecnico senior enfocado exclusivamente en Supabase Dashboard para el proyecto remoto canonico `minimarket-system` (`dqaygmjpzoqjjrywdsxi`).

Tu mision es resolver o dejar completamente preparados, con evidencia verificable, los bloqueantes externos ligados a Supabase:
- `AUTH-001`: CAPTCHA no configurado en Supabase.
- `AUTH-002`: validar si session timeout server-side existe o no en el plan actual, y configurar todo lo que si sea posible.
- `DB-001`: network restrictions / allowlist / controles de acceso a PostgreSQL.

Estado ya confirmado antes de empezar:
- `SSL enforcement` ya fue activado en `Database > Settings`.
- `Secure password change=ON` y `Minimum password length=8` ya fueron guardados.
- No repitas esas acciones salvo para verificar persistencia si sospechas drift.

Correccion de contexto obligatoria:
- No trates la ausencia del nombre `aidrive_genspark` en el dashboard como bloqueo.
- `aidrive_genspark` es el identificador local del repo; el proyecto remoto correcto en dashboard es `minimarket-system`.
- Todo hallazgo debe referenciar el proyecto remoto real inspeccionado.

Modo de trabajo obligatorio:
- No pidas microconfirmaciones.
- No supongas nada sobre el plan, features o pantallas; verificalo.
- No cierres un item como externo sin revisar toda la configuracion relevante del dashboard.
- Si una seccion cambio de lugar en la UI, busquela y continua.
- Si faltan credenciales o permisos, identifica exactamente cuales faltan y en que pantalla se cargan.

Tareas por bloque:

`AUTH-001`
- Entra al proyecto correcto de Supabase.
- Revisa `Authentication`, `Providers`, `Security`, `Bot protection`, `CAPTCHA` o secciones equivalentes.
- Determina si el proyecto soporta `hCaptcha`, `Turnstile` u otro proveedor.
- Verifica si ya existe configuracion parcial.
- Si la configuracion puede completarse con datos ya disponibles en dashboard, completala.
- Si faltan credenciales, no inventes nada ni expongas secretos: reporta solo nombres de campos/variables requeridas.
- Deja identificado:
  - proveedor soportado
  - estado actual
  - campos faltantes exactos
  - pantalla exacta donde deben cargarse
  - si quedo cerrado, parcialmente cerrado o sigue externo

`AUTH-002`
- Verifica si existe configuracion server-side real para session lifetime, inactivity timeout, refresh expiry o equivalente.
- Confirma si el plan actual soporta o no esos controles.
- Si existe soporte en el plan actual, configuralo correctamente.
- Si no existe, captura evidencia suficiente del limite real del plan/producto.
- Busca mitigaciones adicionales configurables desde dashboard sin cambiar de plan.
- Diferencia claramente entre:
  - `feature no existe`
  - `feature existe pero no en este plan`
  - `feature existe pero requiere otra pantalla/configuracion`
- No cierres este claim sin evidencia de UI real.

`DB-001`
- Revisa las secciones de `Database`, `Security`, `Network`, `Connections`, `Access control` o equivalentes.
- Determina si existen network restrictions, IP allowlist, CIDR rules o controles comparables.
- Si pueden configurarse sin riesgo y tienes los datos necesarios, dejalos configurados.
- Si falta inventario de IPs permitidas, no improvises una allowlist.
- Verifica tambien si `SSL enforcement` para conexiones entrantes esta disponible; si puede activarse sin riesgo operativo evidente, activalo y confirma persistencia visual.
- Deja claramente identificado:
  - donde se configura
  - que dato exacto falta
  - formato esperado
  - si existe fallback temporal seguro
  - cual seria el paso minimo exacto para cerrarlo

Reglas duras:
- Nunca expongas secretos, tokens o client secrets; solo nombres.
- No hagas cambios de acceso que puedan cortar operacion legitima sin evidencia suficiente.
- No declares `cerrado` algo que solo inspeccionaste parcialmente.
- No conviertas falta de permisos en una conclusion tecnica falsa.
- Si puedes resolver algo desde dashboard, resuelvelo.

Formato final obligatorio:
- `Resumen ejecutivo`
- `AUTH-001`
- `AUTH-002`
- `DB-001`
- `Mitigaciones adicionales detectadas`
Para cada item incluye:
- `Estado final`
- `Accion ejecutada`
- `Evidencia observada`
- `Dato/secret faltante por nombre`
- `Permiso/plan faltante`
- `Pendiente minimo exacto`
- `Clasificacion final: cerrado / parcialmente cerrado / externo confirmado`

Criterio de parada:
Solo puedes finalizar cuando hayas revisado y documentado completamente los tres items y cada uno tenga estado final inequivoco.
```

## Prompt 2 — Google Cloud Console / OCR

```text
Actua como un operador tecnico senior enfocado exclusivamente en Google Cloud Console para destrabar el bloqueo externo `OCR-007`.

Correccion de contexto obligatoria:
- No debes tratar `aidrive_genspark` como el proyecto GCP operativo del OCR.
- El proyecto GCP canonico actualmente usado por OCR es `gen-lang-client-0312126042`.
- La cuenta de billing documentada como afectada es `0156DA-EB3EB0-9C9339`.
- Cloud Vision API ya estaba reportada como habilitada.
- La API key `GCV_API_KEY` ya estaba reportada como existente y correctamente restringida.
- El secret `GCV_API_KEY` en Supabase fue actualizado externamente segun la documentacion del repo.
- Billing ya fue reactivado y el proyecto ya fue vinculado exitosamente el 2026-03-13.
- No pierdas tiempo creando un proyecto nuevo ni rehaciendo tareas ya marcadas como resueltas, salvo para verificar persistencia si una revalidacion runtime posterior sigue fallando.

Tu mision es una sola:
confirmar que la capa GCP sigue correctamente desbloqueada para `OCR-007`, o delimitar con evidencia irrefutable cualquier nuevo bloqueo si reaparecio drift.

Modo de trabajo obligatorio:
- No pidas microconfirmaciones.
- No trates como incertidumbre algo que puedas verificar navegando la consola.
- No crees proyectos nuevos salvo que la consola muestre inequivocamente que el proyecto canonico ya no existe y eso contradiga la documentacion actual.
- No cierres el caso como `externo` sin revisar project selection, billing, APIs y credentials.
- Si puedes avanzar desde la consola web, avanza.
- Si no puedes cerrar por permisos o metodo de pago, deja identificado exactamente que falta y en que pantalla.

Tareas obligatorias, en este orden:

1. Verificar el proyecto correcto
- Entra a `https://console.cloud.google.com`
- Busca y selecciona el proyecto `gen-lang-client-0312126042`
- Si existe tambien un proyecto `aidrive-genspark`, tratalo como secundario/no canonico salvo que encuentres evidencia clara de que OCR ya migro alli
- Si no encuentras `gen-lang-client-0312126042`, documenta exactamente eso y verifica si es un problema de permisos, organizacion o cuenta

2. Verificar Cloud Vision API
- Ve a `APIs & Services`
- Revisa si `Cloud Vision API` aparece habilitada en el proyecto canonico
- Si ya esta habilitada, no la toques salvo para confirmar estado
- Si no esta habilitada pero billing ya esta activo, habilitala
- Si no puede habilitarse por billing, captura el motivo exacto

3. Verificar billing real
- Ve a `Billing`
- Determina si el proyecto `gen-lang-client-0312126042`:
  - esta vinculado a una cuenta activa
  - esta vinculado a una cuenta cerrada / suspended / expired
  - no esta vinculado a ninguna cuenta
- Busca especificamente la cuenta `0156DA-EB3EB0-9C9339`
- Determina su estado exacto:
  - activa
  - cerrada
  - vencida
  - suspendida
  - inaccesible por permisos
- Si puedes reactivar billing o vincular una cuenta activa, hazlo
- Si se requiere agregar metodo de pago y tienes acceso, hazlo
- Si no puedes completarlo, identifica con precision:
  - que permiso falta
  - que pantalla exacta bloquea
  - si falta metodo de pago
  - si la cuenta esta cerrada y no reactivable
  - si hace falta vincular otra billing account activa

4. Verificar credentials relevantes
- Ve a `APIs & Services > Credentials`
- Verifica que exista una API key operativa para Vision
- No reveles el valor de la key
- Confirma si las restricciones siguen bien configuradas:
  - `API restrictions`: idealmente solo `Cloud Vision API`
  - `Application restrictions`: documenta si existen o si estan abiertas
- Solo ajusta restricciones si encuentras una configuracion claramente insegura o incompatible y si billing ya quedo activo
- No rompas una key operativa por sobre-endurecimiento sin evidencia

5. Verificar si el bloqueo cambia de estado
- Si billing queda activo y Vision sigue habilitada, clasifica `OCR-007` como:
  - `desbloqueado en GCP, pendiente de revalidacion runtime`
- Solo se considera `cerrado total` si ademas existe evidencia posterior de que OCR responde sin timeout, pero esa validacion no depende exclusivamente de esta sesion en GCP Console

6. Si no puedes cerrar el bloqueo
- Deja el caso completamente acotado con:
  - proyecto exacto
  - billing account exacta
  - estado exacto observado
  - pantalla exacta
  - permiso o dato faltante
  - siguiente paso minimo exacto para el owner

Reglas duras:
- Nunca expongas numeros completos de tarjeta, datos de pago, API keys ni credenciales.
- Nunca declares resuelto `OCR-007` solo porque viste la pantalla correcta.
- No confundas `Cloud Vision habilitada` con `OCR desbloqueado`.
- No recrees la key ni cambies el proyecto canonico sin evidencia fuerte.
- No cierres como externo si aun existe una accion de billing o linking que si puede hacerse desde consola.

Formato final obligatorio:
- `Resumen ejecutivo`
- `Proyecto canonico verificado`
- `Cloud Vision API`
- `Billing`
- `Credentials`
- `Accion ejecutada`
- `Bloqueo exacto restante`
- `Permiso o dato faltante`
- `Siguiente paso minimo exacto`
- `Clasificacion final: cerrado / desbloqueado en GCP, pendiente runtime / parcialmente cerrado / externo confirmado`

Criterio de parada:
Solo puedes finalizar cuando hayas verificado el proyecto canonico real `gen-lang-client-0312126042`, el estado real de billing, el estado real de Cloud Vision API y el estado de las credentials; y cuando el bloqueo quede o bien destrabado en GCP o bien delimitado con evidencia precisa y paso minimo exacto.
```

## Prompt 3 — GitHub Actions / Secrets / Runtime Evidence

```text
Actua como un operador tecnico senior enfocado exclusivamente en GitHub web UI, Actions, Secrets, Variables, Environments y artifacts del proyecto `aidrive_genspark`.

Correccion de contexto obligatoria:
- No debes rehacer trabajo de repo ya cerrado.
- `EXH-B-001` y `EXH-B-002` ya tienen evidencia remota real en `main`.
- `EXH-B-003` ya esta cubierto en `ops-smoke`; el punto a investigar, si se reutiliza este prompt, es el `401` no critico de `cron-health-monitor/health-check`.
- `EXH-B-009` ya esta mitigado en repo y efectivo en `main`.
- Tu foco no es editar workflows salvo contradiccion real entre repo y UI; tu foco es verificar configuracion remota, secrets, runs, summaries, logs y artifacts.

Tu mision es una sola:
revalidar o investigar regresiones remotas en GitHub Actions, especialmente si reaparece drift o si hace falta profundizar el `401` no critico de `cron-health-monitor/health-check`.

Contexto confirmado del repo:
- El workflow clave es `Nightly Quality Gates` en `.github/workflows/nightly-gates.yml`
- Ese workflow ya tiene job `Ops Smoke (Remote, warning-only)`
- Ese job usa estos nombres:
  - `SUPABASE_URL` como secret principal
  - `VITE_SUPABASE_URL` como variable fallback
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `API_PROVEEDOR_SECRET`
  - `SUPABASE_DB_URL`
- El artifact esperado es `ops-smoke-report`
- El summary esperado debe dejar claro si fue `PASS`, `FAIL (warning-only)` o `SKIPPED (missing configuration)`

Modo de trabajo obligatorio:
- No pidas microconfirmaciones mientras puedas avanzar.
- No edites codigo ni workflows salvo contradiccion real e insalvable detectada desde la UI.
- No inventes secrets.
- No expongas valores de secrets ni variables sensibles; solo nombres y presencia/ausencia.
- No declares `externo` algo que sea simplemente un secret faltante identificado por nombre.
- No declares `cerrado` un EXH sin artifact, logs o summary que lo respalden.
- Si puedes disparar una corrida segura via `workflow_dispatch`, hazlo.
- Si no puedes hacerlo por permisos o configuracion, delimitalo con precision.

Tareas obligatorias, en este orden:

1. Verificar el repositorio correcto
- Abre el repo GitHub correspondiente a este workspace
- Verifica que contiene:
  - `.github/workflows/nightly-gates.yml`
  - `.github/workflows/ci.yml`
  - `docs/OPERATIONS_RUNBOOK.md`
- Si hay mas de un repo similar, usa el que tenga exactamente esos archivos

2. Verificar workflows relevantes
- En `Actions`, localiza:
  - `Nightly Quality Gates`
  - `CI Pipeline`
  - cualquier workflow relevante de seguridad/monitoring si aparece
- Confirma que `Nightly Quality Gates` tiene `workflow_dispatch`
- Revisa las corridas recientes disponibles de `Nightly Quality Gates`

3. Verificar secrets y variables requeridos
- Ve a `Settings > Secrets and variables > Actions`
- Revisa tanto `Secrets` como `Variables`
- Debes verificar, al menos, la presencia/ausencia y alcance de:
  - `SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `API_PROVEEDOR_SECRET`
  - `VITE_SUPABASE_URL`
  - `SUPABASE_DB_URL`
- Como contexto adicional, verifica tambien si estan presentes:
  - `SUPABASE_ANON_KEY`
  - `VITE_SUPABASE_ANON_KEY`
- Si existen `Environments`, verifica si alguno de esos nombres vive alli en vez de repo-level
- No reveles valores; reporta solo:
  - `Present / Missing / Unknown`
  - `Repo secret / Repo variable / Environment secret / Environment variable`

4. Verificar si ya existe evidencia remota util
- Entra a las ultimas corridas de `Nightly Quality Gates`
- Busca especificamente el job `Ops Smoke (Remote, warning-only)`
- Revisa:
  - step summary
  - logs del job
  - artifact `ops-smoke-report`
- Determina si hubo:
  - `SKIPPED (missing configuration)`
  - `FAIL (warning-only)`
  - `PASS`
- Si hay artifact, inspeccionalo
- Distingue si la falta de evidencia se debe a:
  - secrets faltantes
  - variables faltantes
  - permisos
  - fallo runtime real
  - ausencia total de corrida

5. Si existe configuracion suficiente, dispara evidencia remota
- Si `Nightly Quality Gates` tiene `workflow_dispatch` y estan presentes los nombres necesarios para `ops-smoke`, lanza una corrida manual segura
- Esta accion es segura porque el smoke esta en modo `warning-only`
- Espera lo suficiente para ver al menos:
  - si el job `ops-smoke` inicia
  - si corre o se salta
  - que summary deja
  - si genera artifact
- Si la corrida tarda demasiado, captura el estado alcanzado y el primer punto de bloqueo

6. Clasificar EXH-B-001, EXH-B-002 y EXH-B-003 con criterio estricto
- `EXH-B-001` solo puede considerarse realmente cerrado si existe evidencia remota de que `api-proveedor/health` paso con su contrato tecnico (`Authorization` + `x-api-secret`)
- `EXH-B-002` solo puede considerarse realmente cerrado si existe una corrida remota de `nightly-gates` con el smoke operativo ejecutado y artifact `ops-smoke-report`
- `EXH-B-003` solo puede considerarse realmente cerrado si la evidencia remota demuestra que `cron-health-monitor/health-check` quedo cubierto, lo que depende de la presencia funcional de `SUPABASE_SERVICE_ROLE_KEY`
- La revision de `migration-drift` debe basarse en `SUPABASE_DB_URL`, no en `SUPABASE_ACCESS_TOKEN`.
- Si solo hay mitigacion en repo pero no evidencia remota, clasifica como:
  - `mitigado en repo, pendiente de primera evidencia remota`

7. Tratar `EXH-B-009` correctamente
- No pierdas tiempo intentando cerrar el drift local desde GitHub
- Solo confirma si desde GitHub queda alguna accion adicional pendiente respecto a este punto
- La respuesta esperable es normalmente:
  - `mitigado en repo; sin accion adicional en GitHub`

Matriz obligatoria de configuracion:
Debes construir una matriz exacta con:
- `Nombre`
- `Tipo`
- `Scope`
- `Presencia`
- `Lo requiere que workflow/job`
- `Impacto si falta`

Reglas duras:
- Nunca reveles valores de secrets o tokens.
- No declares listo un workflow si no revisaste summary/logs/artifact.
- No dispares workflows destructivos.
- No confundas `workflow existe` con `evidencia runtime disponible`.
- No cierres `EXH-B-001/002/003` solo porque el YAML luce correcto.
- Si algo depende de permisos GitHub, identificalo exactamente.

Formato final obligatorio:
- `Resumen ejecutivo`
- `Repositorio verificado`
- `Workflows revisados`
- `Matriz de configuracion requerida`
- `Evidencia runtime encontrada`
- `EXH-B-001`
- `EXH-B-002`
- `EXH-B-003`
- `EXH-B-009`
Para cada EXH incluye:
- `Estado final`
- `Accion ejecutada`
- `Evidencia observada`
- `Secret/variable/permiso faltante por nombre`
- `Pendiente minimo exacto`
- `Clasificacion final: cerrado / mitigado en repo, pendiente evidencia remota / parcialmente cerrado / externo confirmado`

Criterio de parada:
Solo puedes finalizar cuando hayas verificado el repo correcto, los workflows, los secrets/variables, las corridas de `Nightly Quality Gates`, los summaries/logs/artifacts relevantes, y cada EXH quede cerrado o acotado con evidencia concreta y siguiente paso minimo exacto.
```
