# 📚 QUICK REFERENCE - ETAPA 3 Completada

**Esto es un índice rápido de lo que se completó. Para detalles, ver los documentos específicos.**

---

## 🚀 Comienza Aquí

### Si eres operador/ops:
1. Lee: `inventario-retail/OPERATIONS_RUNBOOK.md`
2. Luego: `inventario-retail/HANDOVER.md`
3. Bookmark: `inventario-retail/DEPLOYMENT_GUIDE.md`

### Si eres usuario/cliente:
1. Lee: `GUIA_USUARIO_DASHBOARD.md`
2. Luego: Explora el dashboard en `http://localhost:8080`

### Si eres desarrollador:
1. Lee: `inventario-retail/DEPLOYMENT_GUIDE.md` (arquitectura)
2. Luego: `inventario-retail/security/TLS_SETUP.md` + `DATA_ENCRYPTION.md`
3. Si quieres tests: `inventario-retail/scripts/load_testing/LOAD_TESTING.md`

---

## 📄 Documentos Principales

| Documento | Líneas | Para | Link |
|-----------|--------|------|------|
| **OPERATIONS_RUNBOOK.md** | 650 | Ops team | `inventario-retail/` |
| **DEPLOYMENT_GUIDE.md** | 1,145 | Arch/DevOps | `inventario-retail/` |
| **GUIA_USUARIO_DASHBOARD.md** | 800+ | Users | Root |
| **HANDOVER.md** | 350 | New ops | `inventario-retail/` |
| TLS_SETUP.md | 940 | Security | `inventario-retail/security/` |
| DATA_ENCRYPTION.md | 481 | DBA | `inventario-retail/security/` |
| LOAD_TESTING.md | 1,400 | QA/Perf | `inventario-retail/scripts/load_testing/` |

---

## 🔐 Seguridad Checklist

```
TLS/mTLS:
  ✅ Certs en: inventario-retail/observability/prometheus/tls/
  ✅ Válidas hasta: Oct 16, 2026
  ✅ Renovar: Usar generate_certs.sh

Encriptación:
  ✅ DATABASE_ENCRYPTION_KEY = env var (nunca en git)
  ✅ Algoritmo: AES-256-CBC
  ✅ Migración: 004_add_encryption.sql

API Security:
  ✅ Header requerido: X-API-Key
  ✅ Rate limiting: Activo
  ✅ CSP headers: Sí
```

---

## 🎯 Procedimientos Rápidos

### Health Check (diario)

```bash
cd inventario-retail
docker-compose ps
curl http://localhost:8080/health
```

### Emergencia - Dashboard No Responde

```bash
# 1. Reiniciar
docker-compose restart dashboard
sleep 10
curl http://localhost:8080/health

# 2. Si sigue: Ver OPERATIONS_RUNBOOK.md § P1
```

### Certificados Vencidos

```bash
# Generar nuevos (antes 30 días vencimiento)
cd observability/prometheus/tls/
./generate_certs.sh
# Luego: docker-compose restart prometheus alertmanager
```

### Load Test (antes de deployment)

```bash
cd scripts/load_testing
./run-all.sh
# Verifica que todos tests pasen
```

---

## 📊 Métricas SLO

| Métrica | Target | Ver |
|---------|--------|-----|
| Latencia P95 | < 300ms | LOAD_TESTING.md |
| Error Rate | < 0.5% | OPERATIONS_RUNBOOK.md |
| Uptime | > 99.5% | DEPLOYMENT_GUIDE.md |
| DB CPU | < 70% | Grafana dashboards |
| Memory | < 80% | Grafana dashboards |

---

## 🆘 Troubleshooting Rápido

| Problema | Dónde Buscar |
|----------|--------------|
| Dashboard no carga | GUIA_USUARIO_DASHBOARD.md § Troubleshooting |
| Base de datos lenta | OPERATIONS_RUNBOOK.md § PB2 |
| Memoria alta | OPERATIONS_RUNBOOK.md § PB3 |
| Errores cifrado | OPERATIONS_RUNBOOK.md § PB5 |
| Certs expirados | OPERATIONS_RUNBOOK.md § PB4 |
| API 401 error | GUIA_USUARIO_DASHBOARD.md § Autenticación |

---

## 📞 Contactos

**Slack:**
- #minimarket-ops → Cambios/mantenimiento
- #minimarket-emergencies → Incidentes P1/P2

**En Repositorio:**
- OPERATIONS_RUNBOOK.md § Escalamiento
- HANDOVER.md § Contactos

---

## 🚨 En Caso de Emergencia

1. Leer primeros 5 minutos: `OPERATIONS_RUNBOOK.md`
2. Buscar tu síntoma específico
3. Seguir steps del playbook
4. Si no se resuelve en 5min: Escalation per matrix

---

## ✅ Pre-Deployment Checklist

Antes de cualquier cambio:

- [ ] Tests passando en CI/CD
- [ ] Load tests con baseline cumplido
- [ ] Backup de BD realizado
- [ ] Certs TLS válidos (> 30 días)
- [ ] Variables env verificadas
- [ ] Documentación actualizada

---

## 📁 Estructura de Archivos Key

```
inventario-retail/
├── DEPLOYMENT_GUIDE.md         ← Léeme primero
├── OPERATIONS_RUNBOOK.md       ← Para emergencias
├── HANDOVER.md                 ← Para ops team
├── docker-compose.production.yml
├── security/
│   ├── TLS_SETUP.md
│   └── DATA_ENCRYPTION.md
├── observability/prometheus/tls/
│   └── generate_certs.sh       ← Renovar certs
├── database/migrations/
│   └── 004_add_encryption.sql
└── scripts/load_testing/
    ├── LOAD_TESTING.md
    ├── run-all.sh              ← Tests pre-deploy
    └── test-*.js
```

---

## 🎯 Estado Actual

- ✅ TLS/mTLS: Operacional
- ✅ Encriptación: Implementada
- ✅ Load Testing: Ready
- ✅ Documentación: Completa
- 🚫 Bloqueado: Staging server (27h tasks)

---

## 🆕 Próximos Pasos Opcionales

**ETAPA 3, Phase 2** (si quieres continuar):
- Audit trail logging
- OWASP Top 10 review
- GDPR compliance
- Disaster recovery drills

Ver: `CONTINUAR_MANANA_OCT18.md`

---

**Last Updated:** Oct 17, 2025  
**Version:** 1.0.0  
**Status:** ✅ Production Ready
