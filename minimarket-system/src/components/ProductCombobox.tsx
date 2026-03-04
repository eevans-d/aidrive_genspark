import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import { Check, Package, Tag } from "lucide-react"

import { productosApi, type DropdownItem } from "@/lib/apiClient"
import { money } from "@/utils/currency"
import { cn } from "@/lib/utils"
import {
  SmartCombobox,
  type SmartComboboxItem,
} from "@/components/ui/smart-combobox"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ProductComboboxItem extends SmartComboboxItem {
  sku?: string | null
  codigo_barras?: string | null
  precio_actual?: number | null
  /** The original DropdownItem from the API */
  raw: DropdownItem
}

export interface ProductComboboxProps {
  value: DropdownItem | null
  onSelect: (product: DropdownItem) => void
  onBarcodeScan?: (barcode: string) => void
  autoFocus?: boolean
  mode?: "popover" | "inline"
  placeholder?: string
  className?: string
  disabled?: boolean
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const RECENT_KEY = "minimarket-recent-products"
const MAX_RECENTS = 5

function loadRecents(): DropdownItem[] {
  try {
    const raw = localStorage.getItem(RECENT_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveRecent(product: DropdownItem) {
  try {
    const recents = loadRecents().filter((r) => r.id !== product.id)
    recents.unshift(product)
    localStorage.setItem(
      RECENT_KEY,
      JSON.stringify(recents.slice(0, MAX_RECENTS))
    )
  } catch {
    // localStorage full or unavailable - ignore
  }
}

function toComboboxItem(p: DropdownItem): ProductComboboxItem {
  return {
    id: p.id,
    label: p.nombre,
    searchValue: `${p.nombre} ${p.sku ?? ""} ${p.codigo_barras ?? ""}`,
    keywords: [p.sku, p.codigo_barras].filter(Boolean) as string[],
    sku: p.sku,
    codigo_barras: p.codigo_barras,
    precio_actual: p.precio_actual,
    raw: p,
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ProductCombobox({
  value,
  onSelect,
  onBarcodeScan,
  autoFocus = false,
  mode = "popover",
  placeholder = "Buscar producto...",
  className,
  disabled = false,
}: ProductComboboxProps) {
  const { data: products = [], isLoading } = useQuery({
    queryKey: ["productos", "dropdown"],
    queryFn: () => productosApi.dropdown(),
    staleTime: 2 * 60 * 1000, // 2 min
  })

  const items = React.useMemo(
    () => products.map(toComboboxItem),
    [products]
  )

  const recentItems = React.useMemo(() => {
    const recents = loadRecents()
    return recents
      .map((r) => products.find((p) => p.id === r.id) ?? r)
      .map(toComboboxItem)
  }, [products])

  const selectedItem = React.useMemo(
    () => (value ? toComboboxItem(value) : null),
    [value]
  )

  const handleSelect = React.useCallback(
    (item: ProductComboboxItem) => {
      saveRecent(item.raw)
      onSelect(item.raw)
    },
    [onSelect]
  )

  return (
    <SmartCombobox<ProductComboboxItem>
      items={items}
      value={selectedItem}
      onSelect={handleSelect}
      placeholder={placeholder}
      isLoading={isLoading}
      emptyMessage="Producto no encontrado."
      recentItems={recentItems}
      recentLabel="Recientes"
      detectBarcode={!!onBarcodeScan}
      onBarcodeScan={onBarcodeScan}
      mode={mode}
      autoFocus={autoFocus}
      disabled={disabled}
      className={className}
      label="Seleccionar producto"
      renderItem={(item, isSelected) => (
        <ProductItemRow item={item} isSelected={isSelected} />
      )}
      renderSelectedValue={(item) => (
        <span className="flex items-center gap-2 truncate">
          <Package className="h-3.5 w-3.5 shrink-0 opacity-60" />
          <span className="truncate">{item.label}</span>
          {item.precio_actual != null && (
            <span className="ml-auto text-xs text-muted-foreground shrink-0">
              {money(item.precio_actual)}
            </span>
          )}
        </span>
      )}
    />
  )
}

// ---------------------------------------------------------------------------
// Product item row renderer
// ---------------------------------------------------------------------------

function ProductItemRow({
  item,
  isSelected,
}: {
  item: ProductComboboxItem
  isSelected: boolean
}) {
  return (
    <div className="flex items-center w-full gap-2 min-w-0">
      {isSelected && <Check className="h-4 w-4 shrink-0 text-primary" />}
      <div className="flex flex-col min-w-0 flex-1">
        <span className={cn("truncate text-sm", isSelected && "font-medium")}>
          {item.label}
        </span>
        <span className="text-xs text-muted-foreground truncate">
          {[item.codigo_barras, item.sku].filter(Boolean).join(" · ") || "Sin código"}
        </span>
      </div>
      {item.precio_actual != null && (
        <span className="text-sm font-medium shrink-0 tabular-nums">
          {money(item.precio_actual)}
        </span>
      )}
    </div>
  )
}
