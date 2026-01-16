import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Producto, Proveedor } from '../types/database'
import { TrendingDown, TrendingUp, Percent, Search, Filter, Banknote } from 'lucide-react'

interface ProductoRentabilidad extends Producto {
  proveedor?: Proveedor
  utilidad_unitaria: number
  margen_bruto: number
  margen_pct: number | null
}

type SortKey = 'margen' | 'utilidad' | 'nombre'

export default function Rentabilidad() {
  const [productos, setProductos] = useState<ProductoRentabilidad[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [categoria, setCategoria] = useState('')
  const [proveedorId, setProveedorId] = useState('')
  const [minMargen, setMinMargen] = useState(15)
  const [showNegativos, setShowNegativos] = useState(true)
  const [sortKey, setSortKey] = useState<SortKey>('margen')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  useEffect(() => {
    loadRentabilidad()
  }, [])

  async function loadRentabilidad() {
    try {
      setLoading(true)
      setError(null)

      const { data: productosData, error: productosError } = await supabase
        .from('productos')
        .select('id,nombre,categoria,codigo_barras,precio_actual,precio_costo,proveedor_principal_id,margen_ganancia,activo,created_at,updated_at')
        .eq('activo', true)
        .order('nombre')

      if (productosError) throw productosError

      const proveedorIds = Array.from(
        new Set(
          (productosData || [])
            .map((prod) => prod.proveedor_principal_id)
            .filter((id): id is string => Boolean(id))
        )
      )

      let proveedoresMap: Record<string, Proveedor> = {}
      if (proveedorIds.length > 0) {
        const { data: proveedoresData, error: proveedoresError } = await supabase
          .from('proveedores')
          .select('id,nombre,contacto,email,telefono,productos_ofrecidos,activo,created_at,updated_at')
          .in('id', proveedorIds)
          .eq('activo', true)

        if (proveedoresError) throw proveedoresError

        proveedoresMap = Object.fromEntries(
          (proveedoresData || []).map((prov) => [prov.id, prov])
        )
      }

      const productosCalculados: ProductoRentabilidad[] = (productosData || []).map((producto) => {
        const precioActual = producto.precio_actual ?? 0
        const precioCosto = producto.precio_costo ?? 0
        const utilidad = precioActual - precioCosto
        const margen = precioActual > 0 ? (utilidad / precioActual) * 100 : null

        return {
          ...producto,
          proveedor: producto.proveedor_principal_id
            ? proveedoresMap[producto.proveedor_principal_id]
            : undefined,
          utilidad_unitaria: utilidad,
          margen_bruto: utilidad,
          margen_pct: margen !== null ? Math.round(margen * 10) / 10 : null
        }
      })

      setProductos(productosCalculados)
    } catch (err) {
      console.error('Error cargando rentabilidad:', err)
      setError('No pudimos cargar los datos de rentabilidad.')
      setProductos([])
    } finally {
      setLoading(false)
    }
  }

  const categorias = useMemo(() => {
    const values = new Set(productos.map((p) => p.categoria).filter(Boolean))
    return Array.from(values).sort()
  }, [productos])

  const proveedores = useMemo(() => {
    const values = new Map<string, string>()
    productos.forEach((p) => {
      if (p.proveedor?.id && p.proveedor?.nombre) {
        values.set(p.proveedor.id, p.proveedor.nombre)
      }
    })
    return Array.from(values.entries()).sort((a, b) => a[1].localeCompare(b[1]))
  }, [productos])

  const filteredProductos = useMemo(() => {
    const searchLower = search.trim().toLowerCase()

    let items = productos.filter((p) => {
      const matchesSearch =
        searchLower.length === 0 ||
        p.nombre.toLowerCase().includes(searchLower) ||
        (p.codigo_barras ?? '').toLowerCase().includes(searchLower)

      const matchesCategoria = !categoria || p.categoria === categoria
      const matchesProveedor = !proveedorId || p.proveedor_principal_id === proveedorId
      const margenValue = p.margen_pct ?? 0
      const matchesMargen = showNegativos ? true : margenValue >= 0
      const matchesMin = margenValue >= minMargen

      return matchesSearch && matchesCategoria && matchesProveedor && matchesMargen && matchesMin
    })

    items = items.sort((a, b) => {
      let compareValue = 0
      if (sortKey === 'nombre') {
        compareValue = a.nombre.localeCompare(b.nombre)
      } else if (sortKey === 'utilidad') {
        compareValue = a.utilidad_unitaria - b.utilidad_unitaria
      } else {
        compareValue = (a.margen_pct ?? -999) - (b.margen_pct ?? -999)
      }

      return sortDir === 'asc' ? compareValue : -compareValue
    })

    return items
  }, [productos, search, categoria, proveedorId, minMargen, showNegativos, sortKey, sortDir])

  const metrics = useMemo(() => {
    const total = productos.length
    if (total === 0) {
      return {
        promedioMargen: 0,
        margenNegativo: 0,
        margenBajo: 0,
        utilidadPromedio: 0
      }
    }

    const totalMargen = productos.reduce((acc, p) => acc + (p.margen_pct ?? 0), 0)
    const margenNegativo = productos.filter((p) => (p.margen_pct ?? 0) < 0).length
    const margenBajo = productos.filter((p) => (p.margen_pct ?? 0) < minMargen).length
    const utilidadPromedio = productos.reduce((acc, p) => acc + p.utilidad_unitaria, 0) / total

    return {
      promedioMargen: Math.round((totalMargen / total) * 10) / 10,
      margenNegativo,
      margenBajo,
      utilidadPromedio: Math.round(utilidadPromedio)
    }
  }, [productos, minMargen])

  if (loading) {
    return <div className="text-center py-8">Cargando...</div>
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4">
        {error}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Panel de Rentabilidad</h1>
          <p className="text-gray-600">Controla márgenes y rentabilidad por producto.</p>
        </div>
        <button
          onClick={loadRentabilidad}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
        >
          <TrendingUp className="w-4 h-4" />
          Actualizar
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="bg-white rounded-xl shadow p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Margen promedio</p>
              <p className="text-2xl font-semibold text-gray-900">{metrics.promedioMargen}%</p>
            </div>
            <Percent className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Productos bajo mínimo</p>
              <p className="text-2xl font-semibold text-orange-600">{metrics.margenBajo}</p>
            </div>
            <TrendingDown className="w-8 h-8 text-orange-500" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Margen negativo</p>
              <p className="text-2xl font-semibold text-red-600">{metrics.margenNegativo}</p>
            </div>
            <TrendingDown className="w-8 h-8 text-red-500" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Utilidad promedio</p>
              <p className="text-2xl font-semibold text-emerald-600">${metrics.utilidadPromedio}</p>
            </div>
            <Banknote className="w-8 h-8 text-emerald-500" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow p-4">
        <div className="grid gap-4 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <label className="text-sm text-gray-500">Buscar</label>
            <div className="flex items-center gap-2 mt-1 px-3 py-2 border rounded-lg">
              <Search className="w-4 h-4 text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Nombre o código de barras"
                className="flex-1 outline-none text-sm"
              />
            </div>
          </div>
          <div>
            <label className="text-sm text-gray-500">Categoría</label>
            <select
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              className="mt-1 w-full px-3 py-2 border rounded-lg text-sm"
            >
              <option value="">Todas</option>
              {categorias.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm text-gray-500">Proveedor</label>
            <select
              value={proveedorId}
              onChange={(e) => setProveedorId(e.target.value)}
              className="mt-1 w-full px-3 py-2 border rounded-lg text-sm"
            >
              <option value="">Todos</option>
              {proveedores.map(([id, nombre]) => (
                <option key={id} value={id}>
                  {nombre}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm text-gray-500">Margen mínimo</label>
            <input
              type="number"
              value={minMargen}
              min={-100}
              max={100}
              onChange={(e) => setMinMargen(Number(e.target.value))}
              className="mt-1 w-full px-3 py-2 border rounded-lg text-sm"
            />
          </div>
          <div className="lg:col-span-5 flex flex-wrap items-center gap-4">
            <label className="inline-flex items-center gap-2 text-sm text-gray-600">
              <input
                type="checkbox"
                checked={showNegativos}
                onChange={(e) => setShowNegativos(e.target.checked)}
                className="rounded"
              />
              Incluir márgenes negativos
            </label>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={sortKey}
                onChange={(e) => setSortKey(e.target.value as SortKey)}
                className="px-3 py-2 border rounded-lg text-sm"
              >
                <option value="margen">Ordenar por margen</option>
                <option value="utilidad">Ordenar por utilidad</option>
                <option value="nombre">Ordenar por nombre</option>
              </select>
              <select
                value={sortDir}
                onChange={(e) => setSortDir(e.target.value as 'asc' | 'desc')}
                className="px-3 py-2 border rounded-lg text-sm"
              >
                <option value="desc">Descendente</option>
                <option value="asc">Ascendente</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Producto</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Categoría</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Proveedor</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Precio</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Costo</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Utilidad</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Margen</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredProductos.length === 0 && (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                  No hay productos con estos filtros.
                </td>
              </tr>
            )}
            {filteredProductos.map((producto) => {
              const margen = producto.margen_pct ?? 0
              const isNegative = margen < 0
              const isLow = margen >= 0 && margen < minMargen

              return (
                <tr key={producto.id} className={isNegative ? 'bg-red-50' : isLow ? 'bg-orange-50' : ''}>
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{producto.nombre}</div>
                    <div className="text-xs text-gray-500">{producto.codigo_barras ?? 'Sin código'}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{producto.categoria ?? '-'}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{producto.proveedor?.nombre ?? '-'}</td>
                  <td className="px-6 py-4 text-sm text-right text-gray-700">${producto.precio_actual ?? 0}</td>
                  <td className="px-6 py-4 text-sm text-right text-gray-700">${producto.precio_costo ?? 0}</td>
                  <td className={`px-6 py-4 text-sm text-right ${producto.utilidad_unitaria < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                    ${producto.utilidad_unitaria}
                  </td>
                  <td className={`px-6 py-4 text-sm text-right font-semibold ${isNegative ? 'text-red-600' : isLow ? 'text-orange-600' : 'text-emerald-700'}`}>
                    {producto.margen_pct !== null ? `${producto.margen_pct}%` : 'N/A'}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
