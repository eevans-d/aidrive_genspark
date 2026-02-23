import { ReactNode, useMemo, useState, useEffect, useCallback } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Home, Package, Warehouse, CheckSquare, ShoppingCart, Users, LogOut, User as UserIcon, ClipboardList, BarChart3, Search, Bell, DollarSign, Monitor, Smartphone, MoreHorizontal, BookOpen, Moon, Sun, FileText, LucideIcon } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useUserRole } from '../hooks/useUserRole'
import { UserRole } from '../lib/roles'
import { useScanListener } from '../hooks/useScanListener'
import { useAlertas } from '../hooks/useAlertas'
import { bitacoraApi } from '../lib/apiClient'
import { Toaster } from 'sonner'
import { useTheme } from 'next-themes'
import GlobalSearch from './GlobalSearch'
import AlertsDrawer from './AlertsDrawer'
import QuickNoteButton from './QuickNoteButton'

interface NavItem {
  path: string
  icon: LucideIcon
  label: string
  /** Roles que pueden ver este item. Si está vacío, todos pueden ver */
  allowedRoles: UserRole[]
}

interface LayoutProps {
  children: ReactNode
}

const NAV_ITEMS: NavItem[] = [
  { path: '/', icon: Home, label: 'Dashboard', allowedRoles: [] },
  { path: '/pos', icon: Monitor, label: 'POS', allowedRoles: ['admin', 'ventas'] },
  { path: '/pedidos', icon: ClipboardList, label: 'Pedidos', allowedRoles: ['admin', 'deposito', 'ventas'] },
  { path: '/stock', icon: Package, label: 'Stock', allowedRoles: [] },
  { path: '/clientes', icon: UserIcon, label: 'Clientes', allowedRoles: ['admin', 'ventas'] },
  { path: '/deposito', icon: Warehouse, label: 'Depósito', allowedRoles: ['admin', 'deposito'] },
  { path: '/kardex', icon: ClipboardList, label: 'Kardex', allowedRoles: ['admin', 'deposito'] },
  { path: '/rentabilidad', icon: BarChart3, label: 'Rentabilidad', allowedRoles: ['admin', 'deposito'] },
  { path: '/tareas', icon: CheckSquare, label: 'Tareas', allowedRoles: [] },
  { path: '/cuaderno', icon: BookOpen, label: 'Cuaderno', allowedRoles: [] },
  { path: '/productos', icon: ShoppingCart, label: 'Productos', allowedRoles: ['admin', 'deposito', 'ventas'] },
  { path: '/proveedores', icon: Users, label: 'Proveedores', allowedRoles: ['admin', 'deposito'] },
  { path: '/facturas', icon: FileText, label: 'Facturas', allowedRoles: ['admin', 'deposito'] },
  { path: '/ventas', icon: DollarSign, label: 'Ventas', allowedRoles: ['admin', 'ventas'] },
  { path: '/pocket', icon: Smartphone, label: 'Pocket', allowedRoles: ['admin', 'deposito'] },
]

const MOBILE_NAV_LIMIT = 4

