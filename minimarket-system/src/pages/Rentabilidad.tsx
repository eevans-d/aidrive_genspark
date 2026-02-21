import { useMemo, useState } from 'react'
import { TrendingDown, TrendingUp, Percent, Search, Filter, Banknote } from 'lucide-react'
import { useRentabilidad } from '../hooks/queries'
import { useQuery } from '@tanstack/react-query'
import apiClient from '../lib/apiClient'
import { ErrorMessage } from '../components/ErrorMessage'
import { parseErrorMessage, detectErrorType, extractRequestId } from '../components/errorMessageUtils'
import { money } from '../utils/currency'
import { SkeletonCard, SkeletonText, SkeletonTable, SkeletonChart } from '../components/Skeleton'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

type SortKey = 'margen' | 'utilidad' | 'nombre'

export default function Rentabilidad() {
  const [search, setSearch] = useState('')
  const [categoria, setCategoria] = useState('')
  const [proveedorId, setProveedorId] = useState('')
  const [minMargen, setMinMargen] = useState(15)
  const [showNegativos, setShowNegativos] = useState(true)
  const [sortKey, setSortKey] = useState<SortKey>('margen')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  const { data, isLoading, isError, error, refetch, isFetching } = useRentabilidad()

  // Query para proveedores (para filtro dropdown)
  const { data: proveedoresData } = useQuery({
    queryKey: ['proveedores-dropdown'],
    queryFn: async () => {
      return await apiClient.proveedores.dropdown()
    },
    staleTime: 1000 * 60 * 10,
  })

  const productos = useMemo(() => data?.productos ?? [], [data?.productos])
  const promedios = data?.promedios ?? { margenPromedio: 0, precioPromedioVenta: 0, precioPromedioCosto: 0 }
  const proveedoresDropdown = proveedoresData ?? []

  const categorias = useMemo(() => {
    const values = new Set(productos.map((p) => p.categoria).filter(Boolean))
    return Array.from(values).sort() as string[]
  }, [productos])

  const filteredProductos = useMemo(() => {
    const searchLower = search.trim().toLowerCase()

    let items = productos.filter((p) => {
      const matchesSearch =
        searchLower.length === 0 ||
        p.nombre.toLowerCase().includes(searchLower)

      const matchesCategoria = !categoria || p.categoria === categoria
      const matchesProveedor = !proveedorId // No tenemos proveedor_id directo en este hook
      const margenValue = p.margen_porcentaje ?? 0
      const matchesMargen = showNegativos ? true : margenValue >= 0
      const matchesMin = margenValue >= minMargen

      return matchesSearch && matchesCategoria && matchesProveedor && matchesMargen && matchesMin
    })

    items = items.sort((a, b) => {
      let compareValue = 0
      if (sortKey === 'nombre') {
        compareValue = a.nombre.localeCompare(b.nombre)
      } else if (sortKey === 'utilidad') {
        const utilA = (a.precio_actual ?? 0) - (a.precio_costo ?? 0)
        const utilB = (b.precio_actual ?? 0) - (b.precio_costo ?? 0)
        compareValue = utilA - utilB
      } else {
        compareValue = (a.margen_porcentaje ?? -999) - (b.margen_porcentaje ?? -999)
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

    const totalMargen = productos.reduce((acc, p) => acc + (p.margen_porcentaje ?? 0), 0)
    const margenNegativo = productos.filter((p) => (p.margen_porcentaje ?? 0) < 0).length
    const margenBajo = productos.filter((p) => (p.margen_porcentaje ?? 0) < minMargen).length
    const utilidades = productos.map(p => (p.precio_actual ?? 0) - (p.precio_costo ?? 0))
    const utilidadPromedio = utilidades.reduce((a, b) => a + b, 0) / total

    return {
      promedioMargen: Math.round((totalMargen / total) * 10) / 10,
      margenNegativo,
      margenBajo,
      utilidadPromedio: Math.round(utilidadPromedio)
    }
  }, [productos, minMargen])

  const topByMargin = useMemo(() => {
    return [...productos]
      .sort((a, b) => (b.margen_porcentaje ?? 0) - (a.margen_porcentaje ?? 0))
      .slice(0, 10)
      .map(p => ({
        name: p.nombre.length > 18 ? p.nombre.slice(0, 16) + '…' : p.nombre,
        margen: Math.round((p.margen_porcentaje ?? 0) * 10) / 10,
      }))
  }, [productos])

  const marginBands = useMemo(() => {
    const bands = [
      { name: '< 0%', min: -Infinity, max: 0, count: 0 },
      { name: '0–15%', min: 0, max: 15, count: 0 },
      { name: '15–30%', min: 15, max: 30, count: 0 },
      { name: '30–50%', min: 30, max: 50, count: 0 },
      { name: '50%+', min: 50, max: Infinity, count: 0 },
    ]
    for (const p of productos) {
      const m = p.margen_porcentaje ?? 0
      const band = bands.find(b => m >= b.min && m < b.max)
      if (band) band.count++
    }
    return bands.map(b => ({ name: b.name, cantidad: b.count }))
  }, [productos])

  const MARGIN_BAND_COLORS = ['#ef4444', '#f59e0b', '#3b82f6', '#22c55e', '#10b981']

  if (isLoading) {
    return (
      <div className="space-y-6">
        <SkeletonText width="w-64" className="h-8" />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SkeletonChart />
          <SkeletonChart />
        </div>
        <SkeletonTable />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Panel de Rentabilidad</h1>
        <ErrorMessage
          message={parseErrorMessage(error)}
          type={detectErrorType(error)}
          requestId={extractRequestId(error)}
          onRetry={() => refetch()}
          isRetrying={isFetching}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Panel de Rentabilidad</h1>
          <p className="text-gray-600 dark:text-gray-400">Controla márgenes y rentabilidad por producto.</p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
        >
          <TrendingUp className="w-4 h-4" />
          {isFetching ? 'Actualizando...' : 'Actualizar'}
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Margen promedio</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{metrics.promedioMargen}%</p>
            </div>
            <Percent className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Productos bajo mínimo</p>
              <p className="text-2xl font-semibold text-orange-600">{metrics.margenBajo}</p>
            </div>
            <TrendingDown className="w-8 h-8 text-orange-500" />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Margen negativo</p>
              <p className="text-2xl font-semibold text-red-600">{metrics.margenNegativo}</p>
            </div>
            <TrendingDown className="w-8 h-8 text-red-500" />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Utilidad promedio</p>
              <p className="text-2xl font-semibold text-emerald-600">${money(metrics.utilidadPromedio)}</p>
            </div>
            <Banknote className="w-8 h-8 text-emerald-500" />
          </div>
        </div>
      </div>

      {/* Gráficos de rentabilidad */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow p-6">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Top 10 por Margen</h3>
          {topByMargin.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={topByMargin} layout="vertical" margin={{ left: 80 }}>
                <XAxis type="number" tick={{ fontSize: 11 }} stroke="#9ca3af" unit="%" />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} stroke="#9ca3af" width={80} />
                <Tooltip formatter={(val: number) => `${val}%`} />
                <Bar dataKey="margen" radius={[0, 4, 4, 0]} barSize={16}>
                  {topByMargin.map((entry, i) => (
                    <Cell
                      key={`top-${i}`}
                      fill={entry.margen < 0 ? '#ef4444' : entry.margen < minMargen ? '#f59e0b' : '#22c55e'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-400 text-sm text-center py-8">Sin datos</p>
          )}
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl shadow p-6">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Distribución de Márgenes</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={marginBands} barSize={40}>
              <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="#9ca3af" />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke="#9ca3af" />
              <Tooltip />
              <Bar dataKey="cantidad" radius={[6, 6, 0, 0]}>
                {marginBands.map((_entry, i) => (
                  <Cell key={`band-${i}`} fill={MARGIN_BAND_COLORS[i]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl shadow p-4">
        <div className="grid gap-4 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <label className="text-sm text-gray-500 dark:text-gray-400">Buscar</label>
            <div className="flex items-center gap-2 mt-1 px-3 py-2 border dark:border-gray-700 rounded-lg">
              <Search className="w-4 h-4 text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Nombre del producto"
                className="flex-1 outline-none text-sm bg-transparent dark:text-gray-100"
              />
            </div>
          </div>
          <div>
            <label className="text-sm text-gray-500 dark:text-gray-400">Categoría</label>
            <select
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              className="mt-1 w-full px-3 py-2 border dark:border-gray-700 rounded-lg text-sm bg-transparent dark:text-gray-100"
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
            <label className="text-sm text-gray-500 dark:text-gray-400">Margen mínimo</label>
            <input
              type="number"
              value={minMargen}
              min={-100}
              max={100}
              onChange={(e) => setMinMargen(Number(e.target.value))}
              className="mt-1 w-full px-3 py-2 border dark:border-gray-700 rounded-lg text-sm bg-transparent dark:text-gray-100"
            />
          </div>
          <div className="lg:col-span-5 flex flex-wrap items-center gap-4">
            <label className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
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
                className="px-3 py-2 border dark:border-gray-700 rounded-lg text-sm bg-transparent dark:text-gray-100"
              >
                <option value="margen">Ordenar por margen</option>
                <option value="utilidad">Ordenar por utilidad</option>
                <option value="nombre">Ordenar por nombre</option>
              </select>
              <select
                value={sortDir}
                onChange={(e) => setSortDir(e.target.value as 'asc' | 'desc')}
                className="px-3 py-2 border dark:border-gray-700 rounded-lg text-sm bg-transparent dark:text-gray-100"
              >
                <option value="desc">Descendente</option>
                <option value="asc">Ascendente</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Producto</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Categoría</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Precio</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Costo</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Utilidad</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Margen</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
            {filteredProductos.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                  No hay productos con estos filtros.
                </td>
              </tr>
            )}
            {filteredProductos.map((producto) => {
              const margen = producto.margen_porcentaje ?? 0
              const utilidad = (producto.precio_actual ?? 0) - (producto.precio_costo ?? 0)
              const isNegative = margen < 0
              const isLow = margen >= 0 && margen < minMargen

              return (
                <tr key={producto.id} className={isNegative ? 'bg-red-50 dark:bg-red-950/30' : isLow ? 'bg-yellow-50 dark:bg-yellow-950/30' : ''}>
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900 dark:text-gray-100">{producto.nombre}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{producto.categoria ?? '-'}</td>
                  <td className="px-6 py-4 text-sm text-right text-gray-700 dark:text-gray-300">${money(producto.precio_actual ?? 0)}</td>
                  <td className="px-6 py-4 text-sm text-right text-gray-700 dark:text-gray-300">${money(producto.precio_costo ?? 0)}</td>
                  <td className={`px-6 py-4 text-sm text-right ${utilidad < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                    ${money(utilidad)}
                  </td>
                  <td className={`px-6 py-4 text-sm text-right font-semibold ${isNegative ? 'text-red-600' : isLow ? 'text-yellow-700 dark:text-yellow-500' : 'text-emerald-700 dark:text-emerald-500'}`}>
                    {margen.toFixed(1)}%
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
