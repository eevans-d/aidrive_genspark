# Guia De Contribucion

Estado: Activo
Audiencia: Colaboradores internos
Ultima actualizacion: 2026-02-21
Fuente de verdad: docs/ESTADO_ACTUAL.md
Owner documental: Mantenimiento del repositorio

## Objetivo
Definir un flujo simple y reproducible para proponer cambios sin romper calidad ni trazabilidad.

## Procedimiento Paso A Paso
1. Crear rama desde `main` con nombre descriptivo (`tipo/objetivo-corto`).
2. Implementar cambios acotados y con mensajes de commit claros.
3. Ejecutar validaciones minimas antes de solicitar revision:
```bash
pnpm -C minimarket-system lint
pnpm -C minimarket-system build
npm run test:unit
node scripts/validate-doc-links.mjs
```
4. Actualizar documentacion canonica si cambia comportamiento real.
5. Abrir PR con:
   - resumen de cambios
   - evidencia de validaciones
   - riesgos residuales

## Errores Comunes
- Mezclar cambios no relacionados en el mismo PR.
- Omitir actualizacion de docs despues de cambios funcionales.
- Enviar PR sin evidencia de comandos ejecutados.

## Verificacion
Checklist previo a merge:
- [ ] Cambios acotados y entendibles
- [ ] Validaciones base en PASS o bloqueo justificado
- [ ] Documentacion alineada
- [ ] No exposicion de secretos

## Escalacion
Si el cambio impacta operacion critica (venta/faltantes/autenticacion), pedir revision adicional de soporte tecnico antes del merge.
