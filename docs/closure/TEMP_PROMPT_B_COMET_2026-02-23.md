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
