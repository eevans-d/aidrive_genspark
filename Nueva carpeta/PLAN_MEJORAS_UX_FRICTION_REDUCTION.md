# PLAN DE MEJORAS: REDUCCIÓN DE FRICCIÓN Y FUNCIONALIDADES COMPLEMENTARIAS
## Mini Market System - Iteración de UX y Optimización Operativa

---

## 📋 METADATA DEL DOCUMENTO

| Campo | Valor |
|---|---|
| **Versión** | 1.0.0 |
| **Fecha de creación** | 2026-02-07 |
| **Propósito** | Plan de implementación de mejoras UX y funcionalidades complementarias |
| **Destinatario** | Agente de planificación (GitHub Copilot/Antigravity/Codex) |
| **Repositorio** | `eevans-d/aidrive_genspark_forensic` |
| **Branch objetivo** | `feature/ux-improvements` (crear desde `main`) |
| **Tipo de cambios** | Mejoras incrementales (no breaking changes) |
| **Prioridad global** | MEDIA-ALTA |
| **Tiempo estimado total** | 6-8 semanas (8 fases) |

---

## 🎯 CONTEXTO Y OBJETIVOS

### Situación Actual

El Mini Market System es un sistema operativo completo con:
- ✅ 13 Edge Functions serverless
- ✅ 9 pantallas frontend React
- ✅ Base de datos PostgreSQL con RLS
- ✅ 722+ tests unitarios (69.91% cobertura)
- ✅ Autenticación y autorización funcional
- ✅ Procesos automáticos (cron jobs) operativos

### Problema Detectado

A pesar de estar **funcionalmente completo**, el sistema presenta fricciones operativas:
1. **Exceso de navegación** entre pantallas para completar tareas simples
2. **Alertas dispersas** sin centro de control unificado
3. **Flujos de trabajo repetitivos** sin atajos ni automatización
4. **Búsqueda fragmentada** (cada pantalla tiene su propio buscador)
5. **Falta de feedback visual** en estados de carga y operaciones
6. **Ausencia de inteligencia de negocio básica** (productos sin rotación, oportunidades comerciales)

### Objetivos de Esta Iteración

| ID | Objetivo | Métrica de éxito |
|---|---|---|
| **OBJ-01** | Reducir tiempo de operación de depósito en 50% | De 60s → 30s por movimiento |
| **OBJ-02** | Centralizar gestión de alertas | 100% alertas visibles desde un solo punto |
| **OBJ-03** | Implementar búsqueda global | Uso en >40% de sesiones |
| **OBJ-04** | Proveer inteligencia de negocio básica | 3 reportes automáticos nuevos |
| **OBJ-05** | Optimizar percepción de velocidad | TTFB < 200ms en 95% de requests |

---

## 📂 ESTRUCTURA DEL PROYECTO (VERIFICACIÓN REQUERIDA)

### Frontend (`frontend/`)

```
frontend/src/
├── components/
│   ├── common/          # Componentes reutilizables
│   ├── layout/          # Layout principal, Sidebar, Header
│   └── [feature]/       # Componentes por feature
├── hooks/
│   ├── useProducts.ts
│   ├── useStock.ts
│   ├── useTareas.ts
│   └── ...
├── pages/
│   ├── Dashboard.tsx
│   ├── Productos.tsx
│   ├── Stock.tsx
│   ├── Deposito.tsx
│   ├── Kardex.tsx
│   ├── Tareas.tsx
│   ├── Proveedores.tsx
│   ├── Rentabilidad.tsx
│   └── Login.tsx
├── lib/
│   ├── supabase.ts
│   ├── api.ts
│   └── utils.ts
└── App.tsx
```

**ACCIÓN AGENTE**: Verificar existencia de todos estos archivos antes de continuar.

### Backend (`supabase/functions/`)

```
supabase/functions/
├── _shared/
│   ├── logger.ts
│   ├── response.ts
│   ├── cors.ts
│   ├── errors.ts
│   ├── rate-limit.ts
│   ├── circuit-breaker.ts
│   └── audit.ts
├── api-minimarket/      # Gateway principal (29 endpoints)
├── api-proveedor/       # API proveedor (9 endpoints)
├── scraper-maxiconsumo/
├── cron-jobs-maxiconsumo/
├── alertas-stock/
├── alertas-vencimientos/
└── ...
```

**ACCIÓN AGENTE**: Verificar estructura y contar endpoints actuales en cada función.

### Base de Datos (`supabase/migrations/`)

**Tablas críticas a verificar**:
- `productos`
- `stock`
- `precios_historial`
- `movimientos_deposito`
- `categorias`
- `proveedores`
- `precios_proveedor`
- `tareas`
- `personal`
- `alertas_stock`
- `alertas_vencimientos`

**ACCIÓN AGENTE**: Ejecutar `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'` y comparar con esta lista.

---

## 🔧 ESPECIFICACIONES TÉCNICAS DE MEJORAS

### FASE 1: CENTRO DE NOTIFICACIONES UNIFICADO

#### 1.1 Especificación Funcional

**Ubicación**: Header de la aplicación (componente global)

**Comportamiento**:
- Ícono de campana (🔔) siempre visible en header
- Badge con contador de alertas no leídas
- Click → panel deslizable desde la derecha (400px ancho)
- Agrupa alertas por tipo: Críticas, Stock, Vencimientos, Precios, Tareas
- Cada alerta es accionable (botones: "Ver producto", "Crear tarea", "Marcar leída")
- Auto-refresh cada 30 segundos (React Query con refetch interval)
- Persistencia de estado leído/no leído en base de datos

#### 1.2 Diseño de Base de Datos

**Nueva tabla**: `notificaciones`

```sql
-- Migración: 20260207000001_crear_tabla_notificaciones.sql
CREATE TABLE notificaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('stock', 'vencimiento', 'precio', 'tarea', 'sistema')),
  prioridad TEXT NOT NULL CHECK (prioridad IN ('critica', 'alta', 'media', 'baja')),
  titulo TEXT NOT NULL,
  mensaje TEXT NOT NULL,
  metadata JSONB, -- Datos adicionales específicos del tipo
  leida BOOLEAN DEFAULT FALSE,
  accion_url TEXT, -- URL para navegar al hacer clic
  created_at TIMESTAMPTZ DEFAULT NOW(),
  leida_at TIMESTAMPTZ
);

-- Índices para optimización
CREATE INDEX idx_notificaciones_usuario_no_leidas 
  ON notificaciones(usuario_id, created_at DESC) 
  WHERE leida = FALSE;

CREATE INDEX idx_notificaciones_tipo_prioridad 
  ON notificaciones(tipo, prioridad, created_at DESC);

-- RLS Policies
ALTER TABLE notificaciones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios ven solo sus notificaciones"
  ON notificaciones FOR SELECT
  USING (usuario_id = auth.uid());

CREATE POLICY "Sistema puede crear notificaciones"
  ON notificaciones FOR INSERT
  WITH CHECK (true); -- Creadas por Edge Functions
```

#### 1.3 Backend: Nueva Edge Function

**Archivo**: `supabase/functions/api-notificaciones/index.ts`

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { corsHeaders } from '../_shared/cors.ts';
import { logger } from '../_shared/logger.ts';
import { respondOk, respondFail } from '../_shared/response.ts';
import { authenticateRequest } from '../_shared/auth.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const user = await authenticateRequest(req, supabase);
    const url = new URL(req.url);
    const path = url.pathname.split('/').pop();

    // GET /api-notificaciones/unread
    if (req.method === 'GET' && path === 'unread') {
      const { data, error } = await supabase
        .from('notificaciones')
        .select('*')
        .eq('usuario_id', user.id)
        .eq('leida', false)
        .order('prioridad', { ascending: false }) // critica > alta > media > baja
        .order('created_at', { ascending: false });

      if (error) throw error;

      return respondOk({
        notificaciones: data,
        count: data.length,
        criticas: data.filter(n => n.prioridad === 'critica').length
      });
    }

    // POST /api-notificaciones/:id/mark-read
    if (req.method === 'POST' && url.pathname.includes('mark-read')) {
      const id = url.pathname.split('/')[2];
      
      const { error } = await supabase
        .from('notificaciones')
        .update({ leida: true, leida_at: new Date().toISOString() })
        .eq('id', id)
        .eq('usuario_id', user.id);

      if (error) throw error;

      return respondOk({ success: true });
    }

    // POST /api-notificaciones/mark-all-read
    if (req.method === 'POST' && path === 'mark-all-read') {
      const { error } = await supabase
        .from('notificaciones')
        .update({ leida: true, leida_at: new Date().toISOString() })
        .eq('usuario_id', user.id)
        .eq('leida', false);

      if (error) throw error;

      return respondOk({ success: true });
    }

    return respondFail('NOT_FOUND', 'Endpoint no encontrado', 404);

  } catch (error) {
    logger.error('Error en api-notificaciones', error);
    return respondFail('INTERNAL_ERROR', error.message, 500);
  }
});
```

#### 1.4 Frontend: Hook Personalizado

**Archivo**: `frontend/src/hooks/useNotificaciones.ts`

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

interface Notificacion {
  id: string;
  tipo: 'stock' | 'vencimiento' | 'precio' | 'tarea' | 'sistema';
  prioridad: 'critica' | 'alta' | 'media' | 'baja';
  titulo: string;
  mensaje: string;
  metadata?: Record<string, any>;
  leida: boolean;
  accion_url?: string;
  created_at: string;
}

export const useNotificaciones = () => {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['notificaciones', 'unread'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notificaciones')
        .select('*')
        .eq('leida', false)
        .order('prioridad', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Notificacion[];
    },
    refetchInterval: 30000, // Auto-refresh cada 30 segundos
  });

  const marcarLeida = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('notificaciones')
        .update({ leida: true, leida_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['notificaciones']);
    },
  });

  const marcarTodasLeidas = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('notificaciones')
        .update({ leida: true, leida_at: new Date().toISOString() })
        .eq('leida', false);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['notificaciones']);
    },
  });

  return {
    notificaciones: data || [],
    count: data?.length || 0,
    criticas: data?.filter(n => n.prioridad === 'critica').length || 0,
    isLoading,
    marcarLeida,
    marcarTodasLeidas,
  };
};
```

