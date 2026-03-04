import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import { Check, Truck } from "lucide-react"

import { proveedoresApi, type DropdownItem } from "@/lib/apiClient"
import { cn } from "@/lib/utils"
import {
  SmartCombobox,
  type SmartComboboxItem,
} from "@/components/ui/smart-combobox"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SupplierComboboxItem extends SmartComboboxItem {
  raw: DropdownItem
}

export interface SupplierComboboxProps {
  value: string | null  // proveedor_id
  onSelect: (id: string, nombre: string) => void
  autoFocus?: boolean
  placeholder?: string
  className?: string
  disabled?: boolean
  /** Allow clearing (shows empty option) */
  allowClear?: boolean
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toComboboxItem(p: DropdownItem): SupplierComboboxItem {
  return {
    id: p.id,
    label: p.nombre,
    searchValue: p.nombre,
    raw: p,
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function SupplierCombobox({
  value,
  onSelect,
  autoFocus = false,
  placeholder = "Seleccionar proveedor...",
  className,
  disabled = false,
}: SupplierComboboxProps) {
  const { data: suppliers = [], isLoading } = useQuery({
    queryKey: ["proveedores", "dropdown"],
    queryFn: () => proveedoresApi.dropdown(),
    staleTime: 5 * 60 * 1000, // 5 min
  })

  const items = React.useMemo(
    () => suppliers.map(toComboboxItem),
    [suppliers]
  )

  const selectedItem = React.useMemo(() => {
    if (!value) return null
    const found = suppliers.find((s) => s.id === value)
    return found ? toComboboxItem(found) : null
  }, [value, suppliers])

  const handleSelect = React.useCallback(
    (item: SupplierComboboxItem) => {
      onSelect(item.raw.id, item.raw.nombre)
    },
    [onSelect]
  )

  return (
    <SmartCombobox<SupplierComboboxItem>
      items={items}
      value={selectedItem}
      onSelect={handleSelect}
      placeholder={placeholder}
      isLoading={isLoading}
      emptyMessage="Proveedor no encontrado."
      mode="popover"
      autoFocus={autoFocus}
      disabled={disabled}
      className={className}
      label="Seleccionar proveedor"
      renderItem={(item, isSelected) => (
        <div className="flex items-center w-full gap-2">
          {isSelected && <Check className="h-4 w-4 shrink-0 text-primary" />}
          <Truck className="h-3.5 w-3.5 shrink-0 opacity-50" />
          <span className={cn("truncate text-sm", isSelected && "font-medium")}>
            {item.label}
          </span>
        </div>
      )}
      renderSelectedValue={(item) => (
        <span className="flex items-center gap-2 truncate">
          <Truck className="h-3.5 w-3.5 shrink-0 opacity-60" />
          <span className="truncate">{item.label}</span>
        </span>
      )}
    />
  )
}
