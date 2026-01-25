import { Suspense, lazy } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { queryClient } from './lib/queryClient'
import { AuthProvider } from './contexts/AuthContext'
import { useAuth } from './hooks/useAuth'
import { useUserRole } from './hooks/useUserRole'
import Layout from './components/Layout'

const Login = lazy(() => import('./pages/Login'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Deposito = lazy(() => import('./pages/Deposito'))
const Kardex = lazy(() => import('./pages/Kardex'))
const Rentabilidad = lazy(() => import('./pages/Rentabilidad'))
const Stock = lazy(() => import('./pages/Stock'))
const Tareas = lazy(() => import('./pages/Tareas'))
const Productos = lazy(() => import('./pages/Productos'))
const Proveedores = lazy(() => import('./pages/Proveedores'))

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const { canAccess, loading: roleLoading } = useUserRole()
  const location = useLocation()

  if (loading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Cargando...</div>
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

function AppRoutes() {
  const { user } = useAuth()

  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-gray-500">Cargando...</div>
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
      </Routes>
    </Suspense>
  )
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </Router>
      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  )
}

export default App