#### 1.5 Frontend: Componente UI

**Archivo**: `frontend/src/components/layout/NotificationCenter.tsx`

```typescript
import { useState } from 'react';
import { Bell, X, CheckCheck } from 'lucide-react';
import { useNotificaciones } from '@/hooks/useNotificaciones';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export const NotificationCenter = () => {
  const [open, setOpen] = useState(false);
  const { notificaciones, count, criticas, marcarLeida, marcarTodasLeidas } = useNotificaciones();

  const getPrioridadColor = (prioridad: string) => {
    const colors = {
      critica: 'bg-red-500',
      alta: 'bg-orange-500',
      media: 'bg-yellow-500',
      baja: 'bg-blue-500',
    };
    return colors[prioridad] || 'bg-gray-500';
  };

  return (
    <>
      {/* Bell Icon */}
      <button
        onClick={() => setOpen(true)}
        className="relative p-2 hover:bg-gray-100 rounded-lg transition"
      >
        <Bell className="w-6 h-6" />
        {count > 0 && (
          <span className={cn(
            "absolute -top-1 -right-1 px-2 py-0.5 text-xs font-bold text-white rounded-full",
            criticas > 0 ? 'bg-red-500 animate-pulse' : 'bg-blue-500'
          )}>
            {count > 99 ? '99+' : count}
          </span>
        )}
      </button>

      {/* Slide-in Panel */}
      {open && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/20" 
            onClick={() => setOpen(false)}
          />

          {/* Panel */}
          <div className="relative w-full max-w-md bg-white shadow-2xl overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">
                Notificaciones
                {count > 0 && <span className="ml-2 text-sm text-gray-500">({count})</span>}
              </h2>
              <div className="flex gap-2">
                {count > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => marcarTodasLeidas.mutate()}
                  >
                    <CheckCheck className="w-4 h-4 mr-1" />
                    Marcar todas
                  </Button>
                )}
                <button onClick={() => setOpen(false)}>
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Lista de notificaciones */}
            <div className="flex-1 overflow-y-auto">
              {notificaciones.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                  <Bell className="w-16 h-16 mb-2" />
                  <p>No hay notificaciones pendientes</p>
                </div>
              ) : (
                <div className="divide-y">
                  {notificaciones.map((notif) => (
                    <div
                      key={notif.id}
                      className="p-4 hover:bg-gray-50 transition cursor-pointer"
                      onClick={() => {
                        marcarLeida.mutate(notif.id);
                        if (notif.accion_url) {
                          window.location.href = notif.accion_url;
                        }
                      }}
                    >
                      <div className="flex gap-3">
                        <div className={cn(
                          "w-2 h-2 rounded-full mt-2",
                          getPrioridadColor(notif.prioridad)
                        )} />
                        <div className="flex-1">
                          <h3 className="font-medium text-sm">{notif.titulo}</h3>
                          <p className="text-sm text-gray-600 mt-1">{notif.mensaje}</p>
                          <span className="text-xs text-gray-400 mt-2 block">
                            {new Date(notif.created_at).toLocaleString('es-AR')}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
```

#### 1.6 Integración con Alertas Existentes

**Modificar**: `supabase/functions/alertas-stock/index.ts`

Agregar al final del proceso de generación de alertas:

```typescript
// Crear notificación para usuarios admin y depósito
const { data: usuarios } = await supabase
  .from('personal')
  .select('user_id')
  .in('rol', ['admin', 'deposito'])
  .eq('activo', true);

for (const usuario of usuarios || []) {
  await supabase.from('notificaciones').insert({
    usuario_id: usuario.user_id,
    tipo: 'stock',
    prioridad: stockActual === 0 ? 'critica' : 'alta',
    titulo: `Stock bajo: ${producto.nombre}`,
    mensaje: `Quedan ${stockActual} unidades (mínimo: ${stockMinimo})`,
    metadata: {
      producto_id: producto.id,
      stock_actual: stockActual,
      stock_minimo: stockMinimo,
    },
    accion_url: `/productos/${producto.id}`,
  });
}
```

**Aplicar patrón similar** en:
- `alertas-vencimientos/index.ts`
- `cron-jobs-maxiconsumo/index.ts` (para alertas de precios)

#### 1.7 Tests Requeridos

**Archivo**: `supabase/functions/api-notificaciones/index.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { createClient } from '@supabase/supabase-js';

describe('API Notificaciones', () => {
  it('debe listar notificaciones no leídas del usuario', async () => {
    // Test implementation
  });

  it('debe marcar notificación como leída', async () => {
    // Test implementation
  });

  it('debe marcar todas como leídas', async () => {
    // Test implementation
  });

  it('NO debe permitir ver notificaciones de otro usuario (RLS)', async () => {
    // Test implementation
  });
});
```

#### 1.8 Criterios de Aceptación

- [ ] El ícono de campana muestra el contador correcto de notificaciones no leídas
- [ ] Las notificaciones críticas hacen pulsar el badge
- [ ] El panel se abre/cierra sin lag
- [ ] Las notificaciones se agrupan correctamente por prioridad
- [ ] Marcar como leída funciona instantáneamente (optimistic update)
- [ ] Auto-refresh cada 30s funciona sin interrumpir la interacción del usuario
- [ ] RLS impide que un usuario vea notificaciones de otro
- [ ] Se integra correctamente con alertas existentes (stock, vencimientos, precios)

---

### FASE 2: BÚSQUEDA GLOBAL (Cmd+K / Ctrl+K)

#### 2.1 Especificación Funcional

**Trigger**: `Ctrl+K` (Windows/Linux) o `⌘+K` (Mac)

**Comportamiento**:
- Modal central (600px ancho) con input de búsqueda
- Búsqueda en tiempo real (debounce 300ms)
- Resultados agrupados por tipo: Productos, Proveedores, Tareas
- Navegación con teclado: ↑↓ para mover, Enter para seleccionar, Esc para cerrar
- Muestra máximo 5 resultados por tipo
- Resalta coincidencias en el texto
- Guarda últimas búsquedas en localStorage (máx 5)

#### 2.2 Backend: Endpoint de Búsqueda Global

**Agregar a**: `supabase/functions/api-minimarket/index.ts`

```typescript
// GET /api-minimarket/search?q=texto&limit=5
if (req.method === 'GET' && pathname === '/search') {
  const query = url.searchParams.get('q') || '';
  const limit = parseInt(url.searchParams.get('limit') || '5');

  if (query.length < 2) {
    return respondFail('INVALID_INPUT', 'Query debe tener al menos 2 caracteres', 400);
  }

  // Búsqueda en productos
  const { data: productos } = await supabase
    .from('productos')
    .select('id, nombre, codigo_barras, categoria_id')
    .or(`nombre.ilike.%${query}%,codigo_barras.ilike.%${query}%`)
    .eq('activo', true)
    .limit(limit);

  // Búsqueda en proveedores
  const { data: proveedores } = await supabase
    .from('proveedores')
    .select('id, nombre, contacto')
    .ilike('nombre', `%${query}%`)
    .eq('activo', true)
    .limit(limit);

  // Búsqueda en tareas (solo título y descripción)
  const { data: tareas } = await supabase
    .from('tareas')
    .select('id, titulo, descripcion, estado')
    .or(`titulo.ilike.%${query}%,descripcion.ilike.%${query}%`)
    .in('estado', ['pendiente', 'en_progreso'])
    .limit(limit);

  return respondOk({
    query,
    resultados: {
      productos: productos || [],
      proveedores: proveedores || [],
      tareas: tareas || [],
    },
    total: (productos?.length || 0) + (proveedores?.length || 0) + (tareas?.length || 0),
  });
}
```

#### 2.3 Frontend: Componente de Búsqueda Global

**Archivo**: `frontend/src/components/common/GlobalSearch.tsx`

