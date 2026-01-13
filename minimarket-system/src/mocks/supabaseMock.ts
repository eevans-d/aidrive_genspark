import type { User } from '@supabase/supabase-js'
import { createMockStore, MOCK_USER_ID, type MockDataStore } from './data'

type QueryError = { message: string }

type QueryResult<T> = {
  data: T | null
  error: QueryError | null
  count?: number | null
}

type Filter =
  | { type: 'eq'; column: string; value: unknown }
  | { type: 'in'; column: string; values: unknown[] }

type Order = { column: string; ascending: boolean }

type AuthCallback = (event: string, session: { user: User | null } | null) => void

const nowIso = () => new Date().toISOString()

let idCounter = 0
const createId = (prefix: string) => `${prefix}-${Date.now()}-${++idCounter}`

const createMockUser = (email: string, metadata: Record<string, unknown> = {}) => {
  return {
    id: MOCK_USER_ID,
    aud: 'authenticated',
    role: 'authenticated',
    email,
    created_at: nowIso(),
    app_metadata: { provider: 'email', providers: ['email'] },
    user_metadata: metadata,
    identities: [],
    last_sign_in_at: nowIso(),
    updated_at: nowIso()
  } as User
}

const applyDefaults = (table: keyof MockDataStore, row: Record<string, any>) => {
  const now = nowIso()
  const id = row.id ?? createId(String(table))

  if (table === 'tareas_pendientes') {
    return {
      id,
      titulo: row.titulo ?? 'Nueva tarea',
      descripcion: row.descripcion ?? null,
      asignada_a_id: row.asignada_a_id ?? null,
      asignada_a_nombre: row.asignada_a_nombre ?? null,
      prioridad: row.prioridad ?? 'normal',
      estado: row.estado ?? 'pendiente',
      fecha_creacion: row.fecha_creacion ?? now,
      fecha_vencimiento: row.fecha_vencimiento ?? null,
      fecha_completada: row.fecha_completada ?? null,
      completada_por_id: row.completada_por_id ?? null,
      completada_por_nombre: row.completada_por_nombre ?? null,
      fecha_cancelada: row.fecha_cancelada ?? null,
      cancelada_por_id: row.cancelada_por_id ?? null,
      cancelada_por_nombre: row.cancelada_por_nombre ?? null,
      razon_cancelacion: row.razon_cancelacion ?? null,
      creada_por_id: row.creada_por_id ?? null,
      creada_por_nombre: row.creada_por_nombre ?? null,
      created_at: row.created_at ?? now,
      updated_at: row.updated_at ?? now
    }
  }

  if (table === 'personal') {
    return {
      id,
      nombre: row.nombre ?? 'Usuario',
      email: row.email ?? null,
      telefono: row.telefono ?? null,
      rol: row.rol ?? 'Usuario',
      departamento: row.departamento ?? null,
      activo: row.activo ?? true,
      fecha_ingreso: row.fecha_ingreso ?? now,
      user_auth_id: row.user_auth_id ?? null,
      created_at: row.created_at ?? now,
      updated_at: row.updated_at ?? now
    }
  }

  return { ...row, id }
}

class MockQueryBuilder {
  private mode: 'select' | 'update' | null = null
  private selectColumns: string | null = null
  private selectOptions: { count?: 'exact'; head?: boolean } = {}
  private updateValues: Record<string, any> | null = null
  private filters: Filter[] = []
  private orders: Order[] = []
  private rangeParams: { from: number; to: number } | null = null
  private limitCount: number | null = null

  constructor(
    private tableName: keyof MockDataStore,
    private store: MockDataStore
  ) {}

  select(columns = '*', options: { count?: 'exact'; head?: boolean } = {}) {
    this.mode = 'select'
    this.selectColumns = columns
    this.selectOptions = options
    return this
  }

  insert(payload: Record<string, any> | Record<string, any>[]) {
    const rows = Array.isArray(payload) ? payload : [payload]
    const normalized = rows.map((row) => applyDefaults(this.tableName, row))
    const table = this.store[this.tableName] as Record<string, any>[]
    table.push(...normalized)

    return Promise.resolve({
      data: normalized,
      error: null
    })
  }

  update(values: Record<string, any>) {
    this.mode = 'update'
    this.updateValues = values
    return this
  }

  eq(column: string, value: unknown) {
    this.filters.push({ type: 'eq', column, value })
    return this
  }

  in(column: string, values: unknown[]) {
    this.filters.push({ type: 'in', column, values })
    return this
  }

  order(column: string, options: { ascending?: boolean } = {}) {
    this.orders.push({ column, ascending: options.ascending !== false })
    return this
  }

  range(from: number, to: number) {
    this.rangeParams = { from, to }
    return this
  }

  limit(count: number) {
    this.limitCount = count
    return this
  }

  private applyFilters(rows: Record<string, any>[]) {
    return rows.filter((row) => {
      return this.filters.every((filter) => {
        if (filter.type === 'eq') {
          return row[filter.column] === filter.value
        }
        return filter.values.includes(row[filter.column])
      })
    })
  }

