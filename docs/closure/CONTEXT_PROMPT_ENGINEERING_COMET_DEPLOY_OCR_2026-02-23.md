# CONTEXT PROMPT ENGINEERING — COMET (DEPLOY OCR) — VERSION DIVIDIDA EN 2 PROMPTS

## Por que dividir en 2 prompts

Si, es mas adecuado y eficiente para Comet:
1. **Prompt A (pre-deploy/plataforma):** valida infraestructura, secrets, RLS y deja pendientes CLI del owner.
2. **Prompt B (post-deploy/smoke):** se ejecuta solo despues de los deploys CLI y verifica estado final + flujo funcional.

Esto evita mezclar tareas que Comet no puede ejecutar (deploy de codigo local via CLI) con validaciones de dashboard.

## Orden de uso recomendado

1. Ejecutar **PROMPT A** en Comet.
2. Owner ejecuta los comandos CLI pendientes.
3. Ejecutar **PROMPT B** en Comet.

---

## PROMPT A — PRE-DEPLOY / PLATAFORMA (copiar y pegar en Comet)

Actua como **operador de plataforma Supabase** para verificar estado, configurar secrets y validar infraestructura desde el dashboard de Supabase.

### Contexto fijo

- Repo: `eevans-d/aidrive_genspark`
- Supabase ref: `dqaygmjpzoqjjrywdsxi`
- Dashboard: `https://supabase.com/dashboard/project/dqaygmjpzoqjjrywdsxi`
- Fecha de referencia: 2026-02-23
- Baseline remoto: `docs/closure/BASELINE_LOG_2026-02-23_030112.md`

### Restricciones criticas

1. No exponer secretos ni valores sensibles.
2. No modificar logica de frontend/backend.
3. `api-minimarket` debe mantenerse con `verify_jwt=false` si se redeploya (usar `--no-verify-jwt`).
4. No modificar tablas; solo verificar.
5. Si falta evidencia en dashboard/SQL Editor, marcar `NO_VERIFICADO` (no asumir PASS).

### Tareas (solo plataforma; sin deploy de codigo local)

#### A1) Verificar baseline de Edge Functions

- Ir a **Edge Functions** y confirmar presencia/estado de:
  - `api-minimarket` (esperado baseline: v32, ACTIVE)
  - `facturas-ocr` (esperado: no visible aun, pendiente deploy)

#### A2) Configurar secret OCR

- Ir a **Project Settings > Edge Functions > Secrets** (o **Settings > Secrets**).
- Verificar/crear `GCV_API_KEY`.
- Si el owner no provee valor, detener y reportar `PENDIENTE_OWNER`.

#### A3) Verificar tablas + constraint + trigger

- En **Table Editor** (o **Database > Tables**), validar:
  - `facturas_ingesta`
  - `facturas_ingesta_items`
  - `facturas_ingesta_eventos`
  - `producto_aliases`
  - `precios_compra`

- Validar constraint UNIQUE de `facturas_ingesta` y trigger de `precios_compra`.
- Si no es visible en UI, usar **SQL Editor**:

```sql
-- constraint unique
select conname
from pg_constraint
where conrelid = 'public.facturas_ingesta'::regclass
  and conname = 'facturas_ingesta_unique_factura';

-- trigger de precio costo
select tgname
from pg_trigger
where tgrelid = 'public.precios_compra'::regclass
  and tgname = 'trg_update_precio_costo'
  and not tgisinternal;
```

#### A4) Verificar bucket `facturas` (Storage)

- En **Storage**, validar bucket:
  - privado (`public=false`)
  - limite `10485760` (10 MB)
  - mime types: `image/jpeg`, `image/png`, `image/webp`, `application/pdf`

- Validar policies:
  - `facturas_upload_staff` (INSERT)
  - `facturas_download_staff` (SELECT)
  - `facturas_update_staff` (UPDATE)
  - `facturas_delete_admin` (DELETE)

#### A5) Verificar RLS de tablas nuevas

- En **Database > Policies** validar:
  - `facturas_ingesta`: `fi_select_staff`, `fi_insert_staff`, `fi_update_staff`, `fi_delete_admin`
  - `facturas_ingesta_items`: `fi_items_select_staff`, `fi_items_insert_staff`, `fi_items_update_staff`, `fi_items_delete_admin`
  - `facturas_ingesta_eventos`: `fi_eventos_select_staff`, `fi_eventos_insert_staff`
  - `producto_aliases`: `pa_select_all`, `pa_insert_staff`, `pa_update_staff`, `pa_delete_admin`
  - `precios_compra`: `pc_select_staff`, `pc_insert_staff`, `pc_update_admin`, `pc_delete_admin`

### Salida requerida (Prompt A)