```typescript
import { useState, useEffect, useRef } from 'react';
import { Search, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { api } from '@/lib/api';

export const GlobalSearch = () => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  
  const debouncedQuery = useDebouncedValue(query, 300);

  // Cargar búsquedas recientes de localStorage
  useEffect(() => {
    const recent = localStorage.getItem('recent_searches');
    if (recent) {
      setRecentSearches(JSON.parse(recent));
    }
  }, []);

  // Atajo de teclado global
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Auto-focus input cuando se abre
  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  // Búsqueda automática
  useEffect(() => {
    if (debouncedQuery.length >= 2) {
      setLoading(true);
      api.get(`/search?q=${encodeURIComponent(debouncedQuery)}`)
        .then(data => {
          setResults(data.resultados);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    } else {
      setResults(null);
    }
  }, [debouncedQuery]);

  // Navegación con teclado
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      setOpen(false);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(i => Math.min(i + 1, getTotalResults() - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      selectResult(selectedIndex);
    }
  };

  const getTotalResults = () => {
    if (!results) return 0;
    return (results.productos?.length || 0) + 
           (results.proveedores?.length || 0) + 
           (results.tareas?.length || 0);
  };

  const selectResult = (index: number) => {
    // Implementar lógica de selección y navegación
    // Guardar en búsquedas recientes
    const updated = [query, ...recentSearches.filter(s => s !== query)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('recent_searches', JSON.stringify(updated));
    
    setOpen(false);
    setQuery('');
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50" 
        onClick={() => setOpen(false)}
      />

      {/* Modal */}
      <div className="relative w-full max-w-2xl bg-white rounded-lg shadow-2xl overflow-hidden">
        {/* Input de búsqueda */}
        <div className="flex items-center gap-3 p-4 border-b">
          <Search className="w-5 h-5 text-gray-400" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Buscar productos, proveedores, tareas..."
            className="flex-1 outline-none text-lg"
          />
          <kbd className="px-2 py-1 text-xs bg-gray-100 rounded">ESC</kbd>
        </div>

        {/* Resultados */}
        <div className="max-h-96 overflow-y-auto">
          {loading && (
            <div className="p-8 text-center text-gray-400">
              Buscando...
            </div>
          )}

          {!loading && query.length < 2 && (
            <div className="p-4">
              <h3 className="text-sm font-medium text-gray-500 mb-2">
                Búsquedas recientes
              </h3>
              {recentSearches.map((recent, i) => (
                <button
                  key={i}
                  onClick={() => setQuery(recent)}
                  className="flex items-center gap-2 w-full p-2 hover:bg-gray-50 rounded"
                >
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span>{recent}</span>
                </button>
              ))}
            </div>
          )}

          {!loading && results && (
            <>
              {results.productos?.length > 0 && (
                <div className="p-2">
                  <h3 className="px-2 py-1 text-xs font-semibold text-gray-500">
                    PRODUCTOS
                  </h3>
                  {results.productos.map((producto, i) => (
                    <button
                      key={producto.id}
                      onClick={() => navigate(`/productos/${producto.id}`)}
                      className="w-full p-2 hover:bg-blue-50 rounded text-left"
                    >
                      <div className="font-medium">{producto.nombre}</div>
                      <div className="text-sm text-gray-500">
                        {producto.codigo_barras}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Similar para proveedores y tareas */}
            </>
          )}

          {!loading && query.length >= 2 && getTotalResults() === 0 && (
            <div className="p-8 text-center text-gray-400">
              No se encontraron resultados para "{query}"
            </div>
          )}
        </div>

        {/* Footer con ayuda de teclado */}
        <div className="flex items-center justify-between p-2 border-t bg-gray-50 text-xs text-gray-500">
          <div className="flex gap-4">
            <span><kbd>↑↓</kbd> Navegar</span>
            <span><kbd>Enter</kbd> Seleccionar</span>
            <span><kbd>ESC</kbd> Cerrar</span>
          </div>
        </div>
      </div>
    </div>
  );
};
```

#### 2.4 Criterios de Aceptación

- [ ] Atajo de teclado Ctrl+K / ⌘+K funciona globalmente
- [ ] Búsqueda tiene debounce de 300ms (no hace request por cada tecla)
- [ ] Resultados se agrupan correctamente por tipo
- [ ] Navegación con teclado (↑↓ Enter ESC) funciona perfectamente
- [ ] Búsquedas recientes se guardan y muestran correctamente
- [ ] Resalta coincidencias en los resultados
- [ ] Funciona correctamente en móvil (sin atajo de teclado, solo botón)

---

### FASE 3: INDICADORES DE PRECIO INLINE

#### 3.1 Especificación Funcional

En la vista de **Productos** (tabla principal), agregar columna "Precio Proveedor" que muestra:
- Precio actual del proveedor
- Diferencia porcentual con precio de venta interno
- Badge de color: Verde si bajó, Rojo si subió, Gris si sin cambios
- Tooltip con fecha de última actualización

#### 3.2 Modificación de Vista SQL

**Crear nueva vista materializada**:

```sql
-- Migración: 20260207000002_vista_productos_con_precios.sql
CREATE MATERIALIZED VIEW productos_con_precios AS
SELECT 
  p.id,
  p.nombre,
  p.codigo_barras,
  p.categoria_id,
  c.nombre AS categoria_nombre,
  s.cantidad_actual AS stock_actual,
  s.stock_minimo,
  
  -- Precio interno actual
  (SELECT precio 
   FROM precios_historial 
   WHERE producto_id = p.id 
   ORDER BY fecha_desde DESC 
   LIMIT 1) AS precio_venta,
  
  -- Precio del proveedor actual
  pp.precio AS precio_proveedor,
  pp.fecha_actualizacion AS precio_proveedor_fecha,
  
  -- Cálculo de diferencia
  CASE 
    WHEN pp.precio IS NOT NULL AND 
         (SELECT precio FROM precios_historial WHERE producto_id = p.id ORDER BY fecha_desde DESC LIMIT 1) IS NOT NULL
    THEN ROUND(
      (((SELECT precio FROM precios_historial WHERE producto_id = p.id ORDER BY fecha_desde DESC LIMIT 1) - pp.precio) / pp.precio * 100)::numeric, 
      2
    )
    ELSE NULL
  END AS margen_porcentual,
  
  p.activo,
  p.created_at
FROM productos p
LEFT JOIN categorias c ON c.id = p.categoria_id
LEFT JOIN stock s ON s.producto_id = p.id
LEFT JOIN LATERAL (
  SELECT precio, fecha_actualizacion
  FROM precios_proveedor
  WHERE producto_id = p.id
  ORDER BY fecha_actualizacion DESC
  LIMIT 1
) pp ON true
WHERE p.activo = true;

-- Índice para optimizar consultas
CREATE INDEX idx_productos_con_precios_categoria 
  ON productos_con_precios(categoria_id);

-- Refresco automático cada 1 hora (ajustar según necesidad)
-- Se puede ejecutar manualmente con: REFRESH MATERIALIZED VIEW productos_con_precios;
```

**Agregar cron job** para refrescar vista:

```typescript
// supabase/functions/cron-refresh-views/index.ts
serve(async (req) => {
  try {
    await supabase.rpc('refresh_materialized_views');
    return respondOk({ refreshed: true });
  } catch (error) {
    logger.error('Error refrescando vistas', error);
    return respondFail('REFRESH_ERROR', error.message, 500);
  }
});
```

#### 3.3 Frontend: Componente de Badge de Precio

**Archivo**: `frontend/src/components/productos/PrecioProveedorBadge.tsx`

