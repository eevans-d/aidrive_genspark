import { useEffect, useRef, useCallback } from 'react'

/**
 * Hook that detects barcode scanner "keyboard wedge" input.
 * Scanners type characters very quickly (< 50ms between keystrokes) and end with Enter.
 * This hook captures those sequences and triggers a callback with the scanned value.
 *
 * If a text input is focused, the scanner input goes there naturally.
 * If no input is focused, onScan is called with the barcode string.
 */

interface UseScanListenerOptions {
  /** Called when a scan is detected and no input is focused */
  onScan: (barcode: string) => void
  /** Minimum characters for a valid scan (default: 4) */
  minLength?: number
  /** Maximum time between keystrokes in ms (default: 50) */
  maxIntervalMs?: number
  /** Whether the listener is active (default: true) */
  enabled?: boolean
}

export function useScanListener({
  onScan,
  minLength = 4,
  maxIntervalMs = 50,
  enabled = true,
}: UseScanListenerOptions): void {
  const bufferRef = useRef('')
  const lastKeystrokeRef = useRef(0)
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>()

  const resetBuffer = useCallback(() => {
    bufferRef.current = ''
  }, [])

  useEffect(() => {
    if (!enabled) return

    const handleKeyDown = (e: KeyboardEvent) => {
      const now = Date.now()
      const elapsed = now - lastKeystrokeRef.current
      lastKeystrokeRef.current = now

      // If too much time passed, reset the buffer
      if (elapsed > maxIntervalMs && bufferRef.current.length > 0) {
        resetBuffer()
      }

      // Clear any pending timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      if (e.key === 'Enter') {
        const barcode = bufferRef.current.trim()
        resetBuffer()

        // Only treat as scan if we have enough characters and they came fast
        if (barcode.length >= minLength) {
          // Check if an input/textarea is focused
          const activeEl = document.activeElement
          const isInputFocused = activeEl instanceof HTMLInputElement ||
            activeEl instanceof HTMLTextAreaElement

          if (!isInputFocused) {
            e.preventDefault()
            onScan(barcode)
          }
          // If input is focused, let the Enter event through naturally
        }
        return
      }

      // Only capture printable single characters (scanner output)
      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        bufferRef.current += e.key
      }

      // Auto-reset buffer after a pause (user typing normally)
      timeoutRef.current = setTimeout(resetBuffer, maxIntervalMs * 3)
    }

    document.addEventListener('keydown', handleKeyDown, true)

    return () => {
      document.removeEventListener('keydown', handleKeyDown, true)
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [enabled, minLength, maxIntervalMs, onScan, resetBuffer])
}
