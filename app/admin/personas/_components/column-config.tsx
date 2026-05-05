"use client"

import { useCallback, useEffect, useState } from "react"
import { Settings2 } from "lucide-react"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"

const STORAGE_KEY = "personas-columns"

const AVAILABLE_COLUMNS = [
  { id: "documento", label: "Documento" },
  { id: "email", label: "Email" },
  { id: "telefono", label: "Teléfono" },
  { id: "roles", label: "Roles" },
  { id: "estado", label: "Estado" },
] as const

type ColumnId = (typeof AVAILABLE_COLUMNS)[number]["id"]

const ALL_COLUMN_IDS: ColumnId[] = AVAILABLE_COLUMNS.map((c) => c.id)

function getStoredColumns(): ColumnId[] {
  if (typeof window === "undefined") return ALL_COLUMN_IDS
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return ALL_COLUMN_IDS
    const parsed = JSON.parse(stored) as string[]
    // Filtrar solo IDs válidos
    return parsed.filter((id): id is ColumnId =>
      ALL_COLUMN_IDS.includes(id as ColumnId)
    )
  } catch {
    return ALL_COLUMN_IDS
  }
}

export function useColumnConfig() {
  const [visibleColumns, setVisibleColumns] = useState<ColumnId[]>(ALL_COLUMN_IDS)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setVisibleColumns(getStoredColumns())
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (!hydrated) return

    const handleStorage = () => {
      setVisibleColumns(getStoredColumns())
    }
    window.addEventListener("storage", handleStorage)
    // Escuchar evento custom para sincronizar dentro de la misma tab
    window.addEventListener("personas-columns-changed", handleStorage)
    return () => {
      window.removeEventListener("storage", handleStorage)
      window.removeEventListener("personas-columns-changed", handleStorage)
    }
  }, [hydrated])

  const isVisible = useCallback(
    (col: string) => visibleColumns.includes(col as ColumnId),
    [visibleColumns]
  )

  return { visibleColumns, isVisible }
}

export function ColumnConfig() {
  const [visibleColumns, setVisibleColumns] = useState<ColumnId[]>(ALL_COLUMN_IDS)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setVisibleColumns(getStoredColumns())
    setHydrated(true)
  }, [])

  const toggleColumn = (columnId: ColumnId, checked: boolean) => {
    const updated = checked
      ? [...visibleColumns, columnId]
      : visibleColumns.filter((id) => id !== columnId)

    setVisibleColumns(updated)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    window.dispatchEvent(new Event("personas-columns-changed"))
  }

  if (!hydrated) return null

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button variant="outline" size="sm">
            <Settings2 className="h-4 w-4" />
          </Button>
        }
      />
      <PopoverContent align="end" className="w-48">
        <p className="mb-2 font-medium text-sm">Columnas visibles</p>
        <div className="flex flex-col gap-2">
          {AVAILABLE_COLUMNS.map((col) => (
            <label
              key={col.id}
              className="flex cursor-pointer items-center gap-2 text-sm"
            >
              <Checkbox
                checked={visibleColumns.includes(col.id)}
                onCheckedChange={(checked) =>
                  toggleColumn(col.id, checked as boolean)
                }
              />
              {col.label}
            </label>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}