```typescript
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Tooltip } from '@/components/ui/tooltip';

interface Props {
  precioVenta: number | null;
  precioProveedor: number | null;
  fecha: string | null;
}

export const PrecioProveedorBadge = ({ precioVenta, precioProveedor, fecha }: Props) => {
  if (!precioProveedor) {
    return <span className="text-gray-400 text-sm">Sin dato</span>;
  }

  const diferencia = precioVenta && precioProveedor 
    ? ((precioVenta - precioProveedor) / precioProveedor) * 100 
    : 0;

  const getBadgeColor = () => {
    if (diferencia > 5) return 'bg-green-100 text-green-700 border-green-300';
    if (diferencia < -5) return 'bg-red-100 text-red-700 border-red-300';
    return 'bg-gray-100 text-gray-700 border-gray-300';
  };

  const getIcon = () => {
    if (diferencia > 5) return <TrendingUp className="w-3 h-3" />;
    if (diferencia < -5) return <TrendingDown className="w-3 h-3" />;
    return <Minus className="w-3 h-3" />;
  };

  return (
    <Tooltip content={`Actualizado: ${new Date(fecha).toLocaleString('es-AR')}`}>
      <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full border ${getBadgeColor()}`}>
        {getIcon()}
        <span className="text-xs font-medium">
          ${precioProveedor.toLocaleString('es-AR')}
        </span>
        {diferencia !== 0 && (
          <span className="text-xs">
            ({diferencia > 0 ? '+' : ''}{diferencia.toFixed(1)}%)
          </span>
        )}
      </div>
    </Tooltip>
  );
};
```

#### 3.4 Modificar Tabla de Productos

**Archivo**: `frontend/src/pages/Productos.tsx`

Agregar columna en la tabla:

```typescript
const columns = [
  { header: 'Nombre', accessor: 'nombre' },
  { header: 'Código', accessor: 'codigo_barras' },
  { header: 'Categoría', accessor: 'categoria_nombre' },
  { header: 'Stock', accessor: 'stock_actual' },
  { header: 'Precio Venta', accessor: 'precio_venta', 
    render: (row) => `$${row.precio_venta?.toLocaleString('es-AR')}` 
  },
  { 
    header: 'Precio Proveedor', 
    accessor: 'precio_proveedor',
    render: (row) => (
      <PrecioProveedorBadge 
        precioVenta={row.precio_venta}
        precioProveedor={row.precio_proveedor}
        fecha={row.precio_proveedor_fecha}
      />
    )
  },
  { header: 'Acciones', /* ... */ },
];
```

#### 3.5 Criterios de Aceptación

- [ ] La columna "Precio Proveedor" se muestra en la tabla de productos
- [ ] El badge muestra color correcto según diferencia de precio
- [ ] El tooltip muestra fecha de última actualización
- [ ] La vista materializada se refresca automáticamente cada hora
- [ ] Performance: la tabla carga en <500ms con 1000+ productos

---

### FASE 4: FLUJO EXPRESS DE DEPÓSITO

#### 4.1 Especificación Funcional

**Problema actual**: Registrar un ingreso de mercadería requiere 6 pasos:
1. Ir a página Depósito
2. Click en "Nuevo movimiento"
3. Seleccionar tipo: "Entrada"
4. Seleccionar motivo: "Compra proveedor"
5. Seleccionar producto
6. Ingresar cantidad
7. Click "Guardar"

**Solución propuesta**: Botón "Ingreso Rápido" que:
- Pre-selecciona tipo="Entrada" y motivo="Compra proveedor"
- Muestra solo: Selector de producto + Input de cantidad
- Al presionar Enter, se guarda y el formulario se resetea para el siguiente producto
- Permite ingresar 10+ productos en <2 minutos

#### 4.2 Frontend: Componente de Ingreso Rápido

**Archivo**: `frontend/src/components/deposito/IngresoRapido.tsx`

```typescript
import { useState } from 'react';
import { Plus, Check } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { toast } from '@/lib/toast';
import { ProductoSelector } from './ProductoSelector';

