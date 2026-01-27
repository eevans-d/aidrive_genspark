import { RefreshCw, AlertCircle, WifiOff, ServerOff } from 'lucide-react';
import type { ErrorType } from './errorMessageUtils';

interface ErrorMessageProps {
        /** Mensaje de error a mostrar */
        message?: string;
        /** Función de reintento (opcional) */
        onRetry?: () => void;
        /** Tipo de error para mostrar icono apropiado */
        type?: ErrorType;
        /** Si está en proceso de reintentar */
        isRetrying?: boolean;
        /** Tamaño del componente */
        size?: 'sm' | 'md' | 'lg';
}

const icons = {
        network: WifiOff,
        server: ServerOff,
        generic: AlertCircle,
};

const sizes = {
        sm: {
                container: 'p-3',
                icon: 'w-5 h-5',
                text: 'text-sm',
                button: 'px-3 py-1.5 text-sm',
        },
        md: {
                container: 'p-4',
                icon: 'w-6 h-6',
                text: 'text-base',
                button: 'px-4 py-2',
        },
        lg: {
                container: 'p-6',
                icon: 'w-8 h-8',
                text: 'text-lg',
                button: 'px-5 py-2.5 text-lg',
        },
};

/**
 * Componente reutilizable para mostrar errores con opción de reintento.
 * 
 * @example
 * ```tsx
 * // Uso básico
 * <ErrorMessage message="No se pudieron cargar los datos" onRetry={fetchData} />
 * 
 * // Con tipo de error
 * <ErrorMessage message="Error de conexión" type="network" onRetry={fetchData} />
 * 
 * // Mientras reintenta
 * <ErrorMessage message="Error" onRetry={fetchData} isRetrying={isLoading} />
 * ```
 */
export function ErrorMessage({
        message = 'Ocurrió un error',
        onRetry,
        type = 'generic',
        isRetrying = false,
        size = 'md',
}: ErrorMessageProps) {
        const Icon = icons[type];
        const sizeStyles = sizes[size];

        return (
                <div
                        className={`
        flex flex-col items-center justify-center text-center
        bg-red-50 border border-red-200 rounded-lg
        ${sizeStyles.container}
      `}
                        role="alert"
                >
                        <div className="flex items-center gap-2 text-red-600 mb-2">
                                <Icon className={sizeStyles.icon} />
                                <span className={`font-medium ${sizeStyles.text}`}>
                                        {message}
                                </span>
                        </div>

                        {onRetry && (
                                <button
                                        onClick={onRetry}
                                        disabled={isRetrying}
                                        className={`
            flex items-center gap-2
            bg-red-600 text-white rounded-md
            hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed
            transition-colors
            ${sizeStyles.button}
          `}
                                >
                                        <RefreshCw
                                                className={`w-4 h-4 ${isRetrying ? 'animate-spin' : ''}`}
                                        />
                                        {isRetrying ? 'Reintentando...' : 'Reintentar'}
                                </button>
                        )}
                </div>
        );
}

export default ErrorMessage;
