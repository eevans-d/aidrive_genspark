import * as React from "react"
import { Check, ChevronsUpDown, Loader2, Plus } from "lucide-react"

import { cn } from "@/lib/utils"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandLoading,
  CommandSeparator,
} from "@/components/ui/command"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SmartComboboxItem {
  id: string
  label: string
  searchValue?: string
  keywords?: string[]
  meta?: Record<string, unknown>
}

export interface SmartComboboxProps<T extends SmartComboboxItem> {
  /** Full list of items (can be pre-filtered externally) */
  items: T[]
  /** Currently selected value (null = nothing selected) */
  value: T | null
  /** Callback when an item is selected */
  onSelect: (item: T) => void

  // -- Search --
  placeholder?: string
  /** Called when the search query changes (for server-side filtering) */
  onSearchChange?: (query: string) => void
  /** Whether data is loading */
  isLoading?: boolean

  // -- Display --
  /** Custom renderer for each item in the list */
  renderItem?: (item: T, isSelected: boolean) => React.ReactNode
  /** Custom renderer for the trigger button text */
  renderSelectedValue?: (item: T) => React.ReactNode
  /** Message when no results found */
  emptyMessage?: string

  // -- Recents --
  /** Items to show as "recent" when search is empty */
  recentItems?: T[]
  recentLabel?: string

  // -- Create inline --
  /** If present, shows a "Create new" option at the bottom */
  onCreateNew?: (query: string) => void
  createNewLabel?: (query: string) => string

  // -- Barcode scanner detection --
  /** Enable barcode scanner detection (fast keystrokes bypass dropdown) */
  detectBarcode?: boolean
  onBarcodeScan?: (barcode: string) => void

  // -- Mode --
  /** popover = dropdown trigger, inline = always-visible search box */
  mode?: "popover" | "inline"

  // -- Styling --
  className?: string
  contentClassName?: string
  triggerClassName?: string

  // -- Behavior --
  autoFocus?: boolean
  disabled?: boolean

  // -- Accessibility --
  label?: string

  // -- cmdk options --
  shouldFilter?: boolean
}

// ---------------------------------------------------------------------------
// Barcode detection hook
// ---------------------------------------------------------------------------

function useBarcodeDetector(
  enabled: boolean,
  onScan: ((barcode: string) => void) | undefined
) {
  const bufferRef = React.useRef("")
  const lastKeystrokeRef = React.useRef(0)
  const timerRef = React.useRef<ReturnType<typeof setTimeout>>()

  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent) => {
      if (!enabled || !onScan) return false

      const now = Date.now()
      const elapsed = now - lastKeystrokeRef.current
      lastKeystrokeRef.current = now

      // Fast keystroke = scanner (< 50ms between chars)
      if (e.key === "Enter" && bufferRef.current.length >= 4) {
        const barcode = bufferRef.current
        bufferRef.current = ""
        clearTimeout(timerRef.current)

        // Only treat as barcode if keystrokes were consistently fast
        onScan(barcode)
        e.preventDefault()
        e.stopPropagation()
        return true
      }

      if (e.key.length === 1) {
        if (elapsed < 50 || bufferRef.current.length === 0) {
          bufferRef.current += e.key
        } else {
          // Slow keystroke = human typing, reset buffer
          bufferRef.current = e.key
        }

        // Clear buffer after 200ms of no input (scanner stopped mid-way)
        clearTimeout(timerRef.current)
        timerRef.current = setTimeout(() => {
          bufferRef.current = ""
        }, 200)
      }

      return false
    },
    [enabled, onScan]
  )

  // Cleanup
  React.useEffect(() => {
    return () => clearTimeout(timerRef.current)
  }, [])

  return handleKeyDown
}

// ---------------------------------------------------------------------------
// SmartCombobox Component
// ---------------------------------------------------------------------------

