# Security Recommendations - Sistema Mini Market

**Versión:** 1.0.0  
**Fecha:** 2026-01-23  
**Alcance:** Herramientas de seguridad automatizada para CI/CD

---

## 📋 Overview

Este documento proporciona **instrucciones** para ejecutar herramientas de seguridad automatizadas en el proyecto. **No se incluyen implementaciones** en este cierre, solo guías de ejecución manual y ejemplos de workflows opcionales para futuras integraciones.

### Herramientas Recomendadas

1. **Gitleaks** - Detección de secretos y credenciales en código
2. **OSV-Scanner** - Vulnerabilidades de dependencias (npm, Deno)
3. **Semgrep** - Static Application Security Testing (SAST)

---

## 🔐 1. Gitleaks - Detección de Secretos

### Descripción
Gitleaks detecta secretos hardcodeados (API keys, passwords, tokens) en el código fuente y en el historial de git.

### Instalación

```bash
# Opción 1: Homebrew (macOS)
brew install gitleaks

# Opción 2: Docker
docker pull zricethezav/gitleaks:latest

# Opción 3: Go install
go install github.com/gitleaks/gitleaks/v8@latest

# Opción 4: Binary directo
# Descargar desde: https://github.com/gitleaks/gitleaks/releases
```

### Ejecución Manual

#### Escaneo Completo del Repositorio
```bash
# En la raíz del proyecto
gitleaks detect --source . --verbose
```

#### Escaneo Solo de Cambios No Commiteados
```bash
gitleaks protect --staged --verbose
```

#### Escaneo del Historial Git Completo
```bash
gitleaks detect --source . --log-opts="--all" --verbose
```

#### Generar Reporte en JSON
```bash
gitleaks detect --source . --report-path gitleaks-report.json --report-format json
```

### Configuración Personalizada

Crear `.gitleaks.toml` en la raíz (opcional):

```toml
title = "Gitleaks Config - Mini Market"

[extend]
# Usa reglas base de gitleaks
useDefault = true

[allowlist]
description = "Allowlist para false positives conocidos"
paths = [
    '''\.env\.example$''',
    '''\.env\.test\.example$''',
]

# Ignora tokens de ejemplo/mocks
regexes = [
    '''eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\.example\.signature''',
]
```

### Interpretación de Resultados

**✅ Sin hallazgos:**
```
○
│╲╲
│ ○
○ ░
░    gitleaks

No leaks found
```

**❌ Secretos encontrados:**
```
Finding:     API_KEY=sk_live_xxxxxxxxxxxxx
Secret:      sk_live_xxxxxxxxxxxxx
RuleID:      generic-api-key
Entropy:     3.8
File:        supabase/functions/payment/config.ts
Line:        12
Commit:      a1b2c3d4
```

**Acciones:**
1. **Rotar el secreto:** Generar nuevo API key/token
2. **Actualizar en servicios:** Configurar nuevo secreto en GitHub Secrets, Supabase, etc.
3. **Limpiar historial:** Usar `git filter-repo` o BFG Repo-Cleaner (cuidado!)
4. **Prevenir:** Agregar a `.gitignore` o usar GitHub Secrets

---

## 📦 2. OSV-Scanner - Vulnerabilidades de Dependencias

### Descripción
OSV-Scanner verifica vulnerabilidades conocidas en dependencias npm y Deno usando la base de datos de Open Source Vulnerabilities.

### Instalación

```bash
# Opción 1: Go install
go install github.com/google/osv-scanner/cmd/osv-scanner@v1

# Opción 2: Homebrew (macOS)
brew install osv-scanner

# Opción 3: Docker
docker pull ghcr.io/google/osv-scanner:latest

# Opción 4: Binary directo
# Descargar desde: https://github.com/google/osv-scanner/releases
```

### Ejecución Manual

#### Escaneo del Proyecto Completo
```bash
# En la raíz del proyecto
osv-scanner --recursive .
```

#### Escaneo Solo de package.json (raíz)
```bash
osv-scanner --lockfile=package-lock.json
```

#### Escaneo Solo de Frontend (pnpm)
```bash
osv-scanner --lockfile=minimarket-system/pnpm-lock.yaml
```

#### Generar Reporte en JSON
```bash
osv-scanner --recursive . --format json --output osv-report.json
```

#### Escaneo con Filtros de Severidad
```bash
# Solo HIGH y CRITICAL
osv-scanner --recursive . --severity HIGH,CRITICAL
```

### Interpretación de Resultados

**✅ Sin vulnerabilidades:**
```
Scanning dir .
Scanned minimarket-system/package.json file and found 0 vulnerabilities
```

