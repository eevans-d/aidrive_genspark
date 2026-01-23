# Security Policy - Sistema Mini Market

## Supported Versions

Este proyecto está en fase de **pre-producción**. Actualmente solo la rama `main` recibe actualizaciones de seguridad.

| Version | Supported          |
| ------- | ------------------ |
| main    | :white_check_mark: |
| otras   | :x:                |

---

## Reporting a Vulnerability

### 🔒 Reporte Privado (Recomendado)

Si descubres una vulnerabilidad de seguridad, **NO** abras un issue público. Sigue estos pasos:

1. **Contacto directo:** Envía un reporte privado via GitHub Security Advisories:
   - Ve a la pestaña "Security" del repositorio
   - Haz clic en "Report a vulnerability"
   - Completa el formulario con detalles de la vulnerabilidad

2. **Información a incluir:**
   - Descripción clara de la vulnerabilidad
   - Pasos para reproducir el problema
   - Versión afectada (commit SHA o branch)
   - Impacto estimado (severidad)
   - Prueba de concepto (PoC) si es posible
   - Sugerencias de mitigación (opcional)

3. **Contacto alternativo:**
   - Si no puedes usar GitHub Security Advisories, contacta al maintainer:
   - **GitHub:** @eevans-d
   - **Asunto:** `[SECURITY] Vulnerabilidad en aidrive_genspark_forensic`

---

### ⏱️ Tiempo de Respuesta

- **Confirmación inicial:** Dentro de 48 horas
- **Evaluación y plan de acción:** Dentro de 7 días
- **Fix y disclosure:** Dependiendo de la severidad:
  - **Crítica:** 7-14 días
  - **Alta:** 14-30 días
  - **Media:** 30-60 días
  - **Baja:** 60-90 días

---

### 🎯 Alcance del Proyecto

#### ✅ En Alcance (Reportar)

**Backend (Supabase Edge Functions):**
- Autenticación y autorización
- SQL injection o vulnerabilidades de RLS
- Exposición de datos sensibles
- CORS misconfigurations
- Rate limiting bypass
- Secrets hardcodeados en código

**Frontend (React Application):**
- Cross-Site Scripting (XSS)
- Cross-Site Request Forgery (CSRF)
- Client-side injection
- Exposición de API keys
- Insecure data storage

**Infrastructure:**
- GitHub Actions workflow vulnerabilities
- Dependencias con vulnerabilidades conocidas (CVE)
- Configuraciones inseguras

**Database:**
- Row Level Security (RLS) bypass
- Privilege escalation
- Data exfiltration

#### ❌ Fuera de Alcance (No Reportar)

- Vulnerabilidades en dependencias third-party ya reportadas públicamente (usa Dependabot)
- Issues de UX/UI que no impactan seguridad
- Ataques de social engineering
- Denial of Service (DoS) sin PoC
- Clickjacking en páginas sin información sensible
- Falta de security headers en respuestas informativas
- Versiones de software divulgadas (banner disclosure)
- Best practices sin impacto directo en seguridad

---

### 🏆 Reconocimiento

Los reportes de seguridad válidos serán reconocidos públicamente (con tu consentimiento) en:
- Sección de "Security Advisories" del repositorio
- CHANGELOG del proyecto
- Hall of Fame en README (si aplicable)

Si prefieres permanecer anónimo, respetaremos tu decisión.

---

## Security Best Practices para Contribuidores

Si estás contribuyendo al proyecto, sigue estas prácticas:

### ✅ DO

- Usar GitHub Secrets para credenciales en workflows
- Validar y sanitizar **todas** las entradas de usuario
- Usar prepared statements para queries SQL
- Implementar rate limiting en endpoints públicos
- Seguir el principio de least privilege
- Revisar dependencias antes de agregar nuevas
- Ejecutar security scanners antes de PR (ver `docs/closure/SECURITY_RECOMMENDATIONS.md`)

### ❌ DON'T

- Hardcodear secrets, API keys, o passwords
- Commitear `.env` o archivos con credenciales reales
- Deshabilitar CORS sin justificación documentada
- Usar `eval()` o `Function()` con input de usuario
- Exponer stack traces completos en producción
- Ignorar warnings de security scanners sin revisión

---

## Security Tools

Este proyecto recomienda el uso de las siguientes herramientas (ver guía completa en `docs/closure/SECURITY_RECOMMENDATIONS.md`):

- **Gitleaks** - Detección de secretos en código
- **OSV-Scanner** - Escaneo de vulnerabilidades en dependencias
- **Semgrep** - Static Application Security Testing (SAST)
- **Dependabot** - Actualizaciones automáticas de dependencias (habilitado)

---

## Disclosure Policy

### Responsible Disclosure

Seguimos una política de **responsible disclosure**:

1. Recibes un reporte → investigamos → confirmamos
2. Desarrollamos fix → probamos
3. Desplegamos fix a producción
4. Publicamos Security Advisory con:
   - CVE ID (si aplica)
   - Descripción de la vulnerabilidad
   - Versiones afectadas
   - Fix aplicado
   - Crédito al reporter (si acepta)

**Tiempo de embargo:** Mínimo 90 días desde el reporte inicial antes de disclosure público, o hasta que el fix esté en producción (lo que ocurra primero).

---

## Security Updates

Suscríbete para recibir notificaciones de security updates:

1. En GitHub, ve al repositorio
2. Haz clic en "Watch" → "Custom" → selecciona "Security alerts"
3. Recibirás emails cuando publiquemos Security Advisories

---

## Compliance

Este proyecto actualmente NO cumple con ningún estándar de compliance formal (GDPR, HIPAA, PCI-DSS, etc.). 

Si planeas usar este sistema para datos sensibles o regulados:
- Realiza un security audit completo
- Implementa controles adicionales según tus requisitos de compliance
- Consulta con un experto en seguridad y compliance

---

## Questions?

Si tienes preguntas sobre esta política de seguridad:
- Abre un issue con el label `question` (para preguntas generales)
- Contacta a @eevans-d para consultas específicas

---

**Última actualización:** 2026-01-23  
**Versión:** 1.0.0
