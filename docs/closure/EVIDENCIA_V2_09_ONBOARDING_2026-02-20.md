# Evidencia V2-09 — Onboarding silencioso primer uso

- Fecha: 2026-02-20
- Bloque: C
- Estado: COMPLETADO

## Problema

Un usuario nuevo (especialmente el perfil 60+) no tenia guia visual al ingresar por primera vez. El Dashboard mostraba metricas y hub sin contexto de "por donde empezar".

## Solucion

### Dashboard.tsx — Guia de primer uso

Agregada seccion de onboarding con 3 pasos directos, visible solo en primer ingreso:

1. **Vender** — Link a `/pos` (Punto de venta)
2. **Ver stock** — Link a `/stock` (Control de inventario)
3. **Ver pedidos** — Link a `/pedidos` (Ordenes de compra)

### Detalles tecnicos

- State `showOnboarding` inicializado via `localStorage.getItem('onboarding_completed')`
- Funcion `dismissOnboarding()` setea `localStorage.setItem('onboarding_completed', '1')` y oculta
- Cada CTA (Link) y el boton X ejecutan `dismissOnboarding` al hacer click
- Posicion: entre titulo "Dashboard" y hub operativo
- Visual: fondo indigo-50, borde indigo-200, cards blancas con numeros 1/2/3
- Grid responsivo: 1 col mobile, 3 cols desktop
- No bloquea acciones: dismiss via X en esquina superior derecha
- `aria-label="Cerrar guia"` para accesibilidad

### Auto-desactivacion

Tras cualquier interaccion (click CTA o dismiss), el flag `onboarding_completed` se persiste en localStorage. En visitas subsiguientes, el onboarding no se muestra.

## DoD cumplido

- [x] Primer ingreso muestra guia corta (3 pasos)
- [x] CTAs directas: "Vender" -> POS, "Ver stock" -> Stock, "Ver pedidos" -> Pedidos
- [x] Se desactiva automaticamente tras interaccion (localStorage flag)
- [x] No bloquea acciones — dismissable en cualquier paso

## Verificacion

```bash
pnpm -C minimarket-system lint     # PASS
pnpm -C minimarket-system build    # PASS
npx vitest run                     # 1561/1561 PASS (root)
cd minimarket-system && npx vitest run  # 182/182 PASS (components)
```

## Tests agregados (Dashboard.test.tsx)

- `V2-09: shows onboarding guide on first visit` — Sin flag -> guia visible con 3 opciones
- `V2-09: hides onboarding after dismiss` — Click X -> guia desaparece + flag seteado
- `V2-09: does not show onboarding when flag is set` — Con flag -> guia no visible

## Fix colateral: Deposito.test.tsx

Los tests de Deposito fallaban en suite de componentes porque el skeleton gate de V2-05 mostraba skeleton en el primer render. Corregido cambiando tests sincronicos a async con `findByText`/`findByPlaceholderText`.

## Archivos modificados

- `minimarket-system/src/pages/Dashboard.tsx`
- `minimarket-system/src/pages/Dashboard.test.tsx`
- `minimarket-system/src/pages/Deposito.test.tsx` (fix async)
