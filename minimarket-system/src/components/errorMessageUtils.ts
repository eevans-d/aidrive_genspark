export type ErrorType = 'network' | 'server' | 'generic'

/**
 * Detecta el tipo de error basado en el mensaje o instancia
 */
export function detectErrorType(error: unknown): ErrorType {
  if (error instanceof Error) {
    const msg = error.message.toLowerCase()
    if (msg.includes('network') || msg.includes('fetch') || msg.includes('cors')) {
      return 'network'
    }
    if (msg.includes('500') || msg.includes('502') || msg.includes('503') || msg.includes('server')) {
      return 'server'
    }
  }
  return 'generic'
}

/**
 * Parsea un error y devuelve un mensaje amigable
 */
export function parseErrorMessage(error: unknown, isProd: boolean = import.meta.env.PROD): string {
  if (error instanceof Error) {
    // Evitar exponer detalles técnicos en producción
    if (isProd) {
      if (error.message.includes('network') || error.message.includes('fetch')) {
        return 'No se pudo conectar con el servidor. Verifica tu conexión.'
      }
      if (error.message.includes('401') || error.message.includes('unauthorized')) {
        return 'Sesión expirada. Por favor, vuelve a iniciar sesión.'
      }
      if (error.message.includes('403')) {
        return 'No tienes permisos para realizar esta acción.'
      }
      if (error.message.includes('500') || error.message.includes('server')) {
        return 'Error del servidor. Intenta de nuevo más tarde.'
      }
      return 'Ocurrió un error inesperado.'
    }
    return error.message
  }
  if (typeof error === 'string') {
    return error
  }
  return 'Error desconocido'
}
