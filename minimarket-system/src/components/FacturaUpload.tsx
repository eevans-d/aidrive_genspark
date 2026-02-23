import { useState, useRef, useCallback } from 'react'
import { Upload, Camera, X, FileText, Loader2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { toast } from 'sonner'

interface FacturaUploadProps {
  proveedorId: string
  onUploaded: (imagenUrl: string) => void
  disabled?: boolean
}

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
const MAX_SIZE_BYTES = 10 * 1024 * 1024 // 10MB

export default function FacturaUpload({ proveedorId, onUploaded, disabled }: FacturaUploadProps) {
  const [preview, setPreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [fileName, setFileName] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  const handleFile = useCallback(async (file: File) => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      toast.error('Tipo de archivo no permitido. Use JPG, PNG, WebP o PDF.')
      return
    }

    if (file.size > MAX_SIZE_BYTES) {
      toast.error('El archivo excede el tamaño máximo de 10MB.')
      return
    }

    setFileName(file.name)

    // Preview for images
    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file)
      setPreview(url)
    } else {
      setPreview(null)
    }

    // Upload to Supabase Storage
    setUploading(true)
    try {
      const ext = file.name.split('.').pop() || 'jpg'
      const path = `${proveedorId}/${Date.now()}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('facturas')
        .upload(path, file, {
          contentType: file.type,
          upsert: false,
        })

      if (uploadError) {
        throw uploadError
      }

      const { data: urlData } = supabase.storage
        .from('facturas')
        .getPublicUrl(path)

      // Since the bucket is private, we store the path instead of public URL
      onUploaded(path)
      toast.success('Imagen subida correctamente')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al subir imagen'
      toast.error(msg)
      setPreview(null)
      setFileName(null)
    } finally {
      setUploading(false)
    }
  }, [proveedorId, onUploaded])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }, [handleFile])

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
    e.target.value = ''
  }, [handleFile])

  const clearPreview = useCallback(() => {
    if (preview) URL.revokeObjectURL(preview)
    setPreview(null)
    setFileName(null)
  }, [preview])

  return (
    <div className="space-y-3">
      {/* Drop zone / Preview */}
      {preview ? (
        <div className="relative rounded-lg border-2 border-blue-300 bg-blue-50 dark:bg-blue-900/20 p-2">
          <button
            type="button"
            onClick={clearPreview}
            className="absolute top-2 right-2 p-1 bg-white dark:bg-gray-800 rounded-full shadow min-h-[48px] min-w-[48px] flex items-center justify-center"
            aria-label="Quitar imagen"
          >
            <X className="w-4 h-4" />
          </button>
          <img
            src={preview}
            alt="Preview de factura"
            className="max-h-64 mx-auto rounded"
          />
        </div>
      ) : (
        <div
          onDrop={handleDrop}
          onDragOver={e => e.preventDefault()}
          className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center hover:border-blue-400 transition-colors"
        >
          {uploading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
              <p className="text-sm text-gray-500">Subiendo imagen...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <Upload className="w-8 h-8 text-gray-400" />
              <p className="text-sm text-gray-500">
                Arrastrá una imagen o PDF aquí
              </p>
              <p className="text-xs text-gray-400">
                JPG, PNG, WebP o PDF — máx 10MB
              </p>
            </div>
          )}
        </div>
      )}

      {/* File name indicator */}
      {fileName && !preview && (
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <FileText className="w-4 h-4" />
          <span className="truncate">{fileName}</span>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || uploading}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 min-h-[48px] bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors"
        >
          <Upload className="w-4 h-4" />
          Elegir archivo
        </button>
        <button
          type="button"
          onClick={() => cameraInputRef.current?.click()}
          disabled={disabled || uploading}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 min-h-[48px] bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors"
        >
          <Camera className="w-4 h-4" />
          Tomar foto
        </button>
      </div>

      {/* Hidden inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,application/pdf"
        onChange={handleInputChange}
        className="hidden"
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleInputChange}
        className="hidden"
      />
    </div>
  )
}
