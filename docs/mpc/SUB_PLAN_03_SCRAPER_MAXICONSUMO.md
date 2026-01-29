# 📋 SUB-PLAN #3: Scraper Maxiconsumo

**Prioridad:** 🟡 P1  
**Estado:** ✅ Implementado  
**Directorio:** `supabase/functions/scraper-maxiconsumo/`  
**Tamaño Total:** ~75 KB (11 archivos)

---

## 📊 Resumen

| Aspecto | Estado | Detalle |
|---------|--------|---------|
| **Endpoints** | ✅ 5 | scraping, comparacion, alertas, status, health |
| **Anti-Detection** | ✅ | User-agent rotation, delays, headers |
| **Rate Limit** | ✅ | Circuit breaker integrado |
| **Categorías** | ✅ 9 | Almacén, Bebidas, Limpieza, etc. |
| **Caché** | ✅ | Evita re-scrapeo frecuente |
| **Matching** | ✅ | Productos locales ↔ externos |

---

## 📁 Arquitectura de Módulos

| Archivo | Tamaño | Propósito |
|---------|--------|-----------|
| `index.ts` | 13 KB | Entry point, router, handlers |
| `anti-detection.ts` | 13 KB | Evasión de bloqueos |
| `storage.ts` | 8 KB | CRUD a DB (precios_proveedor) |
| `types.ts` | 6 KB | Interfaces TypeScript |
| `parsing.ts` | 6 KB | Extracción HTML → datos |
| `scraping.ts` | 6 KB | Fetch de páginas Maxi |
| `config.ts` | 5 KB | Configuración categorías |
| `matching.ts` | 5 KB | Match productos local ↔ externo |
| `cache.ts` | 4 KB | Cache en memoria |
| `alertas.ts` | 2 KB | Generación de alertas precio |
| `utils/` | - | Cookie-jar y utilidades |

---

## 🔌 Endpoints

| # | Path | Método | Auth | Propósito |
|---|------|--------|------|-----------|
| 1 | `/scraping` | POST | API Secret | Ejecutar scraping |
| 2 | `/comparacion` | POST | API Secret | Comparar precios |
| 3 | `/alertas` | POST | API Secret | Generar alertas |
| 4 | `/status` | GET | Ninguno | Métricas scraper |
| 5 | `/health` | GET | Ninguno | Health check |

---

## 🛡️ Anti-Detection Features

| Feature | Implementación |
|---------|----------------|
| **User-Agent Rotation** | Pool de 10+ agentes |
| **Request Delays** | 1.5s - 6s con jitter 25% |
| **Header Randomization** | Accept-Language, Referer |
| **Cookie Jar** | Opcional (ENABLE_COOKIE_JAR) |
| **Proxy Support** | Opcional (ENABLE_PROXY) |
| **CAPTCHA Bypass** | Opcional (ENABLE_CAPTCHA) |

---

## 📦 Categorías Configuradas

| Categoría | Slug | Prioridad | Max Productos |
|-----------|------|-----------|---------------|
| Almacén | `almacen` | 1 | 1000 |
| Bebidas | `bebidas` | 2 | 500 |
| Limpieza | `limpieza` | 3 | 300 |
| Frescos | `frescos` | 4 | 200 |
| Congelados | `congelados` | 5 | 200 |
| Perfumería | `perfumeria` | 6 | 150 |
| Mascotas | `mascotas` | 7 | 100 |
| Hogar | `hogar-y-bazar` | 8 | 150 |
| Electro | `electro` | 9 | 100 |

---

## 🔄 Flujo de Scraping

```
cron-jobs-maxiconsumo/orchestrator
         ↓
scraper-maxiconsumo/scraping
         ↓
[1. Fetch HTML] → [2. Parsing] → [3. Matching]
         ↓
[4. Storage (precios_proveedor)]
         ↓
[5. Comparación con precios locales]
         ↓
[6. Alertas si cambio > umbral]
```

---

## 🔒 Seguridad

| Aspecto | Implementación |
|---------|----------------|
| **Auth** | API Secret (X-API-SECRET header) |
| **Rate Limit** | Token bucket por endpoint |
| **Circuit Breaker** | 5 fails → 90s open |
| **Key Separation** | readKey (anon) vs writeKey (service) |

---

## 🧪 Tests Disponibles

| Test | Archivo | Cobertura |
|------|---------|-----------|
| Anti-Detection | `unit/scraper-anti-detection.test.ts` | ✅ |
| Cache | `unit/scraper-cache.test.ts` | ✅ |
| Config | `unit/scraper-config.test.ts` | ✅ |
| Matching | `unit/scraper-matching.test.ts` | ✅ |
| Parsing | `unit/scraper-parsing.test.ts` | ✅ |
| Storage | `unit/scraper-storage.test.ts` | ✅ |

---

## 🎯 Acciones Pendientes

| # | Acción | Prioridad | Esfuerzo |
|---|--------|-----------|----------|
| 1 | Implementar retry inteligente por categoría | 🟢 Baja | ~3h |
| 2 | Añadir métricas de éxito por categoría | 🟢 Baja | ~2h |
| 3 | Considerar headless browser para páginas JS | 🟡 Media | ~8h |
| 4 | Dashboard de estado scraping en frontend | 🟡 Media | ~4h |

---

## ✅ Veredicto

**Estado:** FUNCIONAL  
**Score Técnico:** 8/10 (Bien modularizado, anti-detection robusto)  
**Score Robustez:** 7/10 (Depende de estructura HTML de Maxi)  
**Riesgo:** MEDIO (cambios en sitio externo pueden romperlo)

**El scraper está operativo.** El riesgo principal es la dependencia del HTML de Maxiconsumo.

---

*Sub-Plan generado por RealityCheck v3.1*
