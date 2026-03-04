import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import { Check, User, AlertTriangle } from "lucide-react"

import { clientesApi, type ClienteSaldoItem } from "@/lib/apiClient"
import { money } from "@/utils/currency"
import { cn } from "@/lib/utils"
import { useDebounced } from "@/hooks/useDebounced"
import {
  SmartCombobox,
  type SmartComboboxItem,
} from "@/components/ui/smart-combobox"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ClienteComboboxItem extends SmartComboboxItem {
  telefono: string | null
  email: string | null
  saldo: number
  limite_credito: number | null
  direccion_default: string | null
  whatsapp_e164: string | null
  raw: ClienteSaldoItem
}

export interface ClienteComboboxProps {
  value: ClienteSaldoItem | null
  onSelect: (client: ClienteSaldoItem) => void
  onCreateNew?: (name: string) => void
  autoFocus?: boolean
  mode?: "popover" | "inline"
  placeholder?: string
  className?: string
  disabled?: boolean
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toComboboxItem(c: ClienteSaldoItem): ClienteComboboxItem {
  return {
    id: c.cliente_id,
    label: c.nombre,
    searchValue: `${c.nombre} ${c.telefono ?? ""} ${c.email ?? ""}`,
    keywords: [c.telefono, c.email].filter(Boolean) as string[],
    telefono: c.telefono,
    email: c.email,
    saldo: c.saldo,
    limite_credito: c.limite_credito,
    direccion_default: c.direccion_default,
    whatsapp_e164: c.whatsapp_e164,
    raw: c,
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ClienteCombobox({
  value,
  onSelect,
  onCreateNew,
  autoFocus = false,
  mode = "popover",
  placeholder = "Buscar cliente...",
  className,
  disabled = false,
}: ClienteComboboxProps) {
  const [search, setSearch] = React.useState("")
  const debouncedSearch = useDebounced(search, 200)

  const { data: clients = [], isLoading } = useQuery({
    queryKey: ["clientes", "combobox", debouncedSearch],
    queryFn: () =>
      clientesApi.list({
        q: debouncedSearch || undefined,
        limit: 50,
      }),
    staleTime: 30 * 1000, // 30s
  })

  const items = React.useMemo(
    () => clients.map(toComboboxItem),
    [clients]
  )

  const selectedItem = React.useMemo(
    () => (value ? toComboboxItem(value) : null),
    [value]
  )

  const handleSelect = React.useCallback(
    (item: ClienteComboboxItem) => {
      onSelect(item.raw)
    },
    [onSelect]
  )

  return (
    <SmartCombobox<ClienteComboboxItem>
      items={items}
      value={selectedItem}
      onSelect={handleSelect}
      placeholder={placeholder}
      onSearchChange={setSearch}
      isLoading={isLoading}
      emptyMessage="Cliente no encontrado."
      shouldFilter={false}
      mode={mode}
      autoFocus={autoFocus}
      disabled={disabled}
      className={className}
      label="Seleccionar cliente"
      onCreateNew={onCreateNew}
      createNewLabel={(q) => `Crear cliente "${q}"`}
      renderItem={(item, isSelected) => (
        <ClienteItemRow item={item} isSelected={isSelected} />
      )}
      renderSelectedValue={(item) => (
        <span className="flex items-center gap-2 truncate">
          <User className="h-3.5 w-3.5 shrink-0 opacity-60" />
          <span className="truncate">{item.label}</span>
          {item.saldo > 0 && (
            <span className="ml-auto text-xs text-red-600 shrink-0 font-medium">
              {money(item.saldo)}
            </span>
          )}
        </span>
      )}
    />
  )
}

// ---------------------------------------------------------------------------
// Client item row renderer
// ---------------------------------------------------------------------------

function ClienteItemRow({
  item,
  isSelected,
}: {
  item: ClienteComboboxItem
  isSelected: boolean
}) {
  const saldoPct =
    item.limite_credito && item.limite_credito > 0
      ? (item.saldo / item.limite_credito) * 100
      : 0

  return (
    <div className="flex items-center w-full gap-2 min-w-0">
      {isSelected && <Check className="h-4 w-4 shrink-0 text-primary" />}
      <div className="flex flex-col min-w-0 flex-1">
        <span className={cn("truncate text-sm", isSelected && "font-medium")}>
          {item.label}
        </span>
        <span className="text-xs text-muted-foreground truncate">
          {item.telefono ?? item.email ?? "Sin contacto"}
        </span>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        {item.saldo > 0 && (
          <span
            className={cn(
              "text-xs font-medium tabular-nums",
              saldoPct >= 100
                ? "text-red-600"
                : saldoPct >= 80
                  ? "text-amber-600"
                  : "text-muted-foreground"
            )}
          >
            {money(item.saldo)}
          </span>
        )}
        {saldoPct >= 100 && (
          <AlertTriangle className="h-3.5 w-3.5 text-red-500" />
        )}
      </div>
    </div>
  )
}