  private applyOrder(rows: Record<string, any>[]) {
    if (this.orders.length === 0) return rows

    const sorted = [...rows]
    sorted.sort((a, b) => {
      for (const order of this.orders) {
        const aValue = a[order.column]
        const bValue = b[order.column]

        if (aValue == null && bValue == null) continue
        if (aValue == null) return order.ascending ? 1 : -1
        if (bValue == null) return order.ascending ? -1 : 1

        if (aValue < bValue) return order.ascending ? -1 : 1
        if (aValue > bValue) return order.ascending ? 1 : -1
      }
      return 0
    })

    return sorted
  }

  private applyRange(rows: Record<string, any>[]) {
    let result = rows

    if (this.rangeParams) {
      const { from, to } = this.rangeParams
      result = result.slice(from, to + 1)
    }

    if (this.limitCount != null) {
      result = result.slice(0, this.limitCount)
    }

    return result
  }

  private applySelect(rows: Record<string, any>[]) {
    const columns = this.selectColumns
    if (!columns || columns.trim() === '*' || columns.includes('*')) {
      return rows
    }

    const fields = columns
      .split(',')
      .map((field) => field.trim())
      .filter(Boolean)

    return rows.map((row) => {
      const selected: Record<string, any> = {}
      for (const field of fields) {
        selected[field] = row[field]
      }
      return selected
    })
  }

  private async execute(): Promise<QueryResult<any>> {
    const rows = this.store[this.tableName] as Record<string, any>[]
    const filtered = this.applyFilters(rows)

    if (this.mode === 'update') {
      const updated = filtered.map((row) => {
        Object.assign(row, this.updateValues)
        if ('updated_at' in row) {
          row.updated_at = nowIso()
        }
        return row
      })

      return { data: updated, error: null }
    }

    const count = this.selectOptions.count ? filtered.length : null
    const ordered = this.applyOrder(filtered)
    const ranged = this.applyRange(ordered)
    const selected = this.applySelect(ranged)

    if (this.selectOptions.head) {
      return { data: null, error: null, count }
    }

    return { data: selected, error: null, count }
  }

  then<TResult1 = QueryResult<any>, TResult2 = never>(
    onfulfilled?: ((value: QueryResult<any>) => TResult1 | PromiseLike<TResult1>) | undefined | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null
  ) {
    return this.execute().then(onfulfilled, onrejected)
  }

  catch<TResult = never>(
    onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null
  ) {
    return this.execute().catch(onrejected)
  }

  finally(onfinally?: (() => void) | undefined | null) {
    return this.execute().finally(onfinally)
  }
}

const handleMovimientoInventario = (
  store: MockDataStore,
  params: Record<string, any>
): QueryResult<Record<string, any>> => {
  const productoId = params?.p_producto_id
  const tipo = params?.p_tipo
  const cantidad = Number(params?.p_cantidad ?? 0)

  if (!productoId || !['entrada', 'salida'].includes(tipo) || !Number.isFinite(cantidad)) {
    return { data: null, error: { message: 'Parametros invalidos' } }
  }

  const stock = store.stock_deposito.find((item) => item.producto_id === productoId)
  const stockActual = stock?.cantidad_actual ?? 0
  const nuevoStock = tipo === 'entrada' ? stockActual + cantidad : stockActual - cantidad

  if (tipo === 'salida' && nuevoStock < 0) {
    return { data: null, error: { message: 'Stock insuficiente' } }
  }

  if (stock) {
    stock.cantidad_actual = nuevoStock
    stock.updated_at = nowIso()
  }

  return {
    data: {
      producto_id: productoId,
      tipo,
      cantidad,
      stock_anterior: stockActual,
      stock_nuevo: nuevoStock,
      ubicacion: stock?.ubicacion ?? 'Principal'
    },
    error: null
  }
}

export const createMockSupabaseClient = () => {
  const store = createMockStore()
  let currentUser: User | null = createMockUser('admin@minimarket.com', { nombre: 'Admin' })
  const listeners = new Set<AuthCallback>()

  const emit = (event: string) => {
    const session = currentUser ? { user: currentUser } : null
    listeners.forEach((listener) => listener(event, session))
  }

  const auth = {
    getUser: async () => ({ data: { user: currentUser }, error: null }),
    onAuthStateChange: (callback: AuthCallback) => {
      listeners.add(callback)
      callback('INITIAL_SESSION', currentUser ? { user: currentUser } : null)
      return {
        data: {
          subscription: {
            unsubscribe: () => listeners.delete(callback)
          }
        }
      }
    },
    signInWithPassword: async ({ email }: { email: string; password: string }) => {
      currentUser = createMockUser(email, { nombre: email.split('@')[0] ?? 'Usuario' })
      emit('SIGNED_IN')
      return { data: { user: currentUser, session: { user: currentUser } }, error: null }
    },
    signUp: async ({
      email,
      options
    }: {
      email: string
      password: string
      options?: { data?: Record<string, unknown> }
    }) => {
      currentUser = createMockUser(email, options?.data ?? {})
      emit('SIGNED_IN')
      return { data: { user: currentUser, session: { user: currentUser } }, error: null }
    },
    signOut: async () => {
      currentUser = null
      emit('SIGNED_OUT')
      return { error: null }
    }
  }

  const from = (table: keyof MockDataStore) => new MockQueryBuilder(table, store)

  const rpc = async (fn: string, params: Record<string, any>) => {
    if (fn === 'sp_movimiento_inventario') {
      return handleMovimientoInventario(store, params)
    }

    return { data: null, error: { message: `RPC no implementada: ${fn}` } }
  }

  return { from, rpc, auth }
}
