import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

/**
 * Determina si estamos en modo desarrollo
 * En producción, import.meta.env.DEV es false
 */
const isDev = import.meta.env.DEV;

/**
 * Serializa el error para logging (solo en dev)
 * En producción se omite el stack trace por seguridad
 */
const serializeError = (error: unknown): string => {
  if (error instanceof Error) {
    if (isDev) {
      return `${error.message}\n${error.stack || ''}`;
    }
    return error.message;
  }
  if (isDev) {
    return JSON.stringify(error, null, 2);
  }
  return 'Error desconocido';
};

interface ErrorBoundaryState {
  hasError: boolean;
  error: unknown;
  errorId: string;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * ErrorBoundary seguro para producción
 * - No expone stack traces en producción
 * - Muestra mensaje amigable al usuario
 * - Genera ID único para correlación de errores
 * - Permite reintentar
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorId: ''
    };
  }

  static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
    // Genera un ID único para correlacionar con logs del servidor
    const errorId = `ERR-${Date.now().toString(36).toUpperCase()}`;
    return { hasError: true, error, errorId };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // En producción, aquí podrías enviar a un servicio de monitoreo
    // como Sentry, LogRocket, etc.
    if (isDev) {
      console.error('[ErrorBoundary] Error capturado:', error);
      console.error('[ErrorBoundary] Component stack:', errorInfo.componentStack);
    }
    // TODO: Integrar con servicio de observabilidad cuando esté disponible
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorId: '' });
  };

  render() {
    if (this.state.hasError) {
      // Si hay un fallback personalizado, usarlo
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // UI de error por defecto
      return (
        <div className="min-h-[200px] flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white border border-red-200 rounded-lg shadow-lg p-6">
            {/* Header con icono */}
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 rounded-full">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">
                Algo salió mal
              </h2>
            </div>

            {/* Mensaje amigable */}
            <p className="text-gray-600 mb-4">
              Ha ocurrido un error inesperado. Por favor, intenta recargar la página
              o contacta al soporte si el problema persiste.
            </p>

            {/* ID de error para soporte */}
            <div className="bg-gray-50 rounded-md px-3 py-2 mb-4">
              <p className="text-xs text-gray-500">
                ID de error: <code className="font-mono text-gray-700">{this.state.errorId}</code>
              </p>
            </div>

            {/* Detalles técnicos solo en desarrollo */}
            {isDev && (
              <details className="mb-4">
                <summary className="text-sm text-gray-500 cursor-pointer hover:text-gray-700">
                  Detalles técnicos (solo desarrollo)
                </summary>
                <pre className="mt-2 p-3 bg-gray-900 text-gray-100 text-xs rounded-md overflow-x-auto max-h-48">
                  {serializeError(this.state.error)}
                </pre>
              </details>
            )}

            {/* Botón de reintento */}
            <button
              onClick={this.handleRetry}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Intentar de nuevo
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;