import { Suspense, lazy } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { ThemeProvider } from 'next-themes'
import { queryClient } from './lib/queryClient'
import { AuthProvider } from './contexts/AuthContext'
import { useAuth } from './hooks/useAuth'
import { useUserRole } from './hooks/useUserRole'
import Layout from './components/Layout'
import { ErrorBoundary } from './components/ErrorBoundary'
import { SkeletonCard, SkeletonText } from './components/Skeleton'

const Login = lazy(() => import('./pages/Login'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Deposito = lazy(() => import('./pages/Deposito'))
const Kardex = lazy(() => import('./pages/Kardex'))
const Rentabilidad = lazy(() => import('./pages/Rentabilidad'))
const Stock = lazy(() => import('./pages/Stock'))
const Tareas = lazy(() => import('./pages/Tareas'))
const Cuaderno = lazy(() => import('./pages/Cuaderno'))
const Productos = lazy(() => import('./pages/Productos'))
const Proveedores = lazy(() => import('./pages/Proveedores'))
const Ventas = lazy(() => import('./pages/Ventas'))
const Facturas = lazy(() => import('./pages/Facturas'))
const Pedidos = lazy(() => import('./pages/Pedidos'))
const Pocket = lazy(() => import('./pages/Pocket'))
const Pos = lazy(() => import('./pages/Pos'))
const Clientes = lazy(() => import('./pages/Clientes'))
const NotFound = lazy(() => import('./pages/NotFound'))

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const { canAccess, loading: roleLoading } = useUserRole()
  const location = useLocation()

  if (loading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-4">
          <SkeletonCard />
          <SkeletonText width="w-3/4" />
          <SkeletonText width="w-1/2" />
        </div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (!canAccess(location.pathname)) {
    // Redireccionar a dashboard si no tiene permiso
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}

export function AppRoutes() {
  const { user } = useAuth()

  return (
    <ErrorBoundary>
      <Suspense
        fallback={
          <div className="min-h-screen flex items-center justify-center p-8">
            <div className="w-full max-w-md space-y-4">
              <SkeletonCard />
              <SkeletonText width="w-3/4" />
              <SkeletonText width="w-1/2" />
            </div>
          </div>
        }
      >
        <Routes>
        <Route
          path="/login"
          element={user ? <Navigate to="/" replace /> : <Login />}
        />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout>
                <Dashboard />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/deposito"
          element={
            <ProtectedRoute>
              <Layout>
                <Deposito />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/kardex"
          element={
            <ProtectedRoute>
              <Layout>
                <Kardex />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/stock"
          element={
            <ProtectedRoute>
              <Layout>
                <Stock />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/rentabilidad"
          element={
            <ProtectedRoute>
              <Layout>
                <Rentabilidad />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/tareas"
          element={
            <ProtectedRoute>
              <Layout>
                <Tareas />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/cuaderno"
          element={
            <ProtectedRoute>
              <Layout>
                <Cuaderno />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/productos"
          element={
            <ProtectedRoute>
              <Layout>
                <Productos />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/proveedores"
          element={
            <ProtectedRoute>
              <Layout>
                <Proveedores />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/ventas"
          element={
            <ProtectedRoute>
              <Layout>
                <Ventas />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/facturas"
          element={
            <ProtectedRoute>
              <Layout>
                <Facturas />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/pedidos"
          element={
            <ProtectedRoute>
              <Layout>
                <Pedidos />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/pocket"
          element={
            <ProtectedRoute>
              <Pocket />
            </ProtectedRoute>
          }
        />
        <Route
          path="/pos"
          element={
            <ProtectedRoute>
              <Pos />
            </ProtectedRoute>
          }
        />
        <Route
          path="/clientes"
          element={
            <ProtectedRoute>
              <Layout>
                <Clientes />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="*"
          element={
            <ProtectedRoute>
              <Layout>
                <NotFound />
              </Layout>
            </ProtectedRoute>
          }
        />
      </Routes>
      </Suspense>
    </ErrorBoundary>
  )
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
        <Router>
          <AuthProvider>
            <AppRoutes />
          </AuthProvider>
        </Router>
      </ThemeProvider>
      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  )
}

export default App
