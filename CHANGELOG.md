# Changelog

## [v0.9.0] - 2025-10-03
### Security (ETAPA 2: Risk Mitigation R1, R6, R3)
- **R1 (Container Security, severity 10)**: Hardened dashboard container to run as non-root user `dashboarduser` (UID/GID 1001)
  - All 4 agent containers now execute with non-root users (agente, negocio, mluser, dashboarduser)
  - Created logs/cache directories with proper ownership in web_dashboard Dockerfile
- **R6 (Dependency Scanning, severity 7)**: Enforced Trivy dependency scanning in CI/CD pipeline
  - Added `trivy-scan-dependencies` job to scan requirements.txt with exit-code=1 (enforced)
  - Configured severity CRITICAL,HIGH only (ignore MEDIUM false positives)
  - Runs in parallel to test-dashboard (no dependency on image build)
- **R3 (OCR Timeout Risk, severity 7)**: Added timeout protection to OCR processing
  - Changed OCRProcessor.process_image from async to sync (correct for to_thread execution)
  - Wrapped OCR calls with asyncio.wait_for() and configurable OCR_TIMEOUT_SECONDS (default 30s)
  - Applied to both /process-invoice and /test-ocr endpoints
  - Returns HTTP 504 with clear error message when timeout exceeded

### Changed
- OCRProcessor: Removed async from process_image method (now sync for thread execution)
- agente_negocio main_complete.py: Added OCR_TIMEOUT_SECONDS config with timeout wrappers
- agente_negocio Dockerfile: Added ENV OCR_TIMEOUT_SECONDS=30

Effort: R1=3h + R6=2h + R3=4h = 9h
ROI: R1=3.5, R6=2.1, R3=1.8 (all exceed 1.6 threshold)

## [v0.8.4] - 2025-09-30
### Added


Todas las notas siguen el formato Keep a Changelog (simplificado) y versionado SemVer.

## [Unreleased]
- (pendiente) Ajustes menores post v1.0.0

## [1.0.0-rc1] - YYYY-MM-DD
### Added
- Script `check_metrics_dashboard.sh` para verificación de métricas
- Script `check_security_headers.sh` para validar headers de seguridad
- Script `preflight_rc.sh` para orquestar smoke/métricas/headers
- Makefile operativo (targets: test, coverage, preflight, rc-tag)
- Job CI advisory `staging-metrics-check`
- Plantilla Issue `release_rc_checklist.md`

### Changed
- README principal: sección tooling operativo
- Runbook: tagging RC → Release y referencia a scripts
- Guía extendida: pasos tagging con preflight

### Security
- Refuerzo operativo de validación headers antes de release

---
Formato basado en ideas de Keep a Changelog.
### Misc
- Fixed: retail tests now pass (async DB factory handled without context manager
- Prometheus labels ASCII
- validation messages aligned
- EAN-13 util tests green). Improved: CircuitBreaker exception handling
- metrics export returns string. Notes: left Pydantic v1 validator warnings in shared/retail_validation.py for later migration.