Responder en espanol con secciones:
- `Resumen`
- `Validaciones` (tabla PASS/FAIL/NO_VERIFICADO)
- `Cambios aplicados`
- `Pendientes owner`
- `Siguiente paso`

Incluir fecha/hora exacta de verificacion (UTC o zona indicada).

En `Pendientes owner`, dejar estos comandos exactos:

```bash
# Deploy facturas-ocr (nueva funcion)
npx supabase functions deploy facturas-ocr --linked

# Redeploy api-minimarket (con cambios OCR + precio_compra)
npx supabase functions deploy api-minimarket --no-verify-jwt --linked
```

Si el proyecto no esta linked, usar:

```bash
npx supabase functions deploy facturas-ocr --project-ref dqaygmjpzoqjjrywdsxi
npx supabase functions deploy api-minimarket --no-verify-jwt --project-ref dqaygmjpzoqjjrywdsxi
```

---

## PROMPT B — POST-DEPLOY / VERIFICACION FINAL + SMOKE (copiar y pegar en Comet)

Actua como **operador de verificacion post-deploy** en Supabase dashboard y frontend de produccion.

### Precondicion obligatoria

El owner ya ejecuto CLI:

```bash
npx supabase functions deploy facturas-ocr --linked
npx supabase functions deploy api-minimarket --no-verify-jwt --linked
```

Si esta precondicion no se cumple, detener y marcar `PENDIENTE_OWNER`.

### Contexto fijo

- Supabase ref: `dqaygmjpzoqjjrywdsxi`
- Dashboard: `https://supabase.com/dashboard/project/dqaygmjpzoqjjrywdsxi`
- Frontend prod: `https://aidrive-genspark.pages.dev`
- Objetivo: confirmar OCR de facturas operativo de punta a punta a nivel plataforma + UI.

### Tareas post-deploy

#### B1) Verificar `facturas-ocr` desplegada

- En **Edge Functions**, validar que `facturas-ocr` exista y este `ACTIVE`.
- Registrar version visible.

#### B2) Verificar `api-minimarket` actualizado

- En **Edge Functions**, validar que `api-minimarket` este en version `>= 33` y `ACTIVE`.
- Si la UI no muestra `verify_jwt`, marcar `NO_VERIFICADO` y solicitar evidencia al owner.
- No aprobar si hay indicio de redeploy sin `--no-verify-jwt`.

#### B3) Smoke test UI en produccion

- Ir a `https://aidrive-genspark.pages.dev`
- Iniciar sesion con rol `admin` o `deposito` (si no hay credenciales: `PENDIENTE_OWNER`).
- Navegar a **Facturas**.
- Verificar:
  1. Carga sin errores.
  2. Boton `Nueva Factura` visible.
  3. Selector de proveedor visible.
  4. Zona de upload visible (drag-drop).
  5. (Opcional) subir imagen de prueba y registrar resultado.

#### B4) Validacion de criterio de exito final

Confirmar estado final sobre:
1. `GCV_API_KEY` presente.
2. `facturas-ocr` ACTIVE.
3. `api-minimarket` version `>= 33` ACTIVE.
4. Tablas/RLS/bucket de facturas correctos (tomar resultado de Prompt A, revalidar si hay drift).
5. Pagina Facturas operativa en prod.

### Salida requerida (Prompt B)

Responder en espanol con:
- `Resumen`
- `Validaciones` (tabla PASS/FAIL/NO_VERIFICADO/PENDIENTE_OWNER)
- `Cambios aplicados`
- `Pendientes owner`
- `Siguiente paso`

Incluir:
- Estado general: `GREEN`, `YELLOW` o `RED`
- Hallazgos criticos
- Fecha/hora exacta de verificacion
- Sin exponer secretos.

---

## PROMPT B REFORZADO — UNA SOLA PIEZA (recomendado para ejecucion directa en Comet)

Actua como **operador de verificacion post-deploy** para Supabase + frontend de produccion. Ejecuta este checklist completo sin cortar, navegando por todos los modulos requeridos.

### Contexto

- Supabase ref: `dqaygmjpzoqjjrywdsxi`
- Dashboard: `https://supabase.com/dashboard/project/dqaygmjpzoqjjrywdsxi`
- Frontend prod: `https://aidrive-genspark.pages.dev`
- Fecha de referencia: 2026-02-23

### Precondicion obligatoria

Antes de validar, asumir que owner ya ejecuto:

```bash
npx supabase functions deploy facturas-ocr --linked
npx supabase functions deploy api-minimarket --no-verify-jwt --linked
```

Si no hay evidencia de esos deploys, marcar `PENDIENTE_OWNER` y detener cierre final.

### Reglas de calidad (obligatorias)

