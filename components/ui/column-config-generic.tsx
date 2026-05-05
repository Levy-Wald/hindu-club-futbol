'use client'

import { useCallback, useEffect, useState } from 'react'
import { Settings2 } from 'lucide-react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'

interface ColumnDef {
  id: string
  label: string
}

interface ColumnConfigProps {
  storageKey: string
  columns: ColumnDef[]
}

function getStoredColumns(storageKey: string, allIds: string[]): string[] {
  if (typeof window === 'undefined') return allIds
  try {
    const stored = localStorage.getItem(storageKey)
    if (!stored) return allIds
    const parsed = JSON.parse(stored) as string[]
    return parsed.filter((id) => allIds.includes(id))
  } catch {
    return allIds
  }
}

export function useGenericColumnConfig(storageKey: string, columns: ColumnDef[]) {
  const allIds = columns.map((c) => c.id)
  const [visibleColumns, setVisibleColumns] = useState<string[]>(allIds)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setVisibleColumns(getStoredColumns(storageKey, allIds))
    setHydrated(true)
  }, [storageKey])

  useEffect(() => {
    if (!hydrated) return
    const eventName = `${storageKey}-changed`
    const handleChange = () => setVisibleColumns(getStoredColumns(storageKey, allIds))
    window.addEventListener(eventName, handleChange)
    window.addEventListener('storage', handleChange)
    return () => {
      window.removeEventListener(eventName, handleChange)
      window.removeEventListener('storage', handleChange)
    }
  }, [hydrated, storageKey])

  const isVisible = useCallback(
    (col: string) => visibleColumns.includes(col),
    [visibleColumns]
  )

  return { visibleColumns, isVisible }
}

export function GenericColumnConfig({ storageKey, columns }: ColumnConfigProps) {
  const allIds = columns.map((c) => c.id)
  const [visibleColumns, setVisibleColumns] = useState<string[]>(allIds)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setVisibleColumns(getStoredColumns(storageKey, allIds))
    setHydrated(true)
  }, [storageKey])

  const toggleColumn = (columnId: string, checked: boolean) => {
    const updated = checked
      ? [...visibleColumns, columnId]
      : visibleColumns.filter((id) => id !== columnId)

    setVisibleColumns(updated)
    localStorage.setItem(storageKey, JSON.stringify(updated))
    window.dispatchEvent(new Event(`${storageKey}-changed`))
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
          {columns.map((col) => (
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
