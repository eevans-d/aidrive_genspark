# OCR Nuevos — Resultados 2026-02-28

**Fecha:** 2026-02-28 04:10 UTC
**Commit base:** `928defb`

## Estado general: BLOCKED (GCV_API_KEY 403)

### Pipeline ejecutado

| Fase | Estado | Detalle |
|------|--------|---------|
| Upload a Storage | OK (21/21) | Todas las imágenes canónicas subidas al bucket `facturas` |
| Insert en `facturas_ingesta` | OK (21/21) | Registros creados con estado `pendiente` |
| Extracción OCR (GCV) | BLOCKED | HTTP 403 — API key sin permisos activos |

### Resultados por imagen

| # | Archivo | factura_id | Upload | BD | OCR | CUIT detectado | items_count |
|---|---------|------------|--------|----|-----|----------------|-------------|
| 1 | 20260227_210622.jpg | `514b85f3` | OK | OK | error (403) | — | 0 |
| 2 | 20260227_210739.jpg | `bd462b25` | OK | OK | pendiente | — | 0 |
| 3 | 20260227_210750.jpg | `3be72ad2` | OK | OK | pendiente | — | 0 |
| 4 | 20260227_210758.jpg | `7fdc4c3e` | OK | OK | pendiente | — | 0 |
| 5 | 20260227_210849.jpg | `e9320108` | OK | OK | pendiente | — | 0 |
| 6 | 20260227_210857.jpg | `2492c62d` | OK | OK | pendiente | — | 0 |
| 7 | 20260227_210904.jpg | `9abe3a95` | OK | OK | pendiente | — | 0 |
| 8 | 20260227_210915.jpg | `b9342770` | OK | OK | pendiente | — | 0 |
| 9 | 20260227_210926.jpg | `df02dbf5` | OK | OK | pendiente | — | 0 |
| 10 | 20260227_210938.jpg | `f839f542` | OK | OK | pendiente | — | 0 |
| 11 | 20260227_211013.jpg | `9e638423` | OK | OK | pendiente | — | 0 |
| 12 | 20260227_211023.jpg | `77315a6b` | OK | OK | pendiente | — | 0 |
| 13 | 20260227_211034.jpg | `f4dadd32` | OK | OK | pendiente | — | 0 |
| 14 | 20260227_211044.jpg | `a74431fe` | OK | OK | pendiente | — | 0 |
| 15 | 20260227_211101.jpg | `2691fac2` | OK | OK | pendiente | — | 0 |
| 16 | 20260227_211103.jpg | `378d39b6` | OK | OK | pendiente | — | 0 |
| 17 | 20260227_211119.jpg | `e2017f47` | OK | OK | pendiente | — | 0 |
| 18 | 20260227_211129.jpg | `fc3dd7cd` | OK | OK | pendiente | — | 0 |
| 19 | 20260227_211143.jpg | `f456bed6` | OK | OK | pendiente | — | 0 |
| 20 | 20260227_211146.jpg | `e5dab087` | OK | OK | pendiente | — | 0 |
| 21 | 20260227_211205 (1).jpg | `c61db262` | OK | OK | pendiente | — | 0 |

### Resumen cuantitativo

| Categoría | Cantidad |
|-----------|----------|
| procesadas_ok | 0 |
| procesadas_con_warning | 0 |
| fallidas (error GCV) | 1 |
| blocked (pendiente GCV fix) | 20 |
| total canónicas | 21 |

### Fix de bug aplicado

**Archivo:** `supabase/functions/facturas-ocr/index.ts`
**Bug:** Stack overflow al convertir imagen a base64 (spread de >2M elementos)
**Fix:** Chunked base64 encoding (8KB chunks)
**Deploy:** reportado en sesión original; validar versión remota en próximo redeploy controlado

### Bloqueante

La extracción OCR requiere que el owner active/valide la `GCV_API_KEY` en Google Cloud Console:
1. Verificar que "Cloud Vision API" esté habilitada
2. Verificar restricciones de la API key
3. Verificar billing activo en el proyecto GCP

Una vez resuelto, ejecutar el re-procesamiento:
```bash
node scripts/ocr-procesar-nuevos.mjs --execute --proveedor=d634fd98-6446-4a0c-a617-960f6fcdfee8
```
> Nota: versión refinada del script (post-auditoría) reutiliza facturas existentes por `numero=BATCH-*` + `proveedor_id` y reintenta OCR sin crear duplicados.
