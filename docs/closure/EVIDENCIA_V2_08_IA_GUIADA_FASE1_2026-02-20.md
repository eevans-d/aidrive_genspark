# Evidencia V2-08 — IA guiada fase 1 (intent chips + CTA)

- Fecha: 2026-02-20
- Bloque: C
- Estado: COMPLETADO

## Problema

El Dashboard no ofrecia accesos rapidos contextuales. El usuario (60+, baja alfabetizacion digital) debia navegar manualmente para responder preguntas frecuentes como "que me falta reponer?" o "hay productos en riesgo?".

## Solucion

### Dashboard.tsx — Intent chips

Agregados 3 chips de intencion frecuente despues del hub operativo:

1. **"Que me falta reponer?"** — Muestra `stockBajo` count con mensaje contextual + CTA "Ver Stock Bajo" -> `/stock`
2. **"Productos con riesgo?"** — Lazy query a `mv_productos_proximos_vencer` (count, solo cuando chip activo) + CTA "Revisar Stock" -> `/stock`
3. **"Resumen del dia"** — Muestra estado actual: totalProductos, stockBajo, tareasUrgentes, totalTareasPendientes + CTAs "Ver Stock" y "Ir a Ventas"

### Detalles tecnicos

- Tipo `ChipId = 'reponer' | 'riesgo' | 'resumen'` con constante `INTENT_CHIPS`
- State `activeChip` togglea paneles (click para abrir, click de nuevo para cerrar)
- Query vencimientos: `useQuery` con `enabled: activeChip === 'riesgo'` (lazy, staleTime 5min)
- Icono `Lightbulb` para indicador IA en paneles
- Cada panel tiene color contextual (blue/orange/green) + CTA con `ArrowRight`
- Datos de stockBajo y tareas vienen del hook `useDashboardStats` (sin queries extra)

### Nuevos imports

- `useState` (ya existia `useMemo`)
- `ArrowRight`, `Lightbulb`, `X` de lucide-react
- `supabase` de `../lib/supabase`

## DoD cumplido

- [x] Dashboard incluye chips de intencion frecuentes
- [x] Cada chip ejecuta accion concreta sin escritura libre
- [x] Cada salida incluye CTA de accion inmediata (boton Link, no solo texto)

## Verificacion

```bash
pnpm -C minimarket-system lint     # PASS
pnpm -C minimarket-system build    # PASS
npx vitest run                     # 1561/1561 PASS (root)
cd minimarket-system && npx vitest run  # 182/182 PASS (components)
```

## Tests agregados (Dashboard.test.tsx)

- `V2-08: renders intent chips` — Verifica presencia de los 3 chips
- `V2-08: clicking reponer chip shows stock bajo info with CTA` — Click chip -> panel con dato + CTA
- `V2-08: clicking resumen chip shows summary with CTAs` — Click chip -> resumen + 2 CTAs
- `V2-08: clicking active chip toggles it off` — Toggle on/off

## Archivos modificados

- `minimarket-system/src/pages/Dashboard.tsx`
- `minimarket-system/src/pages/Dashboard.test.tsx`