export function SmartCombobox<T extends SmartComboboxItem>({
  items,
  value,
  onSelect,
  placeholder = "Buscar...",
  onSearchChange,
  isLoading = false,
  renderItem,
  renderSelectedValue,
  emptyMessage = "Sin resultados.",
  recentItems,
  recentLabel = "Recientes",
  onCreateNew,
  createNewLabel = (q) => `Crear "${q}"`,
  detectBarcode = false,
  onBarcodeScan,
  mode = "popover",
  className,
  contentClassName,
  triggerClassName,
  autoFocus = false,
  disabled = false,
  label,
  shouldFilter = true,
}: SmartComboboxProps<T>) {
  const [open, setOpen] = React.useState(mode === "inline")
  const [search, setSearch] = React.useState("")
  const inputRef = React.useRef<HTMLInputElement>(null)

  const handleBarcodeKeyDown = useBarcodeDetector(detectBarcode, onBarcodeScan)

  const handleSelect = React.useCallback(
    (itemId: string) => {
      const item = items.find((i) => i.id === itemId)
        ?? recentItems?.find((i) => i.id === itemId)
      if (item) {
        onSelect(item)
        setSearch("")
        if (mode === "popover") setOpen(false)
        // In inline mode, re-focus the input for continuous scanning/typing
        if (mode === "inline") {
          setTimeout(() => inputRef.current?.focus(), 50)
        }
      }
    },
    [items, recentItems, onSelect, mode]
  )

  const handleSearchChange = React.useCallback(
    (value: string) => {
      setSearch(value)
      onSearchChange?.(value)
    },
    [onSearchChange]
  )

  const handleCreateNew = React.useCallback(() => {
    if (onCreateNew && search.trim()) {
      onCreateNew(search.trim())
      setSearch("")
      if (mode === "popover") setOpen(false)
    }
  }, [onCreateNew, search, mode])

  // When opening in popover mode, focus the search input
  React.useEffect(() => {
    if (open && mode === "popover") {
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open, mode])

  // Auto-focus for inline mode
  React.useEffect(() => {
    if (autoFocus && mode === "inline") {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [autoFocus, mode])

  // Keyboard handler for the command container
  const handleCommandKeyDown = React.useCallback(
    (e: React.KeyboardEvent) => {
      // Barcode scanner detection takes priority
      const handled = handleBarcodeKeyDown(e)
      if (handled) return
      // Escape closes popover
      if (e.key === "Escape" && mode === "popover") {
        setOpen(false)
      }
    },
    [handleBarcodeKeyDown, mode]
  )

  const showRecents = !search && recentItems && recentItems.length > 0

  const commandContent = (
    <Command
      shouldFilter={shouldFilter}
      onKeyDown={handleCommandKeyDown}
      loop
      className={cn(mode === "inline" && "border rounded-md", contentClassName)}
      label={label}
    >
      <CommandInput
        ref={inputRef}
        placeholder={placeholder}
        value={search}
        onValueChange={handleSearchChange}
        autoFocus={autoFocus && mode === "popover"}
      />
      <CommandList>
        {isLoading && (
          <CommandLoading>
            <div className="flex items-center justify-center gap-2 py-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Cargando...</span>
            </div>
          </CommandLoading>
        )}

        {!isLoading && <CommandEmpty>{emptyMessage}</CommandEmpty>}

        {/* Recent items group - shown when search is empty */}
        {showRecents && (
          <CommandGroup heading={recentLabel}>
            {recentItems.map((item) => (
              <CommandItem
                key={`recent-${item.id}`}
                value={item.searchValue ?? item.label}
                keywords={item.keywords}
                onSelect={() => handleSelect(item.id)}
                className="min-h-[40px]"
              >
                {renderItem ? (
                  renderItem(item, value?.id === item.id)
                ) : (
                  <DefaultItemRenderer
                    item={item}
                    isSelected={value?.id === item.id}
                  />
                )}
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {/* Main items group */}
        {items.length > 0 && (
          <CommandGroup heading={showRecents ? "Todos" : undefined}>
            {items.map((item) => (
              <CommandItem
                key={item.id}
                value={item.searchValue ?? item.label}
                keywords={item.keywords}
                onSelect={() => handleSelect(item.id)}
                className="min-h-[40px]"
              >
                {renderItem ? (
                  renderItem(item, value?.id === item.id)
                ) : (
                  <DefaultItemRenderer
                    item={item}
                    isSelected={value?.id === item.id}
                  />
                )}
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {/* Create new option */}
        {onCreateNew && search.trim() && (
          <>
            <CommandSeparator />
            <CommandGroup>
              <CommandItem
                onSelect={handleCreateNew}
                className="min-h-[40px] text-primary"
              >
                <Plus className="mr-2 h-4 w-4" />
                {createNewLabel(search.trim())}
              </CommandItem>
            </CommandGroup>
          </>
        )}
      </CommandList>
    </Command>
  )

  // Inline mode: render command directly
  if (mode === "inline") {
    return <div className={cn("w-full", className)}>{commandContent}</div>
  }

  // Popover mode: render trigger + dropdown
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          role="combobox"
          aria-expanded={open}
          aria-label={label}
          disabled={disabled}
          className={cn(
            "flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
            triggerClassName,
            className
          )}
        >
          {value ? (
            renderSelectedValue ? (
              renderSelectedValue(value)
            ) : (
              <span className="truncate">{value.label}</span>
            )
          ) : (
            <span className="text-muted-foreground truncate">
              {placeholder}
            </span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        className={cn("w-[--radix-popover-trigger-width] p-0", contentClassName)}
        align="start"
      >
        {commandContent}
      </PopoverContent>
    </Popover>
  )
}

// ---------------------------------------------------------------------------
// Default item renderer
// ---------------------------------------------------------------------------

function DefaultItemRenderer<T extends SmartComboboxItem>({
  item,
  isSelected,
}: {
  item: T
  isSelected: boolean
}) {
  return (
    <div className="flex items-center w-full gap-2">
      {isSelected && <Check className="h-4 w-4 shrink-0 text-primary" />}
      <span className={cn("truncate", isSelected && "font-medium")}>
        {item.label}
      </span>
    </div>
  )
}