export default function Layout({ children }: LayoutProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, signOut } = useAuth()
  const { canAccess } = useUserRole()
  const [searchOpen, setSearchOpen] = useState(false)
  const [alertsOpen, setAlertsOpen] = useState(false)
  const [scanQuery, setScanQuery] = useState('')
  const { totalAlertas } = useAlertas()
  const [logoutOpen, setLogoutOpen] = useState(false)
  const [logoutNota, setLogoutNota] = useState('')
  const [logoutError, setLogoutError] = useState<string | null>(null)
  const [logoutSaving, setLogoutSaving] = useState(false)
  const [moreOpen, setMoreOpen] = useState(false)
  const { resolvedTheme, setTheme } = useTheme()

  const quickNoteRouteState = (location.state ?? null) as {
    quickAction?: string
    prefillProduct?: string
  } | null

  const quickNotePrefill = typeof quickNoteRouteState?.prefillProduct === 'string'
    ? quickNoteRouteState.prefillProduct
    : undefined

  const quickNoteAutoOpen = location.pathname === '/cuaderno'
    && (
      quickNoteRouteState?.quickAction === 'new-faltante'
      || Boolean(quickNotePrefill)
    )

  const clearQuickNoteRouteState = useCallback(() => {
    if (!quickNoteAutoOpen) return
    navigate(`${location.pathname}${location.search}`, { replace: true, state: null })
  }, [quickNoteAutoOpen, navigate, location.pathname, location.search])

  // Barcode scanner detection: opens search with scanned barcode
  useScanListener({
    onScan: useCallback((barcode: string) => {
      setScanQuery(barcode)
      setSearchOpen(true)
    }, []),
    enabled: !searchOpen,
  })

  // Keyboard shortcut: Ctrl+K / Cmd+K
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault()
      setSearchOpen((prev) => !prev)
    }
  }, [])

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  // Filtrar items según el rol del usuario
  const navItems = useMemo(() => {
    return NAV_ITEMS.filter(item => {
      if (item.allowedRoles.length === 0) return true
      return canAccess(item.path)
    })
  }, [canAccess])

  // Mobile: first 4 visible + overflow behind "Más" button
  const mobileVisibleItems = useMemo(() => navItems.slice(0, MOBILE_NAV_LIMIT), [navItems])
  const mobileOverflowItems = useMemo(() => navItems.slice(MOBILE_NAV_LIMIT), [navItems])
  const isOverflowActive = mobileOverflowItems.some(item => item.path === location.pathname)

  // Close mobile overflow menu on route change
  useEffect(() => {
    setMoreOpen(false)
  }, [location.pathname])

  async function performSignOut() {
    try {
      await signOut()
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Error al cerrar sesión'
      setLogoutError(msg)
    }
  }

  async function handleGuardarYSalir() {
    const nota = logoutNota.trim()
    setLogoutSaving(true)
    setLogoutError(null)
    try {
      if (nota) {
        const nombre =
          typeof user?.user_metadata?.nombre === 'string' ? user.user_metadata.nombre : null
        await bitacoraApi.create({ nota, usuario_nombre: nombre })
      }
      await performSignOut()
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Error guardando nota'
      setLogoutError(msg)
    } finally {
      setLogoutSaving(false)
    }
  }

  async function handleSalirSinNota() {
    await performSignOut()
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Navbar */}
      <nav className="bg-white dark:bg-gray-900 shadow-sm border-b dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl sm:text-2xl font-bold text-blue-600 dark:text-blue-400">Mini Market System</h1>
            </div>
            <div className="flex items-center gap-4">
              {/* Search Button */}
              <button
                onClick={() => setSearchOpen(true)}
                className="flex items-center gap-2 px-3 py-2.5 min-h-[48px] text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 rounded-lg transition-colors"
                title="Buscar (Ctrl+K)"
              >
                <Search className="w-4 h-4" />
                <span className="hidden sm:inline text-sm">Buscar</span>
                <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] text-gray-400 bg-white dark:bg-gray-700 dark:text-gray-300 rounded border dark:border-gray-600 ml-1">
                  Ctrl+K
                </kbd>
              </button>

              {/* Alerts Button */}
              <button
                onClick={() => setAlertsOpen(true)}
                className="relative p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                title="Alertas"
              >
                <Bell className="w-5 h-5" />
                {totalAlertas > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-red-500 rounded-full">
                    {totalAlertas > 99 ? '99+' : totalAlertas}
                  </span>
                )}
              </button>

              {/* Dark Mode Toggle */}
              <button
                onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                title="Alternar modo oscuro"
                aria-label="Alternar modo oscuro"
              >
                {resolvedTheme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>

              <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                <UserIcon className="w-5 h-5" />
                <span className="hidden sm:inline text-sm">
                  {user?.user_metadata?.nombre || user?.email}
                </span>
              </div>
              <button
                onClick={() => { setLogoutOpen(true); setLogoutNota(''); setLogoutError(null) }}
                className="flex items-center gap-2 px-3 py-2 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                title="Cerrar Sesión"
              >
                <LogOut className="w-5 h-5" />
                <span className="hidden sm:inline text-sm">Salir</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Global Search Modal */}
      <GlobalSearch
        isOpen={searchOpen}
        onClose={() => { setSearchOpen(false); setScanQuery(''); }}
        initialQuery={scanQuery}
      />

      {/* Alerts Drawer */}
      <AlertsDrawer isOpen={alertsOpen} onClose={() => setAlertsOpen(false)} />

      {/* Toaster centralizado (unica instancia para todas las paginas con Layout) */}
      <Toaster position="top-right" richColors theme={resolvedTheme === 'dark' ? 'dark' : 'light'} />

      {/* Quick Note FAB (Cuaderno Inteligente) */}
      <QuickNoteButton
        autoOpen={quickNoteAutoOpen}
        prefillText={quickNotePrefill}
        onClose={clearQuickNoteRouteState}
      />

      {/* Logout Bitácora Modal */}
      {logoutOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40" onClick={() => !logoutSaving && setLogoutOpen(false)} />
          <div className="relative w-full max-w-lg bg-white dark:bg-gray-900 rounded-2xl shadow-xl border dark:border-gray-700 overflow-hidden" role="dialog" aria-modal="true">
            <div className="p-4 border-b dark:border-gray-700 flex items-center justify-between">
              <div className="font-bold text-gray-900 dark:text-gray-100">¿Algo que reportar?</div>
              <button
                onClick={() => setLogoutOpen(false)}
                disabled={logoutSaving}
                className="p-2 min-h-[48px] min-w-[48px] flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50"
                title="Cerrar"
              >
                ✕
              </button>
            </div>
            <div className="p-4 space-y-3">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Deja una nota para el dueño o el siguiente turno. Si no tienes nada, puedes salir sin nota.
              </p>
              <textarea
                value={logoutNota}
                onChange={(e) => setLogoutNota(e.target.value)}
                placeholder="Ej: Se rompió la heladera de lácteos. Faltó reponer pan lactal."
                className="w-full min-h-[110px] px-3 py-2 border dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={logoutSaving}
              />
              {logoutError && (
                <div className="text-sm text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-3">
                  {logoutError}
                </div>
              )}
              <div className="flex flex-col sm:flex-row gap-2 justify-end">
                <button
                  onClick={() => setLogoutOpen(false)}
                  disabled={logoutSaving}
                  className="px-4 py-2 min-h-[48px] rounded-lg border dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSalirSinNota}
                  disabled={logoutSaving}
                  className="px-4 py-2 min-h-[48px] rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-semibold hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50"
                >
                  Salir sin nota
                </button>
                <button
                  onClick={handleGuardarYSalir}
                  disabled={logoutSaving}
                  className="px-4 py-2 min-h-[48px] rounded-lg bg-blue-600 text-white font-black hover:bg-blue-700 disabled:opacity-50"
                >
                  {logoutSaving ? 'Guardando…' : 'Guardar y salir'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row">
        {/* Sidebar - Oculto en móvil, visible en desktop */}
        <aside className="hidden md:block md:w-64 bg-white dark:bg-gray-900 shadow-sm min-h-[calc(100vh-4rem)]">
          <nav className="p-4 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.path

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-3 px-4 py-3 min-h-[48px] rounded-lg transition-all ${isActive
                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 font-medium'
                    : 'text-gray-700 hover:bg-gray-100 hover:translate-x-0.5 dark:text-gray-300 dark:hover:bg-gray-800'
                    }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </nav>
        </aside>

        {/* Bottom Navigation - Solo en móvil (max 4 + Más) */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-t border-white/20 dark:border-gray-700/30 shadow-lg z-50">
          {/* Overflow menu */}
          {moreOpen && mobileOverflowItems.length > 0 && (
            <>
              <div className="fixed inset-0 z-[-1]" onClick={() => setMoreOpen(false)} />
              <div className="absolute bottom-full left-0 right-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-t border-white/20 dark:border-gray-700/30 shadow-xl p-3">
                <div className="grid grid-cols-4 gap-2">
                  {mobileOverflowItems.map((item) => {
                    const Icon = item.icon
                    const isActive = location.pathname === item.path
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        className={`flex flex-col items-center justify-center min-h-[48px] py-2 px-1 rounded-lg transition-all active:scale-95 ${isActive
                          ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                          : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
                        }`}
                      >
                        <Icon className="w-5 h-5 mb-1" />
                        <span className="text-sm">{item.label}</span>
                      </Link>
                    )
                  })}
                </div>
              </div>
            </>
          )}
          <div className="grid grid-cols-5 gap-1 p-2">
            {mobileVisibleItems.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.path
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex flex-col items-center justify-center min-h-[48px] py-2 px-1 rounded-lg transition-all active:scale-95 ${isActive
                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                    : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
                  }`}
                >
                  <Icon className="w-5 h-5 mb-1" />
                  <span className="text-sm">{item.label}</span>
                </Link>
              )
            })}
            {mobileOverflowItems.length > 0 && (
              <button
                onClick={() => setMoreOpen(prev => !prev)}
                className={`flex flex-col items-center justify-center min-h-[48px] py-2 px-1 rounded-lg transition-colors ${moreOpen || isOverflowActive
                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                  : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
                }`}
              >
                <MoreHorizontal className="w-5 h-5 mb-1" />
                <span className="text-sm">Más</span>
              </button>
            )}
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1 p-4 sm:p-6 md:p-8 pb-20 md:pb-8">
          <div className="max-w-7xl mx-auto page-transition" key={location.pathname}>
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
