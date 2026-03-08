import { useEffect } from 'react'

/**
 * Shows a browser-native "unsaved changes" confirmation dialog
 * when the user tries to close or reload the page while
 * `hasUnsavedChanges` is true.
 */
export function useUnsavedChangesWarning(hasUnsavedChanges: boolean) {
  useEffect(() => {
    if (!hasUnsavedChanges) return
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [hasUnsavedChanges])
}
