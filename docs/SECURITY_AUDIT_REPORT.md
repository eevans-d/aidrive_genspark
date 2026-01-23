# Reporte de Auditoría de Dependencias

**Fecha:** 2026-01-23  
**Ejecutado por:** WS7.2 - Security Scan  

---

## Resumen Ejecutivo

| Paquete | Vulnerabilidades | Severidad Máxima |
|---------|------------------|------------------|
| Raíz (`/`) | 0 | - |
| Frontend (`minimarket-system/`) | 1 | Moderate |
| Tests (`tests/`) | Sin lockfile | N/A |

---

## Detalle por Proyecto

### 1. Proyecto Raíz (`/`)

```
found 0 vulnerabilities
```

✅ **Sin vulnerabilidades detectadas**

---

### 2. Frontend (`minimarket-system/`)

```
# npm audit report

lodash  4.0.0 - 4.17.21
Severity: moderate
Lodash has Prototype Pollution Vulnerability in `_.unset` and `_.omit` functions
https://github.com/advisories/GHSA-xxjr-mmjv-4gpg

1 moderate severity vulnerability
```

**Análisis:**
- **Paquete afectado:** `lodash@4.17.21`
- **Dependencia de:** `recharts@2.15.4` (librería de gráficos)
- **Tipo:** Transitiva (no directa)
- **Severidad:** Moderate
- **Vulnerabilidad:** Prototype Pollution en `_.unset` y `_.omit`

**Riesgo en contexto:**
- `recharts` usa lodash internamente para manipulación de datos
- Las funciones `_.unset` y `_.omit` NO son llamadas directamente por el código del proyecto
- El vector de ataque requiere input malicioso controlado por usuario que llegue a estas funciones
- **Impacto real: BAJO** - La aplicación no expone rutas que permitan explotar esta vulnerabilidad

**Recomendación:**
1. Monitorear actualizaciones de recharts que actualicen lodash
2. No requiere acción inmediata dado el bajo riesgo
3. Considerar issue en recharts si persiste >6 meses

---

### 3. Tests (`tests/`)

- No tiene `package-lock.json`
- Las dependencias de test están en el `package.json` raíz
- ✅ Cubierto por audit del proyecto raíz

---

## Acciones Tomadas

1. ✅ Audit ejecutado en todos los proyectos
2. ✅ Vulnerabilidades documentadas
3. ✅ Análisis de riesgo realizado
4. ✅ Recomendaciones establecidas

## Próximo Audit

- **Programado:** Próxima iteración de mantenimiento
- **Trigger automático:** Cuando se actualicen dependencias

---

## Comandos de Referencia

```bash
# Ejecutar audit completo
npm audit                    # Raíz
cd minimarket-system && npm audit  # Frontend

# Fix automático (con precaución)
npm audit fix

# Ver árbol de dependencias
npm ls <paquete>
```

---

*Generado automáticamente por WS7.2*
