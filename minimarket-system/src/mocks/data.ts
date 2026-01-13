import type {
  OrdenCompra,
  Personal,
  PrecioHistorico,
  Producto,
  Proveedor,
  StockDeposito,
  StockReservado,
  TareaPendiente
} from '../types/database'

export const MOCK_USER_ID = '00000000-0000-0000-0000-000000000001'

const baseTime = new Date('2026-01-12T10:00:00Z')
const toIso = (daysOffset: number, hoursOffset = 0) =>
  new Date(baseTime.getTime() + daysOffset * 86_400_000 + hoursOffset * 3_600_000).toISOString()

const proveedores: Proveedor[] = [
  {
    id: 'prov-1',
    nombre: 'Distribuidora Norte',
    contacto: 'Ana Ruiz',
    email: 'ventas@distribuidoranorte.com',
    telefono: '011-4444-1000',
    productos_ofrecidos: ['Almacen', 'Bebidas'],
    activo: true,
    created_at: toIso(-40),
    updated_at: toIso(-5)
  },
  {
    id: 'prov-2',
    nombre: 'Mayorista Centro',
    contacto: 'Luis Perez',
    email: 'ventas@mayoristacentro.com',
    telefono: '011-4444-2000',
    productos_ofrecidos: ['Limpieza', 'Perfumeria'],
    activo: true,
    created_at: toIso(-32),
    updated_at: toIso(-3)
  },
  {
    id: 'prov-3',
    nombre: 'Frio Express',
    contacto: 'Carla Diaz',
    email: 'ventas@frioexpress.com',
    telefono: '011-4444-3000',
    productos_ofrecidos: ['Congelados', 'Lacteos'],
    activo: true,
    created_at: toIso(-25),
    updated_at: toIso(-1)
  }
]

const productos: Producto[] = [
  {
    id: 'prod-1',
    nombre: 'Arroz 1kg',
    categoria: 'Almacen',
    codigo_barras: '779000000001',
    precio_actual: 1200,
    precio_costo: 850,
    proveedor_principal_id: 'prov-1',
    margen_ganancia: 30,
    activo: true,
    created_at: toIso(-60),
    updated_at: toIso(-2)
  },
  {
    id: 'prod-2',
    nombre: 'Aceite 900ml',
    categoria: 'Almacen',
    codigo_barras: '779000000002',
    precio_actual: 2200,
    precio_costo: 1500,
    proveedor_principal_id: 'prov-1',
    margen_ganancia: 31.8,
    activo: true,
    created_at: toIso(-58),
    updated_at: toIso(-4)
  },
  {
    id: 'prod-3',
    nombre: 'Leche Entera 1L',
    categoria: 'Lacteos',
    codigo_barras: '779000000003',
    precio_actual: 1300,
    precio_costo: 900,
    proveedor_principal_id: 'prov-3',
    margen_ganancia: 30.8,
    activo: true,
    created_at: toIso(-55),
    updated_at: toIso(-3)
  },
  {
    id: 'prod-4',
    nombre: 'Detergente 750ml',
    categoria: 'Limpieza',
    codigo_barras: '779000000004',
    precio_actual: 1800,
    precio_costo: 1200,
    proveedor_principal_id: 'prov-2',
    margen_ganancia: 33.3,
    activo: true,
    created_at: toIso(-50),
    updated_at: toIso(-6)
  },
  {
    id: 'prod-5',
    nombre: 'Yerba 1kg',
    categoria: 'Almacen',
    codigo_barras: '779000000005',
    precio_actual: 2600,
    precio_costo: 1900,
    proveedor_principal_id: 'prov-1',
    margen_ganancia: 26.9,
    activo: true,
    created_at: toIso(-48),
    updated_at: toIso(-2)
  },
  {
    id: 'prod-6',
    nombre: 'Agua 2L',
    categoria: 'Bebidas',
    codigo_barras: '779000000006',
    precio_actual: 800,
    precio_costo: 500,
    proveedor_principal_id: 'prov-1',
    margen_ganancia: 37.5,
    activo: true,
    created_at: toIso(-40),
    updated_at: toIso(-5)
  },
  {
    id: 'prod-7',
    nombre: 'Helado 1L',
    categoria: 'Congelados',
    codigo_barras: '779000000007',
    precio_actual: 3500,
    precio_costo: 2500,
    proveedor_principal_id: 'prov-3',
    margen_ganancia: 28.6,
    activo: true,
    created_at: toIso(-37),
    updated_at: toIso(-3)
  },
  {
    id: 'prod-8',
    nombre: 'Jabon en polvo 1kg',
    categoria: 'Limpieza',
    codigo_barras: '779000000008',
    precio_actual: 2400,
    precio_costo: 1600,
    proveedor_principal_id: 'prov-2',
    margen_ganancia: 33.3,
    activo: true,
    created_at: toIso(-34),
    updated_at: toIso(-4)
  }
]

