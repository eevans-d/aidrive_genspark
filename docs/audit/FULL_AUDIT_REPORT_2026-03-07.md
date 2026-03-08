# Reporte de Auditoría Integral (Full Audit) - 2026-03-07

Se ejecutó un escaneo intensivo multihilo abarcando Seguridad, Dependencias y Configuración de Entornos (Env Audit), siguiendo los lineamientos del protocolo Zero (`.agent/scripts/env_audit.py`) y escáneres nativos de paquetes (`npm audit`, `pnpm audit`).

## 🚨 1. Hallazgos Críticos de Seguridad (Vulnerabilidades)

Se han detectado vulnerabilidades de **Severidad ALTA** que requieren actualización inmediata para evitar brechas, especialmente en dependencias de backend/edge (Hono) y en el empaquetado del Frontend.

**Raíz (NPM) - 3 Vulnerabilidades Altas:**
*   `hono (<=4.12.3)`: Múltiples vectores críticos combinados (Inyección de Atributos Cookie, Inyección SSE Control Field [CR/LF], y acceso arbitrario a archivos vía `serveStatic`).
*   `@hono/node-server (<1.19.10)`: Evasión de autorización (Bypass) para rutas estáticas protegidas mediante slashes codificados.
*   `express-rate-limit (8.2.0 - 8.2.1)`: Bypass de límite de peticiones (Rate Limiting) para direcciones IPv4 sobre redes dual-stack IPv6.

**Frontend `minimarket-system` (PNPM) - 7 Vulnerabilidades (6 Altas, 1 Moderada):**
*   `minimatch (<9.0.7)`: Expresiones regulares con retroceso catastrófico (ReDoS) en extglobs anidados.
*   Y otras asociadas indirectamente a herramientas de compilación/transpilación (como `@babel/traverse`, dependencias profundas de vite o eslint).

## ⚠️ 2. Desviación de Configuración (Drift en Entornos)

El escaneo transversal de variables de entorno (`env_audit.py`) reveló una divergencia significativa entre lo que el código espera, lo documentado en `.env.example` y los secretos configurados en Supabase:

*   **Usado en el código, pero NO documentado en `.env.example`:**
    *   `VITE_API_ASSISTANT_URL` (Debe documentarse para que el Frontend local sepa conectarse al asistente).
*   **Presente en `.env.example`, pero código "Fantasma" (NO usado):**
    *   `ACCESS_TOKEN`, `DB_PASSWORD`, `PROJECT_ID`. (Crean ruido y falsa superficie de ataque; deben eliminarse del example).
*   **Usadas en el código, pero FALTANTES en Secretos de Supabase Edge Functions:**
    *   Variables de configuración de APIs (Twilio, Slack, etc.) y Políticas: `API_PROVEEDOR_READ_MODE`, `EMAIL_FROM`, `ENVIRONMENT`, `INTERNAL_ORIGINS_ALLOWLIST`, `LOG_LEVEL`, `OCR_MIN_SCORE_APPLY`, `REQUIRE_ORIGIN`, `SCRAPER_READ_MODE`, `SLACK_WEBHOOK_URL`, `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER`, `WEBHOOK_URL`, `TEST_ENVIRONMENT`. *(Ojo: Algunas pueden estar codificadas dinámicamente o heredarse del archivo `.env` local si se testean en local, pero para Producción Edge Functions requerirán inyección).*

## 💡 3. Plan de Acción Inmediata (Quirúrgica)

He elaborado un plan de implementación exacto para mitigar todas estas alertas sin romper compatibilidad. Lo puedes revisar.
