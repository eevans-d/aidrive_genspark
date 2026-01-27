import { describe, expect, it } from 'vitest'
import { detectErrorType, parseErrorMessage } from '../../minimarket-system/src/components/errorMessageUtils'
import { queryClient, queryKeys } from '../../minimarket-system/src/lib/queryClient'

describe('errorMessageUtils', () => {
  it('detects network errors', () => {
    const error = new Error('Network request failed due to CORS')
    expect(detectErrorType(error)).toBe('network')
  })

  it('detects server errors', () => {
    const error = new Error('500 internal server error')
    expect(detectErrorType(error)).toBe('server')
  })

  it('falls back to generic errors', () => {
    const error = new Error('Something else')
    expect(detectErrorType(error)).toBe('generic')
  })

  it('returns friendly messages in production', () => {
    expect(parseErrorMessage(new Error('network timeout'), true)).toBe(
      'No se pudo conectar con el servidor. Verifica tu conexión.'
    )
    expect(parseErrorMessage(new Error('401 unauthorized'), true)).toBe(
      'Sesión expirada. Por favor, vuelve a iniciar sesión.'
    )
    expect(parseErrorMessage(new Error('403 forbidden'), true)).toBe(
      'No tienes permisos para realizar esta acción.'
    )
    expect(parseErrorMessage(new Error('500 server error'), true)).toBe(
      'Error del servidor. Intenta de nuevo más tarde.'
    )
  })

  it('returns raw message in development', () => {
    expect(parseErrorMessage(new Error('Custom error'), false)).toBe('Custom error')
  })

  it('handles string and unknown inputs', () => {
    expect(parseErrorMessage('Mensaje directo', false)).toBe('Mensaje directo')
    expect(parseErrorMessage({}, false)).toBe('Error desconocido')
  })
})

describe('queryClient and queryKeys', () => {
  it('exposes expected default query options', () => {
    const options = queryClient.getDefaultOptions()
    expect(options.queries?.staleTime).toBe(1000 * 60 * 5)
    expect(options.queries?.gcTime).toBe(1000 * 60 * 30)
    expect(options.queries?.retry).toBe(1)
    expect(options.queries?.refetchOnWindowFocus).toBe(false)
  })

  it('builds stable query keys', () => {
    expect(queryKeys.productos).toEqual(['productos'])
    expect(queryKeys.productosPaginated(2, 50)).toEqual(['productos', 'paginated', { page: 2, limit: 50 }])
    expect(queryKeys.productoById('abc')).toEqual(['productos', 'detail', 'abc'])
    expect(queryKeys.stockFiltered('critico')).toEqual(['stock', 'filtered', 'critico'])
    expect(queryKeys.tareaById('t1')).toEqual(['tareas', 'detail', 't1'])
    expect(queryKeys.proveedorById('p1')).toEqual(['proveedores', 'detail', 'p1'])
  })
})
