# OCR Nuevos — Manifiesto del Lote 2026-02-28

**Fecha generación:** 2026-02-28 04:10 UTC
**Ruta origen:** `proveedores_facturas_temp/nuevos/`
**Commit base:** `928defb`

## Resumen

| Métrica | Valor |
|---------|-------|
| Total archivos en directorio | 46 |
| Imágenes válidas (.jpg) | 22 |
| Sidecars (Zone.Identifier) | 23 |
| Auxiliares (JSON) | 1 |
| Canónicas (únicas por hash) | 21 |
| Duplicadas | 1 |

## Inventario Completo

| # | Archivo | Hash MD5 | Tamaño | Duplicado de | Estado Storage | Estado BD | factura_id |
|---|---------|----------|--------|-------------|----------------|-----------|------------|
| 1 | 20260227_210622.jpg | `9537b812` | 2.3MB | — | uploaded | error (GCV 403) | `514b85f3-d4d6-444b-9801-0c5480f69709` |
| 2 | 20260227_210739.jpg | `788ce4fc` | 2.3MB | — | uploaded | pendiente | `bd462b25-b3b4-46af-8c41-f73c2b56eb50` |
| 3 | 20260227_210750.jpg | `521d299f` | 2.2MB | — | uploaded | pendiente | `3be72ad2-238d-41dc-ba3d-cd5bf0cc1937` |
| 4 | 20260227_210758.jpg | `3efb7d13` | 2.1MB | — | uploaded | pendiente | `7fdc4c3e-df11-470f-bc65-226b8b3cf145` |
| 5 | 20260227_210849.jpg | `d315697f` | 1.9MB | — | uploaded | pendiente | `e9320108-296b-465d-81cf-6616b9baca0f` |
| 6 | 20260227_210857.jpg | `c7a40846` | 2.4MB | — | uploaded | pendiente | `2492c62d-d2c8-40ee-9d21-eae394a0e46a` |
| 7 | 20260227_210904.jpg | `0c7fdb9e` | 2.0MB | — | uploaded | pendiente | `9abe3a95-faf2-42f5-bc4c-13d29cd45939` |
| 8 | 20260227_210915.jpg | `fd6f4dbe` | 2.2MB | — | uploaded | pendiente | `b9342770-72f6-4319-8331-71df4dac40e6` |
| 9 | 20260227_210926.jpg | `80a5346a` | 2.4MB | — | uploaded | pendiente | `df02dbf5-c7e1-4dbf-a296-f9eeb49e7215` |
| 10 | 20260227_210938.jpg | `7858a847` | 2.1MB | — | uploaded | pendiente | `f839f542-d82e-4955-8d9d-c583d7f977cb` |
| 11 | 20260227_211013.jpg | `b15675f8` | 2.7MB | — | uploaded | pendiente | `9e638423-cdbc-4b52-8eaf-25a518d19a2a` |
| 12 | 20260227_211023.jpg | `41f3fec9` | 2.5MB | — | uploaded | pendiente | `77315a6b-6ae7-4a66-b656-b28174ec8d2a` |
| 13 | 20260227_211034.jpg | `3c8a6b70` | 2.6MB | — | uploaded | pendiente | `f4dadd32-5d0c-4e72-9e60-c228f25d184b` |
| 14 | 20260227_211044.jpg | `26d81d42` | 2.5MB | — | uploaded | pendiente | `a74431fe-4402-4095-ba05-1d43b1e1ae08` |
| 15 | 20260227_211101.jpg | `f3a8bdb6` | 2.2MB | — | uploaded | pendiente | `2691fac2-49e4-4889-b7c9-b20232fc9e2a` |
| 16 | 20260227_211103.jpg | `4fab1f21` | 2.4MB | — | uploaded | pendiente | `378d39b6-7837-42e4-a2dc-563b6593c539` |
| 17 | 20260227_211119.jpg | `4414502d` | 2.5MB | — | uploaded | pendiente | `e2017f47-ba19-4230-b8ac-831d9513df7c` |
| 18 | 20260227_211129.jpg | `ff99fafa` | 2.3MB | — | uploaded | pendiente | `fc3dd7cd-d7d4-46df-ab83-e5e125604bbc` |
| 19 | 20260227_211143.jpg | `063fb119` | 2.2MB | — | uploaded | pendiente | `f456bed6-30ca-4228-8ff2-8311bfddb14a` |
| 20 | 20260227_211146.jpg | `adfbf2f3` | 2.2MB | — | uploaded | pendiente | `e5dab087-e3a9-406d-b937-5d559a596d5d` |
| 21 | 20260227_211205 (1).jpg | `9cb8cf21` | 2.6MB | — | uploaded | pendiente | `c61db262-b98e-43b0-916e-62981525fb9a` |
| — | 20260227_211205.jpg | `9cb8cf21` | 2.6MB | `20260227_211205 (1).jpg` | skipped | skipped (dup) | — |

## Archivos ignorados

| Archivo | Tipo | Razón |
|---------|------|-------|
| `applet_access_history.json` | Auxiliar | Historial de accesos a applets Genspark, no factura |
| `*:Zone.Identifier` (x23) | Sidecar | Metadata de Windows, sin contenido útil |

## Proveedor asignado temporalmente

Todas las imágenes se subieron bajo el proveedor temporal:
- **Logismar S.R.L. (La Galletera)** — `d634fd98-6446-4a0c-a617-960f6fcdfee8`

> **Nota:** Este proveedor se usó como placeholder para la carga inicial. El OCR detecta CUIT como enriquecimiento, pero no reasigna automáticamente `proveedor_id`. Tras OCR exitoso, se debe reasignar `proveedor_id` al proveedor correcto según CUIT detectado.

## Bloqueante: GCV API Key retorna 403

El OCR falla con HTTP 403 desde Google Cloud Vision API. La variable `GCV_API_KEY` existe como secret en Supabase pero la key no tiene permisos activos (billing/API disabled?).

**Evidencia:**
- Evento en `facturas_ingesta_eventos`: `ocr_error`, status: 403
- Request ID: `490c4a4d-ce71-4a6e-9b12-b92557de8284`

**Acción requerida (owner):** Verificar en Google Cloud Console que:
1. La API "Cloud Vision API" esté habilitada en el proyecto
2. La key tenga restricciones correctas (sin restricción de IP o con la de Supabase)
3. El billing esté activo

## Fix aplicado en esta sesión

Se corrigió un bug crítico en `supabase/functions/facturas-ocr/index.ts`:
- **Bug:** `btoa(String.fromCharCode(...new Uint8Array(imageBytes)))` causa stack overflow con imágenes >1MB
- **Fix:** Se implementó encoding base64 por chunks de 8192 bytes
- **Deploy:** reportado en sesión original; verificar versión remota en próximo redeploy controlado