1. No exponer secretos ni valores sensibles.
2. No modificar logica funcional, tablas ni configuraciones fuera de verificacion.
3. Usar identificadores **canonicos exactos** (sin traducir nombres):
   - Secret: `GCV_API_KEY`
   - Function: `api-minimarket`, `facturas-ocr`
   - Policies: `fi_*`, `pa_*`, `pc_*`, `facturas_*`
4. Si la UI traduce etiquetas o nombres, validar por SQL Editor y reportar el identificador real.
5. Si no hay evidencia visible, usar `NO_VERIFICADO` (no asumir PASS).
6. Si una ruta falla (ej. 404), probar ruta alternativa y registrarlo como `BLOQUEADO_POR_UI` si no se resuelve.

### Ejecucion obligatoria por modulos

#### B1) Edge Functions post-deploy

- Ir a **Edge Functions**.
- Verificar:
  - `facturas-ocr` existe y `ACTIVE`.
  - `api-minimarket` version `>= 33` y `ACTIVE`.
  - `api-minimarket` sigue con `verify_jwt=false` (si UI no lo muestra, marcar `NO_VERIFICADO` y pedir evidencia owner).

#### B2) Secret OCR

- Ir a **Settings/Edge Functions > Secrets**.
- Verificar presencia de `GCV_API_KEY` (solo nombre, nunca valor).

#### B3) Integridad DB (tablas + constraint + trigger)

- Ir a **SQL Editor** y validar:

```sql
-- tablas OCR
select table_name
from information_schema.tables
where table_schema='public'
  and table_name in (
    'facturas_ingesta',
    'facturas_ingesta_items',
    'facturas_ingesta_eventos',
    'producto_aliases',
    'precios_compra'
  )
order by table_name;

-- constraint unico factura
select conname
from pg_constraint
where conrelid='public.facturas_ingesta'::regclass
  and conname='facturas_ingesta_unique_factura';

-- trigger update costo
select tgname
from pg_trigger
where tgrelid='public.precios_compra'::regclass
  and tgname='trg_update_precio_costo'
  and not tgisinternal;
```

#### B4) Storage bucket + policies

- Ir a **Storage**.
- Verificar bucket `facturas`:
  - privado (`public=false`)
  - limite `10485760` (10 MB)
  - mime: `image/jpeg`, `image/png`, `image/webp`, `application/pdf`
- Verificar policies:
  - `facturas_upload_staff`
  - `facturas_download_staff`
  - `facturas_update_staff`
  - `facturas_delete_admin`

#### B5) RLS policies canonicas (DB)

- Ir a **Database/Auth > Policies** y validar estas policies exactas:
  - `fi_select_staff`, `fi_insert_staff`, `fi_update_staff`, `fi_delete_admin`
  - `fi_items_select_staff`, `fi_items_insert_staff`, `fi_items_update_staff`, `fi_items_delete_admin`
  - `fi_eventos_select_staff`, `fi_eventos_insert_staff`
  - `pa_select_all`, `pa_insert_staff`, `pa_update_staff`, `pa_delete_admin`
  - `pc_select_staff`, `pc_insert_staff`, `pc_update_admin`, `pc_delete_admin`
- Si hay traduccion visual, confirmar nombre canonico por SQL y dejar evidencia.

#### B6) Smoke test funcional UI (produccion)

- Abrir `https://aidrive-genspark.pages.dev`
- Login con rol `admin` o `deposito` (si falta credencial: `PENDIENTE_OWNER`)
- Navegar a **Facturas**
- Verificar:
  1. Carga pagina sin error
  2. Boton `Nueva Factura` visible
  3. Selector proveedor visible
  4. Zona drag-drop visible
  5. Opcional: prueba upload + extraccion y registrar resultado

### Formato de salida obligatorio

Responder en espanol con estas secciones exactas:

1. `Resumen`
2. `Validaciones`
3. `Cambios aplicados`
4. `Pendientes owner`
5. `Siguiente paso`

En `Validaciones`, usar tabla con columnas:
- `ID`
- `Ruta visitada`
- `Evidencia`
- `Estado` (`PASS` | `FAIL` | `NO_VERIFICADO` | `PENDIENTE_OWNER` | `BLOQUEADO_POR_UI`)

Ademas incluir:
- `Estado general`: `GREEN` / `YELLOW` / `RED`
- `Hallazgos criticos` (si existen)
- `Fecha/hora exacta` de verificacion (UTC o zona indicada)

### Criterio de cierre

`GREEN` solo si:
1. `GCV_API_KEY` presente,
2. `facturas-ocr` ACTIVE,
3. `api-minimarket` >= v33 ACTIVE y sin indicios de perder `verify_jwt=false`,
4. tablas + constraint + trigger OK,
5. bucket + policies OK,
6. RLS canonico OK,
7. smoke test Facturas OK.
