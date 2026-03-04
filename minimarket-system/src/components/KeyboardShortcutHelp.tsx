import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Keyboard } from 'lucide-react'

const SHORTCUTS = [
  {
    category: 'Global',
    shortcuts: [
      { keys: ['Ctrl', 'K'], description: 'Búsqueda global' },
      { keys: ['?'], description: 'Mostrar atajos de teclado' },
      { keys: ['Esc'], description: 'Cerrar modal / cancelar' },
    ],
  },
  {
    category: 'POS',
    shortcuts: [
      { keys: ['F1'], description: 'Pago en efectivo' },
      { keys: ['F2'], description: 'Pago fiado (seleccionar cliente)' },
      { keys: ['F3'], description: 'Pago con tarjeta' },
      { keys: ['F4'], description: 'Cobrar' },
      { keys: ['Esc'], description: 'Limpiar ticket' },
    ],
  },
  {
    category: 'Listas',
    shortcuts: [
      { keys: ['↑', '↓'], description: 'Navegar elementos' },
      { keys: ['Enter'], description: 'Seleccionar elemento' },
    ],
  },
]

export function KeyboardShortcutHelp() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      const isInputFocused = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT' || target.isContentEditable
      if (e.key === '?' && !isInputFocused) {
        e.preventDefault()
        setOpen(true)
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5" />
            Atajos de teclado
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          {SHORTCUTS.map((group) => (
            <div key={group.category}>
              <h3 className="text-sm font-semibold text-muted-foreground mb-2">{group.category}</h3>
              <div className="space-y-1.5">
                {group.shortcuts.map((shortcut, idx) => (
                  <div key={idx} className="flex items-center justify-between text-sm">
                    <span className="text-foreground">{shortcut.description}</span>
                    <div className="flex gap-1">
                      {shortcut.keys.map((key) => (
                        <kbd
                          key={key}
                          className="px-2 py-0.5 bg-muted rounded text-xs font-mono border"
                        >
                          {key}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