export const IngresoRapido = () => {
  const [open, setOpen] = useState(false);
  const [ingresosRealizados, setIngresosRealizados] = useState<any[]>([]);
  const queryClient = useQueryClient();
  
  const { register, handleSubmit, reset, setValue, watch } = useForm({
    defaultValues: {
      producto_id: '',
      cantidad: 1,
      proveedor_id: '',
    }
  });

  const mutation = useMutation({
    mutationFn: async (data) => {
      return api.post('/movimientos-deposito', {
        producto_id: data.producto_id,
        tipo: 'entrada',
        cantidad: data.cantidad,
        motivo: 'compra_proveedor',
        proveedor_id: data.proveedor_id || null,
      });
    },
    onSuccess: (data, variables) => {
      // Optimistic update
      setIngresosRealizados(prev => [...prev, {
        producto: variables.producto_nombre,
        cantidad: variables.cantidad,
        timestamp: new Date(),
      }]);
      
      toast.success(`✓ ${variables.cantidad} unidades de ${variables.producto_nombre} registradas`);
      
      // Resetear form para siguiente producto
      reset();
      
      // Invalidar stock
      queryClient.invalidateQueries(['stock']);
    },
  });

  const onSubmit = (data) => {
    mutation.mutate(data);
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
      >
        <Plus className="w-5 h-5" />
        Ingreso Rápido
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={() => setOpen(false)} />
      
      <div className="relative bg-white rounded-lg shadow-2xl p-6 w-full max-w-2xl">
        <h2 className="text-xl font-bold mb-4">Ingreso Rápido de Mercadería</h2>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Selector de producto */}
          <div>
            <label className="block text-sm font-medium mb-1">Producto</label>
            <ProductoSelector 
              onChange={(producto) => {
                setValue('producto_id', producto.id);
                setValue('producto_nombre', producto.nombre);
              }}
              autoFocus
            />
          </div>

          {/* Input de cantidad */}
          <div>
            <label className="block text-sm font-medium mb-1">Cantidad</label>
            <input
              type="number"
              {...register('cantidad', { required: true, min: 1 })}
              className="w-full px-3 py-2 border rounded-lg text-2xl font-bold text-center"
              autoFocus={watch('producto_id') !== ''}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSubmit(onSubmit)();
                }
              }}
            />
          </div>

          {/* Proveedor (opcional) */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Proveedor (opcional)
            </label>
            <select {...register('proveedor_id')} className="w-full px-3 py-2 border rounded-lg">
              <option value="">Sin proveedor específico</option>
              {/* Cargar proveedores desde API */}
            </select>
          </div>

          {/* Botones de acción */}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={mutation.isPending}
              className="flex-1 bg-green-500 text-white py-2 rounded-lg hover:bg-green-600 disabled:opacity-50"
            >
              {mutation.isPending ? 'Guardando...' : 'Guardar y Continuar (Enter)'}
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50"
            >
              Cerrar
            </button>
          </div>
        </form>

        {/* Lista de ingresos realizados en esta sesión */}
        {ingresosRealizados.length > 0 && (
          <div className="mt-6 pt-4 border-t">
            <h3 className="text-sm font-medium text-gray-700 mb-2">
              Ingresos realizados ({ingresosRealizados.length})
            </h3>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {ingresosRealizados.map((ingreso, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-gray-600">
                  <Check className="w-4 h-4 text-green-500" />
                  <span>{ingreso.cantidad}x {ingreso.producto}</span>
                  <span className="text-xs text-gray-400">
                    {ingreso.timestamp.toLocaleTimeString('es-AR')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
```

#### 4.3 Componente de Selector de Producto con Autocomplete

**Archivo**: `frontend/src/components/deposito/ProductoSelector.tsx`

```typescript
import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Search } from 'lucide-react';

interface Props {
  onChange: (producto: any) => void;
  autoFocus?: boolean;
}

export const ProductoSelector = ({ onChange, autoFocus }: Props) => {
  const [search, setSearch] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: productos } = useQuery({
    queryKey: ['productos', 'dropdown', search],
    queryFn: async () => {
      if (search.length < 2) return [];
      
      const { data } = await supabase
        .from('productos')
        .select('id, nombre, codigo_barras')
        .or(`nombre.ilike.%${search}%,codigo_barras.ilike.%${search}%`)
        .eq('activo', true)
        .limit(10);
      
      return data || [];
    },
    enabled: search.length >= 2,
  });

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          ref={inputRef}
          type="text"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setShowDropdown(true);
          }}
          onFocus={() => setShowDropdown(true)}
          placeholder="Buscar por nombre o código..."
          className="w-full pl-10 pr-3 py-2 border rounded-lg"
        />
      </div>

      {showDropdown && productos && productos.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {productos.map((producto) => (
            <button
              key={producto.id}
              type="button"
              onClick={() => {
                onChange(producto);
                setSearch(producto.nombre);
                setShowDropdown(false);
              }}
              className="w-full px-3 py-2 text-left hover:bg-blue-50 border-b last:border-0"
            >
              <div className="font-medium">{producto.nombre}</div>
              <div className="text-sm text-gray-500">{producto.codigo_barras}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
```

#### 4.4 Criterios de Aceptación

- [ ] El botón "Ingreso Rápido" está visible en la página Depósito
- [ ] El modal se abre instantáneamente
- [ ] Auto-focus en selector de producto al abrir
- [ ] Autocomplete funciona con 2+ caracteres
- [ ] Al seleccionar producto, focus pasa automáticamente a cantidad
- [ ] Presionar Enter guarda y resetea el formulario
- [ ] Lista de "Ingresos realizados" se actualiza en tiempo real
- [ ] No hay lag entre guardado y disponibilidad para próximo producto
- [ ] Tiempo total para ingresar 10 productos: <2 minutos

---

### FASE 5: PRODUCTOS DURMIENTES (INTELIGENCIA DE NEGOCIO)

#### 5.1 Especificación Funcional

**Definición**: Producto durmiente = sin movimientos (entradas/salidas) en los últimos N días (configurable: 30, 60, 90)

**Vista nueva**: Página "Análisis" con tabs:
- Productos durmientes
- Ranking de rentabilidad
- Oportunidades de compra

**Acciones sugeridas**:
- Aplicar descuento
- Dar de baja del catálogo
- Crear tarea de revisión

#### 5.2 Base de Datos

Ya creamos la vista materializada en FASE 1, ahora agregar función SQL:

```sql
-- Migración: 20260207000003_funcion_productos_durmientes.sql
CREATE OR REPLACE FUNCTION obtener_productos_durmientes(
  dias_inactividad INT DEFAULT 30
)
RETURNS TABLE (
  producto_id UUID,
  nombre TEXT,
  categoria TEXT,
  stock_actual INT,
  dias_sin_movimiento INT,
  valor_inventario NUMERIC,
  sugerencia TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.nombre,
    c.nombre AS categoria,
    s.cantidad_actual,
    CURRENT_DATE - COALESCE(
      (SELECT MAX(fecha) FROM movimientos_deposito WHERE producto_id = p.id),
      p.created_at::DATE
    ) AS dias_sin_movimiento,
    s.cantidad_actual * COALESCE(
      (SELECT precio FROM precios_historial WHERE producto_id = p.id ORDER BY fecha_desde DESC LIMIT 1),
      0
    ) AS valor_inventario,
    CASE 
      WHEN (CURRENT_DATE - COALESCE(
        (SELECT MAX(fecha) FROM movimientos_deposito WHERE producto_id = p.id),
        p.created_at::DATE
      )) > 90 THEN 'Considerar baja del catálogo'
      WHEN (CURRENT_DATE - COALESCE(
        (SELECT MAX(fecha) FROM movimientos_deposito WHERE producto_id = p.id),
        p.created_at::DATE
      )) > 60 THEN 'Aplicar descuento promocional'
      ELSE 'Monitorear rotación'
    END AS sugerencia
  FROM productos p
  LEFT JOIN categorias c ON c.id = p.categoria_id
  LEFT JOIN stock s ON s.producto_id = p.id
  WHERE p.activo = true
    AND (CURRENT_DATE - COALESCE(
      (SELECT MAX(fecha) FROM movimientos_deposito WHERE producto_id = p.id),
      p.created_at::DATE
    )) >= dias_inactividad
  ORDER BY dias_sin_movimiento DESC;
END;
$$ LANGUAGE plpgsql;
```

#### 5.3 Backend: Endpoint

**Agregar a**: `supabase/functions/api-minimarket/index.ts`

```typescript
// GET /api-minimarket/analytics/productos-durmientes?dias=30
if (req.method === 'GET' && pathname === '/analytics/productos-durmientes') {
  const dias = parseInt(url.searchParams.get('dias') || '30');
  
  const { data, error } = await supabase.rpc('obtener_productos_durmientes', {
    dias_inactividad: dias
  });

  if (error) throw error;

  return respondOk({
    productos: data,
    total: data.length,
    valor_total_inmovilizado: data.reduce((sum, p) => sum + parseFloat(p.valor_inventario || 0), 0),
    config: { dias_inactividad: dias },
  });
}
```

#### 5.4 Frontend: Página de Análisis

**Archivo**: `frontend/src/pages/Analisis.tsx`

```typescript
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { TrendingDown, DollarSign, Package } from 'lucide-react';

export const Analisis = () => {
  const [diasInactividad, setDiasInactividad] = useState(30);
  
  const { data, isLoading } = useQuery({
    queryKey: ['analytics', 'durmientes', diasInactividad],
    queryFn: () => api.get(`/analytics/productos-durmientes?dias=${diasInactividad}`),
  });

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Análisis de Inventario</h1>

      {/* Selector de período */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">Período de inactividad</label>
        <div className="flex gap-2">
          {[30, 60, 90].map(dias => (
            <button
              key={dias}
              onClick={() => setDiasInactividad(dias)}
              className={`px-4 py-2 rounded-lg border ${
                diasInactividad === dias 
                  ? 'bg-blue-500 text-white border-blue-500' 
                  : 'bg-white border-gray-300 hover:bg-gray-50'
              }`}
            >
              {dias} días
            </button>
          ))}
        </div>
      </div>

      {/* Métricas resumen */}
      {data && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg border">
            <div className="flex items-center gap-3">
              <Package className="w-8 h-8 text-orange-500" />
              <div>
                <div className="text-2xl font-bold">{data.total}</div>
                <div className="text-sm text-gray-600">Productos durmientes</div>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg border">
            <div className="flex items-center gap-3">
              <DollarSign className="w-8 h-8 text-red-500" />
              <div>
                <div className="text-2xl font-bold">
                  ${data.valor_total_inmovilizado?.toLocaleString('es-AR')}
                </div>
                <div className="text-sm text-gray-600">Capital inmovilizado</div>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg border">
            <div className="flex items-center gap-3">
              <TrendingDown className="w-8 h-8 text-yellow-500" />
              <div>
                <div className="text-2xl font-bold">
                  {Math.round(data.valor_total_inmovilizado / data.total)}
                </div>
                <div className="text-sm text-gray-600">Valor promedio/producto</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabla de productos durmientes */}
      {isLoading ? (
        <div className="text-center py-12">Cargando...</div>
      ) : (
        <div className="bg-white rounded-lg border overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium">Producto</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Categoría</th>
                <th className="px-4 py-3 text-right text-sm font-medium">Stock</th>
                <th className="px-4 py-3 text-right text-sm font-medium">Días sin movimiento</th>
                <th className="px-4 py-3 text-right text-sm font-medium">Valor inventario</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Sugerencia</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {data?.productos.map((producto) => (
                <tr key={producto.producto_id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">{producto.nombre}</td>
                  <td className="px-4 py-3 text-gray-600">{producto.categoria}</td>
                  <td className="px-4 py-3 text-right">{producto.stock_actual}</td>
                  <td className="px-4 py-3 text-right">
                    <span className={`
                      px-2 py-1 rounded-full text-xs font-medium
                      ${producto.dias_sin_movimiento > 90 
                        ? 'bg-red-100 text-red-700' 
                        : producto.dias_sin_movimiento > 60 
                          ? 'bg-orange-100 text-orange-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }
                    `}>
                      {producto.dias_sin_movimiento} días
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-medium">
                    ${producto.valor_inventario?.toLocaleString('es-AR')}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {producto.sugerencia}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
```

#### 5.5 Criterios de Aceptación

- [ ] La página "Análisis" es accesible desde el menú lateral
- [ ] Selector de período (30/60/90 días) funciona correctamente
- [ ] Métricas resumen se calculan correctamente
- [ ] Tabla muestra productos ordenados por días sin movimiento (desc)
- [ ] Sugerencias son relevantes según días de inactividad
- [ ] Performance: carga en <1s con 10,000+ productos en BD

---

### FASE 6: IMPORTACIÓN CSV DE MOVIMIENTOS

#### 6.1 Especificación Funcional

**Caso de uso**: El dueño recibe una factura de proveedor con 50 productos. En vez de cargarlos uno por uno, sube un CSV.

**Formato CSV esperado**:
```csv
codigo_barras,cantidad,precio_unitario,proveedor
7790001234567,24,1250.50,Maxiconsumo
7790009876543,12,890.00,Maxiconsumo
```

**Proceso**:
1. Usuario sube archivo CSV
2. Sistema valida formato y existencia de productos
3. Muestra preview de movimientos a crear
4. Usuario confirma
5. Sistema crea batch de movimientos

#### 6.2 Backend: Endpoint de Importación

**Agregar a**: `supabase/functions/api-minimarket/index.ts`

```typescript
// POST /api-minimarket/movimientos/import-csv
if (req.method === 'POST' && pathname === '/movimientos/import-csv') {
  const body = await req.json();
  const { csv_data, proveedor_id, tipo } = body;

  // Parsear CSV
  const rows = csv_data.split('\n').slice(1); // Skip header
  const movimientos = [];
  const errores = [];

  for (let i = 0; i < rows.length; i++) {
    const [codigo_barras, cantidad, precio_unitario, proveedor_nombre] = rows[i].split(',');
    
    // Validar existencia de producto
    const { data: producto } = await supabase
      .from('productos')
      .select('id, nombre')
      .eq('codigo_barras', codigo_barras.trim())
      .single();

    if (!producto) {
      errores.push({
        linea: i + 2,
        error: `Producto con código ${codigo_barras} no existe`,
      });
      continue;
    }

    movimientos.push({
      producto_id: producto.id,
      producto_nombre: producto.nombre,
      tipo: tipo || 'entrada',
      cantidad: parseInt(cantidad),
      motivo: 'compra_proveedor',
      proveedor_id: proveedor_id || null,
      precio_unitario: parseFloat(precio_unitario) || null,
    });
  }

  return respondOk({
    movimientos_validos: movimientos,
    total_validos: movimientos.length,
    errores,
    total_errores: errores.length,
  });
}

// POST /api-minimarket/movimientos/batch-create
if (req.method === 'POST' && pathname === '/movimientos/batch-create') {
  const body = await req.json();
  const { movimientos } = body;

  const insertados = [];
  const fallidos = [];

  for (const mov of movimientos) {
    try {
      const { data, error } = await supabase
        .from('movimientos_deposito')
        .insert({
          producto_id: mov.producto_id,
          tipo: mov.tipo,
          cantidad: mov.cantidad,
          motivo: mov.motivo,
          proveedor_id: mov.proveedor_id,
          usuario_id: user.id,
          fecha: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      // Actualizar stock
      if (mov.tipo === 'entrada') {
        await supabase.rpc('incrementar_stock', {
          p_producto_id: mov.producto_id,
          p_cantidad: mov.cantidad,
        });
      } else {
        await supabase.rpc('decrementar_stock', {
          p_producto_id: mov.producto_id,
          p_cantidad: mov.cantidad,
        });
      }

      insertados.push(data);
    } catch (error) {
      fallidos.push({
        producto: mov.producto_nombre,
        error: error.message,
      });
    }
  }

  return respondOk({
    insertados: insertados.length,
    fallidos: fallidos.length,
    detalles_fallidos: fallidos,
  });
}
```

#### 6.3 Frontend: Componente de Importación

**Archivo**: `frontend/src/components/deposito/ImportarCSV.tsx`

```typescript
import { useState } from 'react';
import { Upload, AlertCircle, CheckCircle } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';

export const ImportarCSV = () => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState(null);

  const validarMutation = useMutation({
    mutationFn: async (csvData: string) => {
      return api.post('/movimientos/import-csv', {
        csv_data: csvData,
        tipo: 'entrada',
      });
    },
    onSuccess: (data) => {
      setPreview(data);
    },
  });

  const crearMutation = useMutation({
    mutationFn: async () => {
      return api.post('/movimientos/batch-create', {
        movimientos: preview.movimientos_validos,
      });
    },
    onSuccess: (data) => {
      toast.success(`✓ ${data.insertados} movimientos creados`);
      if (data.fallidos > 0) {
        toast.warning(`⚠ ${data.fallidos} movimientos fallaron`);
      }
      setFile(null);
      setPreview(null);
    },
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    const text = await selectedFile.text();
    validarMutation.mutate(text);
  };

  return (
    <div className="bg-white p-6 rounded-lg border">
      <h3 className="text-lg font-semibold mb-4">Importar Movimientos desde CSV</h3>

      {/* Upload area */}
      <div className="mb-4">
        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
          <Upload className="w-8 h-8 text-gray-400 mb-2" />
          <span className="text-sm text-gray-600">
            {file ? file.name : 'Seleccionar archivo CSV'}
          </span>
          <input
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="hidden"
          />
        </label>
        <a 
          href="/templates/movimientos_template.csv" 
          download
          className="text-xs text-blue-500 hover:underline mt-2 inline-block"
        >
          Descargar plantilla CSV
        </a>
      </div>

      {/* Preview de validación */}
      {preview && (
        <div className="space-y-4">
          {/* Resumen */}
          <div className="flex gap-4">
            <div className="flex-1 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="font-medium">{preview.total_validos} válidos</span>
              </div>
            </div>
            {preview.total_errores > 0 && (
              <div className="flex-1 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  <span className="font-medium">{preview.total_errores} errores</span>
                </div>
              </div>
            )}
          </div>

          {/* Tabla de preview */}
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-3 py-2 text-left">Producto</th>
                  <th className="px-3 py-2 text-right">Cantidad</th>
                  <th className="px-3 py-2 text-left">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {preview.movimientos_validos.map((mov, i) => (
                  <tr key={i}>
                    <td className="px-3 py-2">{mov.producto_nombre}</td>
                    <td className="px-3 py-2 text-right">{mov.cantidad}</td>
                    <td className="px-3 py-2">
                      <span className="text-green-600">✓ OK</span>
                    </td>
                  </tr>
                ))}
                {preview.errores.map((err, i) => (
                  <tr key={`err-${i}`} className="bg-red-50">
                    <td className="px-3 py-2 text-red-600" colSpan={2}>
                      Línea {err.linea}: {err.error}
                    </td>
                    <td className="px-3 py-2">
                      <span className="text-red-600">✗ Error</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Botón de confirmación */}
          <button
            onClick={() => crearMutation.mutate()}
            disabled={preview.total_validos === 0 || crearMutation.isPending}
            className="w-full py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
          >
            {crearMutation.isPending 
              ? 'Creando movimientos...' 
              : `Confirmar y crear ${preview.total_validos} movimientos`
            }
          </button>
        </div>
      )}
    </div>
  );
};
```

#### 6.4 Template CSV

**Archivo público**: `frontend/public/templates/movimientos_template.csv`

```csv
codigo_barras,cantidad,precio_unitario,proveedor
7790001234567,24,1250.50,Maxiconsumo
7790009876543,12,890.00,Maxiconsumo
```

#### 6.5 Criterios de Aceptación

- [ ] Usuario puede descargar template CSV
- [ ] Sistema valida formato CSV correctamente
- [ ] Productos inexistentes se reportan como errores
- [ ] Preview muestra claramente válidos vs errores
- [ ] Batch creation funciona correctamente
- [ ] Stock se actualiza para todos los productos
- [ ] Performance: procesa 100 productos en <5 segundos

---

### FASE 7: LOADING STATES Y OPTIMISTIC UPDATES

#### 7.1 Especificación Funcional

**Problema**: Actualmente, el usuario ve spinners genéricos o pantallas en blanco mientras carga.

**Solución**: Implementar:
- **Loading skeletons**: Placeholders con forma de contenido real
- **Optimistic updates**: Mostrar cambio inmediatamente, revertir si falla
- **Streaming indicators**: Barras de progreso para operaciones largas

#### 7.2 Componentes de Loading Skeletons

**Archivo**: `frontend/src/components/common/Skeletons.tsx`

```typescript
export const ProductoRowSkeleton = () => (
  <tr className="animate-pulse">
    <td className="px-4 py-3">
      <div className="h-4 bg-gray-200 rounded w-48"></div>
    </td>
    <td className="px-4 py-3">
      <div className="h-4 bg-gray-200 rounded w-24"></div>
    </td>
    <td className="px-4 py-3">
      <div className="h-4 bg-gray-200 rounded w-32"></div>
    </td>
    <td className="px-4 py-3">
      <div className="h-4 bg-gray-200 rounded w-16"></div>
    </td>
  </tr>
);

export const TableSkeleton = ({ rows = 5 }: { rows?: number }) => (
  <div className="bg-white rounded-lg border overflow-hidden">
    <table className="w-full">
      <thead className="bg-gray-50 border-b">
        <tr>
          <th className="px-4 py-3"><div className="h-4 bg-gray-300 rounded w-24"></div></th>
          <th className="px-4 py-3"><div className="h-4 bg-gray-300 rounded w-32"></div></th>
          <th className="px-4 py-3"><div className="h-4 bg-gray-300 rounded w-20"></div></th>
        </tr>
      </thead>
      <tbody>
        {Array.from({ length: rows }).map((_, i) => (
          <ProductoRowSkeleton key={i} />
        ))}
      </tbody>
    </table>
  </div>
);

export const DashboardCardSkeleton = () => (
  <div className="bg-white p-6 rounded-lg border animate-pulse">
    <div className="h-8 bg-gray-200 rounded w-32 mb-4"></div>
    <div className="h-12 bg-gray-300 rounded w-24"></div>
  </div>
);
```

#### 7.3 Implementar en Páginas

**Modificar**: `frontend/src/pages/Productos.tsx`

```typescript
import { TableSkeleton } from '@/components/common/Skeletons';

export const Productos = () => {
  const { data: productos, isLoading } = useProductos();

  if (isLoading) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Productos</h1>
        <TableSkeleton rows={10} />
      </div>
    );
  }

  return (
    // ... resto del componente
  );
};
```

#### 7.4 Optimistic Updates en Mutaciones

**Patrón estándar** para todas las mutaciones:

```typescript
const crearTareaMutation = useMutation({
  mutationFn: (nuevaTarea) => api.post('/tareas', nuevaTarea),
  
  // Optimistic update
  onMutate: async (nuevaTarea) => {
    // Cancelar queries en progreso
    await queryClient.cancelQueries(['tareas']);
    
    // Snapshot del estado anterior (para rollback)
    const previousTareas = queryClient.getQueryData(['tareas']);
    
    // Update optimista
    queryClient.setQueryData(['tareas'], (old) => [
      ...old,
      {
        ...nuevaTarea,
        id: `temp-${Date.now()}`,
        estado: 'pendiente',
        created_at: new Date().toISOString(),
      },
    ]);
    
    return { previousTareas };
  },
  
  // Si falla, rollback
  onError: (err, nuevaTarea, context) => {
    queryClient.setQueryData(['tareas'], context.previousTareas);
    toast.error('Error al crear tarea');
  },
  
  // Al finalizar, refrescar
  onSettled: () => {
    queryClient.invalidateQueries(['tareas']);
  },
});
```

#### 7.5 Progress Bar para Operaciones Largas

**Archivo**: `frontend/src/components/common/ProgressBar.tsx`

```typescript
import { useEffect, useState } from 'react';

export const ProgressBar = ({ 
  total, 
  current, 
  label 
}: { 
  total: number; 
  current: number; 
  label?: string;
}) => {
  const percentage = Math.round((current / total) * 100);

  return (
    <div className="w-full">
      {label && (
        <div className="flex justify-between text-sm mb-1">
          <span>{label}</span>
          <span className="text-gray-500">{current}/{total} ({percentage}%)</span>
        </div>
      )}
      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
        <div 
          className="bg-blue-500 h-full transition-all duration-300 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
```

**Usar en importación batch**:

```typescript
const [progress, setProgress] = useState({ current: 0, total: 0 });

const procesarLote = async (movimientos) => {
  setProgress({ current: 0, total: movimientos.length });
  
  for (let i = 0; i < movimientos.length; i++) {
    await crearMovimiento(movimientos[i]);
    setProgress(prev => ({ ...prev, current: i + 1 }));
  }
};

// En el render:
{progress.total > 0 && (
  <ProgressBar 
    current={progress.current} 
    total={progress.total}
    label="Procesando movimientos"
  />
)}
```

#### 7.6 Criterios de Aceptación

- [ ] Todas las tablas muestran skeletons mientras cargan (no spinner vacío)
- [ ] Skeletons tienen la misma estructura que el contenido real
- [ ] Mutaciones críticas usan optimistic updates
- [ ] Si una mutación falla, el rollback es instantáneo
- [ ] Operaciones batch muestran progress bar
- [ ] No hay flashes de contenido vacío al navegar

---

### FASE 8: TESTING Y DOCUMENTACIÓN

#### 8.1 Tests de Integración Nuevos

**Archivo**: `tests/integration/nuevas-funcionalidades.test.ts`

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { createClient } from '@supabase/supabase-js';

describe('Centro de Notificaciones', () => {
  let supabase;
  let testUserId;

  beforeEach(async () => {
    // Setup
  });

  it('debe crear notificación cuando producto baja de stock mínimo', async () => {
    // Simular producto con stock bajo
    // Verificar que se creó notificación
  });

  it('debe marcar notificación como leída correctamente', async () => {
    // Test
  });

  it('RLS: usuario no debe ver notificaciones de otro usuario', async () => {
    // Test de seguridad
  });
});

describe('Búsqueda Global', () => {
  it('debe buscar en productos, proveedores y tareas', async () => {
    // Test
  });

  it('debe limitar resultados a 5 por tipo', async () => {
    // Test
  });
});

describe('Productos Durmientes', () => {
  it('debe identificar productos sin movimientos en N días', async () => {
    // Test
  });

  it('debe calcular valor total inmovilizado correctamente', async () => {
    // Test
  });
});

describe('Importación CSV', () => {
  it('debe validar formato CSV correctamente', async () => {
    // Test
  });

  it('debe reportar productos inexistentes como errores', async () => {
    // Test
  });

  it('debe crear batch de movimientos correctamente', async () => {
    // Test
  });
});
```

#### 8.2 Documentación a Actualizar

**Actualizar**: `docs/ARCHITECTURE_DOCUMENTATION.md`

Agregar sección:

```markdown
## Nuevas Funcionalidades (Feb 2026)

### Centro de Notificaciones Unificado
- **Ubicación**: Header global
- **Tecnología**: React Query con refetch interval 30s
- **Base de datos**: Tabla `notificaciones` con RLS
- **Edge Function**: `api-notificaciones`

### Búsqueda Global
- **Trigger**: Ctrl+K / ⌘+K
- **Backend**: Endpoint `/search` en `api-minimarket`
- **Scope**: Productos, Proveedores, Tareas
- **Persistencia**: LocalStorage para búsquedas recientes

### Análisis de Inventario
- **Funciones SQL**: `obtener_productos_durmientes(dias INT)`
- **Vista materializada**: `productos_con_precios`
- **Refresh**: Automático cada 1 hora via cron

### Importación CSV
- **Formato**: codigo_barras, cantidad, precio_unitario, proveedor
- **Validación**: Server-side en Edge Function
- **Batch processing**: Progress bar con streaming updates
```

**Actualizar**: `docs/API_README.md`

Agregar endpoints:

```markdown
### Notificaciones

#### GET /api-notificaciones/unread
Obtiene notificaciones no leídas del usuario autenticado.

**Response**:
```json
{
  "success": true,
  "data": {
    "notificaciones": [...],
    "count": 5,
    "criticas": 2
  }
}
```

#### POST /api-notificaciones/:id/mark-read
Marca una notificación como leída.

#### POST /api-notificaciones/mark-all-read
Marca todas las notificaciones del usuario como leídas.

### Búsqueda Global

#### GET /api-minimarket/search?q=texto&limit=5
Búsqueda global en productos, proveedores y tareas.

**Query params**:
- `q`: Texto de búsqueda (mínimo 2 caracteres)
- `limit`: Resultados máximos por tipo (default: 5)

### Analytics

#### GET /api-minimarket/analytics/productos-durmientes?dias=30
Obtiene productos sin movimientos en los últimos N días.

**Query params**:
- `dias`: Días de inactividad (default: 30)

### Movimientos

#### POST /api-minimarket/movimientos/import-csv
Valida un archivo CSV de movimientos.

**Request body**:
```json
{
  "csv_data": "codigo_barras,cantidad,...",
  "tipo": "entrada"
}
```

#### POST /api-minimarket/movimientos/batch-create
Crea múltiples movimientos en batch.
```

#### 8.3 Actualizar README Principal

**Archivo**: `README.md`

Agregar sección "Novedades Feb 2026":

```markdown
## 🆕 Novedades (Febrero 2026)

### ✨ Mejoras de UX
- **Centro de Notificaciones**: Todas las alertas en un solo lugar, accesible desde el header
- **Búsqueda Global (Ctrl+K)**: Encuentra productos, proveedores y tareas instantáneamente
- **Ingreso Rápido**: Registra múltiples productos en depósito en <2 minutos
- **Loading Skeletons**: Mejor percepción de velocidad con placeholders animados

### 📊 Inteligencia de Negocio
- **Productos Durmientes**: Detecta automáticamente productos sin rotación
- **Indicadores de Precio**: Ve precios de proveedor directamente en la lista de productos
- **Análisis de Inventario**: Identifica capital inmovilizado y oportunidades

### 🚀 Productividad
- **Importación CSV**: Carga lotes de movimientos desde Excel/CSV
- **Optimistic Updates**: Cambios instantáneos en la UI
- **Navegación con teclado**: Atajos para operaciones frecuentes
```

#### 8.4 Checklist de Cierre

**Crear**: `docs/CHECKLIST_IMPLEMENTACION_MEJORAS_UX.md`

```markdown
# Checklist de Implementación - Mejoras UX Feb 2026

## Pre-implementación
- [ ] Crear branch `feature/ux-improvements` desde `main`
- [ ] Verificar que todos los tests actuales pasan
- [ ] Backup de base de datos de producción
- [ ] Notificar al equipo sobre cambios planificados

## Fase 1: Centro de Notificaciones
- [ ] Migración: `20260207000001_crear_tabla_notificaciones.sql` ejecutada
- [ ] RLS policies verificadas y activas
- [ ] Edge Function `api-notificaciones` desplegada
- [ ] Hook `useNotificaciones` implementado
- [ ] Componente `NotificationCenter` integrado en Header
- [ ] Integración con alertas existentes (stock, vencimientos, precios)
- [ ] Tests de integración pasando
- [ ] Documentación actualizada

## Fase 2: Búsqueda Global
- [ ] Endpoint `/search` agregado a `api-minimarket`
- [ ] Componente `GlobalSearch` implementado
- [ ] Atajo Ctrl+K/⌘+K funcionando
- [ ] LocalStorage de búsquedas recientes operativo
- [ ] Tests de integración pasando

## Fase 3: Indicadores de Precio
- [ ] Migración: `20260207000002_vista_productos_con_precios.sql` ejecutada
- [ ] Vista materializada `productos_con_precios` creada
- [ ] Cron job de refresh de vistas desplegado
- [ ] Componente `PrecioProveedorBadge` implementado
- [ ] Tabla de productos actualizada con nueva columna
- [ ] Performance verificada (<500ms con 1000+ productos)

## Fase 4: Flujo Express Depósito
- [ ] Componente `IngresoRapido` implementado
- [ ] Componente `ProductoSelector` con autocomplete funcionando
- [ ] Integración en página Depósito completa
- [ ] Test de usabilidad: 10 productos en <2 minutos

## Fase 5: Productos Durmientes
- [ ] Migración: `20260207000003_funcion_productos_durmientes.sql` ejecutada
- [ ] Función SQL `obtener_productos_durmientes` creada
- [ ] Endpoint `/analytics/productos-durmientes` agregado
- [ ] Página `Analisis.tsx` implementada
- [ ] Agregada al menú lateral
- [ ] Tests de integración pasando

## Fase 6: Importación CSV
- [ ] Endpoints `/movimientos/import-csv` y `/batch-create` agregados
- [ ] Componente `ImportarCSV` implementado
- [ ] Template CSV público disponible
- [ ] Validación de formato funcionando
- [ ] Batch processing con progress bar operativo
- [ ] Test de performance: 100 productos en <5s

## Fase 7: Loading States
- [ ] Componentes de Skeletons implementados
- [ ] Todas las páginas principales actualizadas con skeletons
- [ ] Optimistic updates en mutaciones críticas
- [ ] Componente `ProgressBar` implementado
- [ ] Sin flashes de contenido vacío al navegar

## Fase 8: Testing y Documentación
- [ ] Suite de tests de integración completa
- [ ] Cobertura de código >70%
- [ ] `ARCHITECTURE_DOCUMENTATION.md` actualizado
- [ ] `API_README.md` actualizado
- [ ] `README.md` actualizado con novedades
- [ ] Decision log actualizado

## Post-implementación
- [ ] Merge a `main` con revisión de código
- [ ] Deploy a staging para QA
- [ ] Testing manual por usuario final
- [ ] Deploy a producción
- [ ] Monitoreo de errores post-deploy (24h)
- [ ] Retrospectiva del equipo
```

---

## 📅 PLAN DE IMPLEMENTACIÓN SUGERIDO

### Cronograma Estimado (6-8 semanas)

```
Semana 1-2: FASE 1 + FASE 2
├── Días 1-3: Centro de Notificaciones (backend + frontend)
├── Días 4-5: Tests y ajustes
├── Días 6-8: Búsqueda Global (backend + frontend)
└── Días 9-10: Tests, documentación, revisión

Semana 3-4: FASE 3 + FASE 4
├── Días 1-2: Vista materializada y badges de precio
├── Días 3-4: Tests y optimización
├── Días 5-7: Flujo express de depósito
└── Días 8-10: Tests de usabilidad, ajustes

Semana 5-6: FASE 5 + FASE 6
├── Días 1-3: Productos durmientes (SQL + UI)
├── Días 4-5: Tests y validación
├── Días 6-8: Importación CSV
└── Días 9-10: Tests de performance

Semana 7-8: FASE 7 + FASE 8 + Cierre
├── Días 1-4: Loading states y optimistic updates
├── Días 5-7: Suite completa de tests
├── Días 8-9: Documentación y checklist
└── Día 10: Revisión final y preparación para deploy
```

### Dependencias entre Fases

```
FASE 1 (Notificaciones) → Independiente, se puede hacer primero
FASE 2 (Búsqueda) → Independiente, se puede hacer en paralelo con FASE 1
FASE 3 (Precios inline) → Depende de vista materializada (nueva)
FASE 4 (Ingreso rápido) → Depende de FASE 2 (ProductoSelector)
FASE 5 (Durmientes) → Independiente, requiere función SQL nueva
FASE 6 (CSV) → Depende parcialmente de FASE 4 (lógica de batch)
FASE 7 (Loading) → Afecta todas las fases anteriores (cross-cutting)
FASE 8 (Testing) → Requiere todas las fases completas
```

### Estrategia de Rollout

1. **Desarrollo incremental**: Cada fase se mergea a `feature/ux-improvements` al completarse
2. **Feature flags**: Activar funcionalidades gradualmente en producción
3. **Beta testing**: Grupo pequeño de usuarios prueba primero
4. **Monitoreo**: Métricas de uso y errores en tiempo real
5. **Rollback plan**: Capacidad de desactivar features sin redeploy

---

## 🎯 MÉTRICAS DE ÉXITO

### KPIs por Fase

| Fase | Métrica | Baseline | Objetivo |
|---|---|---|---|
| **FASE 1** | % alertas accionadas | - | >60% |
| **FASE 2** | % sesiones con búsqueda global | - | >40% |
| **FASE 3** | Decisiones de precio/día | 5 | 15 |
| **FASE 4** | Tiempo promedio ingreso depósito | 60s | <30s |
| **FASE 5** | Capital inmovilizado identificado | - | >10% inventario |
| **FASE 6** | % ingresos vía CSV | 0% | >20% |
| **FASE 7** | Perceived loading time | - | <1s |
| **GLOBAL** | Satisfacción usuario (NPS) | - | >8/10 |

### Instrumentación Requerida

```typescript
// Agregar a todas las funcionalidades nuevas
const trackEvent = (event: string, properties?: any) => {
  // Implementar analytics (ej: PostHog, Mixpanel, o custom)
  console.log('[Analytics]', event, properties);
  
  // Ejemplo:
  // posthog.capture(event, properties);
};

// Uso:
trackEvent('notificacion_click', { tipo: 'stock', prioridad: 'critica' });
trackEvent('busqueda_global_uso', { query: 'lacteos', resultados: 5 });
trackEvent('ingreso_rapido_completado', { productos: 10, tiempo_total_segundos: 87 });
```

---

## 🚨 CONSIDERACIONES CRÍTICAS

### Seguridad

- [ ] Todas las nuevas tablas tienen RLS habilitado
- [ ] Nuevos endpoints validan JWT
- [ ] Importación CSV valida tamaño de archivo (<5MB)
- [ ] Rate limiting en endpoints de búsqueda y analytics
- [ ] Sanitización de inputs en búsqueda global

### Performance

- [ ] Vistas materializadas se refrescan en horarios de baja carga
- [ ] Búsqueda global tiene índices en tablas relevantes
- [ ] Importación CSV procesa en chunks (no todo en memoria)
- [ ] Notificaciones usan paginación si >100 items
- [ ] Cache de React Query configurado apropiadamente

### UX

- [ ] Todos los estados de carga son informativos
- [ ] Errores muestran mensajes accionables
- [ ] Confirmaciones antes de acciones destructivas
- [ ] Tooltips explican iconografía
- [ ] Responsive design en móvil/tablet

### Compatibilidad

- [ ] Funciona en Chrome, Firefox, Safari, Edge (últimas 2 versiones)
- [ ] Degradación elegante si Service Worker no disponible
- [ ] Fallback si Web APIs no soportadas (ej: BarcodeDetector)

---

## 📝 INSTRUCCIONES PARA EL AGENTE

### 1. Verificación Inicial

```bash
# ACCIÓN 1: Clonar repositorio y verificar estructura
git clone <repo_url>
cd <repo_name>

# ACCIÓN 2: Verificar archivos críticos existen
ls -la supabase/functions/
ls -la frontend/src/pages/
ls -la docs/

# ACCIÓN 3: Listar endpoints actuales
grep -r "serve(async" supabase/functions/*/index.ts

# ACCIÓN 4: Contar tests actuales
npm test -- --reporter=verbose
```

### 2. Planificación de Implementación

```markdown
# ACCIÓN: Generar plan detallado

1. Analizar este documento completo
2. Verificar cada "ACCIÓN AGENTE" mencionada
3. Crear cronograma detallado día por día
4. Identificar bloqueos y dependencias
5. Priorizar según impacto/esfuerzo
6. Generar checklist de tareas atómicas
7. Proponer orden de implementación óptimo
```

### 3. Generación de Código

```markdown
# ACCIÓN: Implementar fase por fase

Para cada FASE:
1. Crear migración SQL si aplica
2. Implementar Edge Function si aplica
3. Crear hook React Query
4. Implementar componente UI
5. Escribir tests (unit + integration)
6. Actualizar documentación
7. Marcar items en checklist
8. Commit con mensaje descriptivo: "feat(fase-N): descripción"
```

### 4. Testing

```markdown
# ACCIÓN: Ejecutar suite completa

1. Tests unitarios: `npm test`
2. Tests de integración: `npm run test:integration`
3. Tests E2E: `npm run test:e2e`
4. Verificar cobertura: `npm run test:coverage`
5. Lint: `npm run lint`
6. Type check: `npm run typecheck`
```

### 5. Documentación

```markdown
# ACCIÓN: Actualizar docs

1. Actualizar ARCHITECTURE_DOCUMENTATION.md
2. Actualizar API_README.md
3. Actualizar README.md
4. Crear/actualizar DECISION_LOG.md
5. Completar CHECKLIST_IMPLEMENTACION_MEJORAS_UX.md
```

### 6. Deploy

```markdown
# ACCIÓN: Preparar para producción

1. Ejecutar migraciones en Supabase (staging primero)
2. Deploy Edge Functions: `supabase functions deploy <nombre>`
3. Deploy frontend: `npm run build && npm run deploy`
4. Verificar en staging
5. Smoke tests en staging
6. Deploy a producción
7. Monitorear logs por 24h
```

---

## 🔄 ROLLBACK PLAN

### Si algo falla en producción:

```markdown
# PLAN A: Rollback de Edge Functions
supabase functions deploy <nombre> --version <version-anterior>

# PLAN B: Desactivar features via Feature Flags
UPDATE feature_flags SET enabled = false WHERE name = '<feature>';

# PLAN C: Rollback de migraciones
-- Crear migraciones de rollback para cada migración nueva
-- Ejecutar en orden inverso

# PLAN D: Rollback completo de frontend
git revert <commit>
npm run build && npm run deploy
```

---

## ✅ CHECKLIST FINAL ANTES DE ENTREGAR

- [ ] Todas las 8 fases implementadas y testeadas
- [ ] Cobertura de tests >70%
- [ ] 0 errores en lint y typecheck
- [ ] Documentación actualizada
- [ ] Decision log actualizado con rationale de decisiones técnicas
- [ ] CHECKLIST_IMPLEMENTACION_MEJORAS_UX.md 100% completo
- [ ] Deploy exitoso en staging
- [ ] QA manual realizado
- [ ] Performance verificada (métricas de éxito alcanzadas)
- [ ] Rollback plan probado
- [ ] Equipo capacitado en nuevas funcionalidades

---

## 📞 CONTACTO Y SOPORTE

**Para el agente de implementación:**

Si encuentras inconsistencias entre este plan y el código real:
1. Documenta la discrepancia en `GAPS_ENCONTRADOS.md`
2. Propone solución alternativa
3. Actualiza este plan con la realidad del código
4. Continúa con la implementación

**No asumas, verifica siempre contra el código real.**

---

**FIN DEL DOCUMENTO**

Última actualización: 2026-02-07
Versión: 1.0.0
Autor: Sistema de Análisis UX
Estado: LISTO PARA IMPLEMENTACIÓN