**❌ Vulnerabilidades encontradas:**
```
╭─────────────────────────────────────────────────────────────╮
│ OSV-Scanner v1.x.x                                           │
│ Found 3 vulnerabilities in total                             │
╰─────────────────────────────────────────────────────────────╯

Vulnerability #1: CVE-2024-xxxxx
Package:      react-dom
Version:      18.2.0
Severity:     HIGH
Description:  Cross-site scripting in React DOM
Fixed in:     18.3.1
CVSS Score:   7.5

Vulnerability #2: GHSA-xxxx-yyyy-zzzz
Package:      @supabase/supabase-js
Version:      2.70.0
Severity:     MEDIUM
Description:  Auth bypass in specific conditions
Fixed in:     2.78.0
```

**Acciones:**
1. **Actualizar dependencias:** `pnpm update` o `npm update`
2. **Revisar breaking changes:** Leer changelog del paquete
3. **Probar:** Ejecutar tests después de actualizar
4. **Si no hay fix:** Evaluar mitigaciones o alternativas

---

## 🔍 3. Semgrep - SAST (Static Application Security Testing)

### Descripción
Semgrep analiza código fuente en busca de patrones inseguros (SQL injection, XSS, hardcoded secrets, etc.) usando reglas customizables.

### Instalación

```bash
# Opción 1: pip (Python)
pip install semgrep

# Opción 2: Homebrew (macOS)
brew install semgrep

# Opción 3: Docker
docker pull returntocorp/semgrep:latest
```

### Ejecución Manual

#### Escaneo con Reglas Auto
```bash
# Semgrep detecta lenguajes automáticamente
semgrep scan --config=auto
```

#### Escaneo con Reglas de Seguridad
```bash
# Usa ruleset de seguridad de la comunidad
semgrep scan --config=p/security-audit
```

#### Escaneo Específico para TypeScript/JavaScript
```bash
semgrep scan --config=p/typescript --config=p/javascript
```

#### Escaneo con Reglas OWASP Top 10
```bash
semgrep scan --config=p/owasp-top-ten
```

#### Generar Reporte JSON
```bash
semgrep scan --config=auto --json --output semgrep-report.json
```

#### Solo Errores CRITICAL/HIGH
```bash
semgrep scan --config=auto --severity ERROR
```

### Reglas Personalizadas para el Proyecto

Crear `.semgrep.yml` en raíz (opcional):

```yaml
rules:
  - id: hardcoded-supabase-key
    pattern: |
      const SUPABASE_KEY = "..."
    message: "Hardcoded Supabase key detected"
    severity: ERROR
    languages: [typescript, javascript]
    
  - id: console-log-in-production
    pattern: console.log(...)
    message: "console.log found - use logger instead"
    severity: WARNING
    languages: [typescript, javascript]
    paths:
      exclude:
        - "**/*.test.ts"
        - "**/tests/**"
        - "**/_shared/logger.ts"
        
  - id: sql-injection-risk
    pattern: |
      supabase.from(...).select(`${...}`)
    message: "Potential SQL injection - use parameterized queries"
    severity: ERROR
    languages: [typescript, javascript]
```

### Interpretación de Resultados

**✅ Sin hallazgos críticos:**
```
ran 423 rules on 156 files: 0 findings
```

**❌ Vulnerabilidades encontradas:**
```
┌──── ○○○ ────┐
│ Semgrep CLI │
└─────────────┘

Findings:

  supabase/functions/api-minimarket/index.ts
  ❯❯❱ hardcoded-supabase-key
        Hardcoded Supabase key detected
        
       12 │ const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
          │ ▶▶▶▶▶▶▶▶▶▶▶▶▶▶▶▶▶▶▶▶▶▶▶▶▶▶▶▶▶▶▶▶▶▶▶▶▶▶▶▶▶▶▶▶▶▶▶▶▶▶▶▶▶▶▶
        
  minimarket-system/src/pages/Dashboard.tsx
  ❯❯❱ console-log-in-production
        console.log found - use logger instead
        
       45 │ console.log('Dashboard loaded', data)
          │ ▶▶▶▶▶▶▶▶▶▶▶▶▶▶▶▶▶▶▶▶▶▶▶▶▶▶▶▶▶▶▶▶▶▶▶▶▶

Some findings were hidden. Use `--verbose` to show all.
Ran 423 rules on 156 files: 2 findings.
```

**Acciones:**
1. **ERROR severity:** Corregir inmediatamente antes de merge
2. **WARNING severity:** Planear corrección en próximo sprint
3. **INFO severity:** Considerar mejora de código

---

## 🤖 Workflow Ejemplo (GitHub Actions)

**⚠️ Nota:** Este workflow es **opcional** y no está incluido en este PR de cierre. Se proporciona como referencia para implementación futura.

Crear `.github/workflows/security-scan.yml`:

