import { useState, useRef, useEffect, useCallback } from 'react'
import { BrowserMultiFormatReader, NotFoundException } from '@zxing/library'
import { Camera, X, Keyboard } from 'lucide-react'

interface BarcodeScannerProps {
  onScan: (code: string) => void
  isActive: boolean
  onClose: () => void
}

export default function BarcodeScanner({ onScan, isActive, onClose }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const readerRef = useRef<BrowserMultiFormatReader | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [manualMode, setManualMode] = useState(false)
  const [manualCode, setManualCode] = useState('')
  const manualInputRef = useRef<HTMLInputElement>(null)

  const stopCamera = useCallback(() => {
    if (readerRef.current) {
      readerRef.current.reset()
      readerRef.current = null
    }
  }, [])

  const startCamera = useCallback(async () => {
    if (!videoRef.current) return
    setError(null)

    try {
      const reader = new BrowserMultiFormatReader()
      readerRef.current = reader

      await reader.decodeFromVideoDevice(
        null, // Use default camera (usually rear on mobile)
        videoRef.current,
        (result, err) => {
          if (result) {
            const code = result.getText()
            onScan(code)
          }
          if (err && !(err instanceof NotFoundException)) {
            // Non-NotFound errors indicate camera/read failures: fallback to manual mode.
            stopCamera()
            setError('No se pudo leer el código con la cámara. Use ingreso manual.')
            setManualMode(true)
          }
        }
      )
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error de cámara'
      if (msg.includes('NotAllowedError') || msg.includes('Permission')) {
        setError('Permiso de cámara denegado. Use ingreso manual.')
      } else if (msg.includes('NotFoundError') || msg.includes('Requested device not found')) {
        setError('No se encontró cámara. Use ingreso manual.')
      } else if (msg.includes('insecure') || msg.includes('secure context')) {
        setError('Cámara requiere HTTPS. Use ingreso manual.')
      } else {
        setError(`Error: ${msg}. Use ingreso manual.`)
      }
      setManualMode(true)
    }
  }, [onScan, stopCamera])

  useEffect(() => {
    if (isActive && !manualMode) {
      startCamera()
    }
    return () => stopCamera()
  }, [isActive, manualMode, startCamera, stopCamera])

  useEffect(() => {
    if (manualMode && manualInputRef.current) {
      manualInputRef.current.focus()
    }
  }, [manualMode])

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const code = manualCode.trim()
    if (code) {
      onScan(code)
      setManualCode('')
    }
  }

  if (!isActive) return null

  return (
    <div className="flex flex-col gap-3">
      {/* Toggle camera/manual */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => {
            if (manualMode) {
              setManualMode(false)
            } else {
              stopCamera()
              setManualMode(true)
            }
          }}
          className="flex items-center gap-2 text-sm text-blue-600 font-medium"
        >
          {manualMode ? (
            <>
              <Camera className="w-4 h-4" />
              Usar cámara
            </>
          ) : (
            <>
              <Keyboard className="w-4 h-4" />
              Ingreso manual
            </>
          )}
        </button>
        <button
          onClick={onClose}
          className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {manualMode ? (
        <form onSubmit={handleManualSubmit} className="flex gap-2">
          <input
            ref={manualInputRef}
            type="text"
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            placeholder="Código de barras o nombre..."
            className="flex-1 px-3 py-3 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoComplete="off"
          />
          <button
            type="submit"
            disabled={!manualCode.trim()}
            className="px-4 py-3 bg-blue-600 text-white rounded-lg font-medium disabled:opacity-50"
          >
            Buscar
          </button>
        </form>
      ) : (
        <div className="relative bg-black rounded-lg overflow-hidden aspect-[4/3]">
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            playsInline
            muted
          />
          {/* Scan overlay guide */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-3/4 h-1/3 border-2 border-white/60 rounded-lg" />
          </div>
          {error && (
            <div className="absolute inset-x-0 bottom-0 bg-red-600/90 text-white text-sm p-2 text-center">
              {error}
            </div>
          )}
          <div className="absolute inset-x-0 top-0 bg-black/40 text-white text-xs p-2 text-center">
            Apunte al código de barras
          </div>
        </div>
      )}
    </div>
  )
}