const precios_historicos: PrecioHistorico[] = [
  {
    id: 'hist-1',
    producto_id: 'prod-1',
    precio: 1100,
    fuente: 'manual',
    fecha: toIso(-14),
    cambio_porcentaje: -8.3,
    created_at: toIso(-14)
  },
  {
    id: 'hist-2',
    producto_id: 'prod-1',
    precio: 1200,
    fuente: 'manual',
    fecha: toIso(-7),
    cambio_porcentaje: 9.1,
    created_at: toIso(-7)
  },
  {
    id: 'hist-3',
    producto_id: 'prod-2',
    precio: 2100,
    fuente: 'scraper',
    fecha: toIso(-10),
    cambio_porcentaje: -4.5,
    created_at: toIso(-10)
  },
  {
    id: 'hist-4',
    producto_id: 'prod-2',
    precio: 2200,
    fuente: 'scraper',
    fecha: toIso(-3),
    cambio_porcentaje: 4.8,
    created_at: toIso(-3)
  },
  {
    id: 'hist-5',
    producto_id: 'prod-3',
    precio: 1250,
    fuente: 'manual',
    fecha: toIso(-9),
    cambio_porcentaje: -3.8,
    created_at: toIso(-9)
  },
  {
    id: 'hist-6',
    producto_id: 'prod-3',
    precio: 1300,
    fuente: 'manual',
    fecha: toIso(-2),
    cambio_porcentaje: 4,
    created_at: toIso(-2)
  },
  {
    id: 'hist-7',
    producto_id: 'prod-4',
    precio: 1700,
    fuente: 'scraper',
    fecha: toIso(-8),
    cambio_porcentaje: -5.6,
    created_at: toIso(-8)
  },
  {
    id: 'hist-8',
    producto_id: 'prod-4',
    precio: 1800,
    fuente: 'scraper',
    fecha: toIso(-1),
    cambio_porcentaje: 5.9,
    created_at: toIso(-1)
  },
  {
    id: 'hist-9',
    producto_id: 'prod-5',
    precio: 2500,
    fuente: 'manual',
    fecha: toIso(-12),
    cambio_porcentaje: -3.8,
    created_at: toIso(-12)
  },
  {
    id: 'hist-10',
    producto_id: 'prod-5',
    precio: 2600,
    fuente: 'manual',
    fecha: toIso(-4),
    cambio_porcentaje: 4,
    created_at: toIso(-4)
  }
]

const stock_deposito: StockDeposito[] = [
  {
    id: 'stock-1',
    producto_id: 'prod-1',
    cantidad_actual: 18,
    stock_minimo: 8,
    stock_maximo: 50,
    ubicacion: 'Pasillo A',
    lote: 'A1',
    fecha_vencimiento: null,
    created_at: toIso(-30),
    updated_at: toIso(-2)
  },
  {
    id: 'stock-2',
    producto_id: 'prod-2',
    cantidad_actual: 5,
    stock_minimo: 6,
    stock_maximo: 30,
    ubicacion: 'Pasillo A',
    lote: 'A2',
    fecha_vencimiento: null,
    created_at: toIso(-30),
    updated_at: toIso(-2)
  },
  {
    id: 'stock-3',
    producto_id: 'prod-3',
    cantidad_actual: 12,
    stock_minimo: 10,
    stock_maximo: 40,
    ubicacion: 'Camara fria',
    lote: 'L1',
    fecha_vencimiento: toIso(60),
    created_at: toIso(-25),
    updated_at: toIso(-1)
  },
  {
    id: 'stock-4',
    producto_id: 'prod-4',
    cantidad_actual: 2,
    stock_minimo: 5,
    stock_maximo: 25,
    ubicacion: 'Pasillo C',
    lote: 'LIM-3',
    fecha_vencimiento: null,
    created_at: toIso(-20),
    updated_at: toIso(-1)
  },
  {
    id: 'stock-5',
    producto_id: 'prod-5',
    cantidad_actual: 0,
    stock_minimo: 6,
    stock_maximo: 45,
    ubicacion: 'Pasillo B',
    lote: 'YB-1',
    fecha_vencimiento: null,
    created_at: toIso(-18),
    updated_at: toIso(-1)
  },
  {
    id: 'stock-6',
    producto_id: 'prod-6',
    cantidad_actual: 22,
    stock_minimo: 10,
    stock_maximo: 60,
    ubicacion: 'Pasillo Bebidas',
    lote: 'B-1',
    fecha_vencimiento: null,
    created_at: toIso(-16),
    updated_at: toIso(-3)
  },
  {
    id: 'stock-7',
    producto_id: 'prod-7',
    cantidad_actual: 4,
    stock_minimo: 6,
    stock_maximo: 20,
    ubicacion: 'Camara fria',
    lote: 'H-2',
    fecha_vencimiento: toIso(30),
    created_at: toIso(-14),
    updated_at: toIso(-3)
  },
  {
    id: 'stock-8',
    producto_id: 'prod-8',
    cantidad_actual: 14,
    stock_minimo: 8,
    stock_maximo: 30,
    ubicacion: 'Pasillo C',
    lote: 'JP-4',
    fecha_vencimiento: null,
    created_at: toIso(-12),
    updated_at: toIso(-2)
  }
]