```yaml
name: Security Scan

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
  schedule:
    # Escaneo semanal los lunes a las 9 AM UTC
    - cron: '0 9 * * 1'
  workflow_dispatch:

jobs:
  gitleaks:
    name: Gitleaks - Secret Detection
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0  # Necesario para escaneo de historial
      
      - name: Run Gitleaks
        uses: gitleaks/gitleaks-action@v2
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          GITLEAKS_LICENSE: ${{ secrets.GITLEAKS_LICENSE }} # Opcional
          
      - name: Upload Gitleaks Report
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: gitleaks-report
          path: gitleaks-report.json
          retention-days: 7

  osv-scanner:
    name: OSV Scanner - Dependency Vulnerabilities
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Run OSV Scanner
        uses: google/osv-scanner-action@v1
        with:
          scan-args: |-
            --recursive
            --format json
            --output osv-report.json
        continue-on-error: true
        
      - name: Upload OSV Report
        uses: actions/upload-artifact@v4
        with:
          name: osv-report
          path: osv-report.json
          retention-days: 7

  semgrep:
    name: Semgrep - SAST
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Run Semgrep
        uses: returntocorp/semgrep-action@v1
        with:
          config: >-
            p/security-audit
            p/typescript
            p/owasp-top-ten
        env:
          SEMGREP_APP_TOKEN: ${{ secrets.SEMGREP_APP_TOKEN }}
          
      - name: Upload Semgrep Report
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: semgrep-report
          path: semgrep.json
          retention-days: 7
```

### Configuración de Secrets para Workflow

En **GitHub Repository Settings → Secrets and variables → Actions**:

- `GITLEAKS_LICENSE` (opcional - para versión enterprise)
- `SEMGREP_APP_TOKEN` (opcional - para Semgrep Cloud)

---

## 📋 Checklist de Implementación

### Fase 1: Setup Local (Inmediato)
- [ ] Instalar gitleaks localmente
- [ ] Ejecutar `gitleaks detect` en el proyecto
- [ ] Revisar y corregir hallazgos
- [ ] Instalar OSV-Scanner
- [ ] Ejecutar `osv-scanner --recursive .`
- [ ] Actualizar dependencias vulnerables
- [ ] Instalar Semgrep
- [ ] Ejecutar `semgrep scan --config=auto`
- [ ] Corregir hallazgos críticos

### Fase 2: Pre-commit Hooks (Recomendado)
- [ ] Instalar pre-commit framework
- [ ] Configurar `.pre-commit-config.yaml` con gitleaks
- [ ] Probar hooks localmente
- [ ] Documentar en README para el equipo

### Fase 3: CI Integration (Opcional)
- [ ] Crear workflow de seguridad (usar ejemplo arriba)
- [ ] Configurar secrets necesarios
- [ ] Probar workflow en branch de prueba
- [ ] Ajustar fail conditions según severidad
- [ ] Habilitar en main

### Fase 4: Monitoreo Continuo (Avanzado)
- [ ] Configurar Dependabot (ya incluido en este PR)
- [ ] Considerar Snyk o similares para monitoreo 24/7
- [ ] Establecer SLA para remediar vulnerabilidades
- [ ] Documentar proceso de response a vulnerabilidades

---

## 🔗 Recursos Adicionales

### Documentación Oficial
- **Gitleaks:** https://github.com/gitleaks/gitleaks
- **OSV-Scanner:** https://github.com/google/osv-scanner
- **Semgrep:** https://semgrep.dev/docs/

### Bases de Datos de Vulnerabilidades
- **OSV:** https://osv.dev/
- **CVE:** https://cve.mitre.org/
- **GitHub Advisory:** https://github.com/advisories
- **npm Advisory:** https://www.npmjs.com/advisories

### Herramientas Complementarias
- **Trivy:** Container scanning
- **Snyk:** Continuous monitoring
- **CodeQL:** GitHub Advanced Security
- **SonarQube:** Code quality + security

---

## ⚠️ Importante

1. **No automatizar en CI sin revisar primero localmente** - Los falsos positivos son comunes
2. **Establecer allowlists** - Para secretos de test/ejemplo conocidos
3. **No bloquear builds inmediatamente** - Empezar con warnings y revisar tendencias
4. **Rotar secretos encontrados** - Siempre asumir que secretos expuestos están comprometidos
5. **Documentar decisiones** - Si decides ignorar un hallazgo, documentar por qué

---

## 📞 Soporte

Para dudas sobre implementación de herramientas de seguridad:
- **Owner:** @eevans-d
- **Issues:** https://github.com/eevans-d/aidrive_genspark/issues

---

**Documento generado:** 2026-01-23  
**Versión:** 1.0.0  
**Próxima revisión:** Al implementar CI security workflow
