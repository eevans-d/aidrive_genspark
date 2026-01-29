---
description: Auditoría completa pre-release usando RealityCheck
---

# Pre-Release Audit Workflow

Workflow para validación completa antes de un release a producción.

## Cuándo Usar

- Antes de versión mayor/menor
- Antes de demo a stakeholders
- Después de sprint completion

## Pasos

1. Ejecutar RealityCheck completo:
```
RealityCheck deep full, focus ux
```

2. Revisar output y verificar:
   - Score UX ≥ 8/10
   - Todos los flujos críticos funcionan
   - No hay blockers

// turbo
3. Ejecutar suite de tests completa:
```bash
npm run test:all
```

4. Verificar build de producción:
```bash
cd minimarket-system && npm run build
```

5. Revisar logs de Supabase Edge Functions:
```bash
supabase functions logs api-minimarket --tail
```

6. Generar reporte final en `docs/RELEASE_NOTES.md`

## Checklist Pre-Release

- [ ] RealityCheck score ≥ 8
- [ ] Tests 100% passing
- [ ] Build production OK
- [ ] No errores en logs
- [ ] Documentación sincronizada
- [ ] DECISION_LOG actualizado

## Skills Relacionados

- **RealityCheck**: Auditoría UX principal
- **TestMaster**: Suite de tests completa
- **DocuGuard**: Verificar sincronización docs
- **DeployOps**: Ejecutar deploy final