const stock_reservado: StockReservado[] = [
  {
    id: 'res-1',
    producto_id: 'prod-1',
    cantidad: 3,
    estado: 'activa',
    referencia: 'PED-1001',
    usuario: 'Operador',
    fecha_reserva: toIso(-2),
    fecha_cancelacion: null
  },
  {
    id: 'res-2',
    producto_id: 'prod-4',
    cantidad: 1,
    estado: 'activa',
    referencia: 'PED-1002',
    usuario: 'Operador',
    fecha_reserva: toIso(-1),
    fecha_cancelacion: null
  }
]

const ordenes_compra: OrdenCompra[] = [
  {
    id: 'oc-1',
    producto_id: 'prod-2',
    proveedor_id: 'prov-1',
    cantidad: 20,
    cantidad_recibida: 5,
    estado: 'en_transito',
    fecha_orden: toIso(-6),
    fecha_estimada: toIso(4),
    fecha_recepcion: null,
    referencia: 'OC-2026-001'
  },
  {
    id: 'oc-2',
    producto_id: 'prod-5',
    proveedor_id: 'prov-1',
    cantidad: 15,
    cantidad_recibida: 0,
    estado: 'pendiente',
    fecha_orden: toIso(-3),
    fecha_estimada: toIso(6),
    fecha_recepcion: null,
    referencia: 'OC-2026-002'
  }
]

const tareas_pendientes: TareaPendiente[] = [
  {
    id: 'tarea-1',
    titulo: 'Revisar stock critico',
    descripcion: 'Verificar productos con stock cero o bajo',
    asignada_a_id: null,
    asignada_a_nombre: 'Operador 1',
    prioridad: 'urgente',
    estado: 'pendiente',
    fecha_creacion: toIso(-2),
    fecha_vencimiento: toIso(1),
    fecha_completada: null,
    completada_por_id: null,
    completada_por_nombre: null,
    fecha_cancelada: null,
    cancelada_por_id: null,
    cancelada_por_nombre: null,
    razon_cancelacion: null,
    creada_por_id: null,
    creada_por_nombre: 'Sistema',
    created_at: toIso(-2),
    updated_at: toIso(-2)
  },
  {
    id: 'tarea-2',
    titulo: 'Actualizar precios destacados',
    descripcion: 'Comparar precios con proveedor principal',
    asignada_a_id: null,
    asignada_a_nombre: 'Operador 2',
    prioridad: 'normal',
    estado: 'pendiente',
    fecha_creacion: toIso(-4),
    fecha_vencimiento: toIso(2),
    fecha_completada: null,
    completada_por_id: null,
    completada_por_nombre: null,
    fecha_cancelada: null,
    cancelada_por_id: null,
    cancelada_por_nombre: null,
    razon_cancelacion: null,
    creada_por_id: null,
    creada_por_nombre: 'Sistema',
    created_at: toIso(-4),
    updated_at: toIso(-4)
  },
  {
    id: 'tarea-3',
    titulo: 'Controlar camara fria',
    descripcion: 'Verificar vencimientos en congelados',
    asignada_a_id: null,
    asignada_a_nombre: 'Operador 3',
    prioridad: 'baja',
    estado: 'completada',
    fecha_creacion: toIso(-6),
    fecha_vencimiento: toIso(-2),
    fecha_completada: toIso(-1),
    completada_por_id: null,
    completada_por_nombre: 'Operador 3',
    fecha_cancelada: null,
    cancelada_por_id: null,
    cancelada_por_nombre: null,
    razon_cancelacion: null,
    creada_por_id: null,
    creada_por_nombre: 'Supervisor',
    created_at: toIso(-6),
    updated_at: toIso(-1)
  }
]

const personal: Personal[] = [
  {
    id: 'pers-1',
    nombre: 'Admin Mock',
    email: 'admin@minimarket.com',
    telefono: null,
    rol: 'Administrador',
    departamento: 'Operaciones',
    activo: true,
    fecha_ingreso: toIso(-180),
    user_auth_id: MOCK_USER_ID,
    created_at: toIso(-180),
    updated_at: toIso(-30)
  }
]

export const mockSeed = {
  proveedores,
  productos,
  precios_historicos,
  stock_deposito,
  stock_reservado,
  ordenes_compra,
  tareas_pendientes,
  personal
}

export type MockDataStore = typeof mockSeed

const deepClone = <T>(value: T): T => {
  if (typeof structuredClone === 'function') {
    return structuredClone(value)
  }
  return JSON.parse(JSON.stringify(value)) as T
}

export const createMockStore = (): MockDataStore => deepClone(mockSeed)
