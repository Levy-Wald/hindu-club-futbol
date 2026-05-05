'use client'

import { useCallback, useEffect, useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Settings2, Save, Trash2, Star, StarOff } from 'lucide-react'
import { toast } from 'sonner'
import type { ColumnModule } from '@/lib/vistas/column-defs'
import { fetchVistas, guardarVista, eliminarVista, setVistaDefault } from '@/lib/vistas/actions'
import type { Vista } from '@/lib/vistas/actions'

interface VistasPanelProps {
  modulo: string
  modules: ColumnModule[]
  defaultColumns: string[]
  storageKey: string
}

function getStoredColumns(storageKey: string, defaultColumns: string[]): string[] {
  if (typeof window === 'undefined') return defaultColumns
  try {
    const stored = localStorage.getItem(storageKey)
    if (!stored) return defaultColumns
    return JSON.parse(stored) as string[]
  } catch {
    return defaultColumns
  }
}

export function useVistasColumns(storageKey: string, defaultColumns: string[]) {
  const [visibleColumns, setVisibleColumns] = useState<string[]>(defaultColumns)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setVisibleColumns(getStoredColumns(storageKey, defaultColumns))
    setHydrated(true)
  }, [storageKey])

  useEffect(() => {
    if (!hydrated) return
    const eventName = `${storageKey}-changed`
    const handleChange = () => setVisibleColumns(getStoredColumns(storageKey, defaultColumns))
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

  return { visibleColumns, isVisible, hydrated }
}

export function VistasPanel({ modulo, modules, defaultColumns, storageKey }: VistasPanelProps) {
  const [open, setOpen] = useState(false)
  const [visibleColumns, setVisibleColumns] = useState<string[]>(defaultColumns)
  const [vistas, setVistas] = useState<Vista[]>([])
  const [nombreVista, setNombreVista] = useState('')
  const [isPending, startTransition] = useTransition()
  const [hydrated, setHydrated] = useState(false)

  const allColumnIds = modules.flatMap((m) => m.columns.map((c) => c.id))

  useEffect(() => {
    setVisibleColumns(getStoredColumns(storageKey, defaultColumns))
    setHydrated(true)
  }, [storageKey])

  useEffect(() => {
    if (open) {
      startTransition(async () => {
        const data = await fetchVistas(modulo)
        setVistas(data)
      })
    }
  }, [open, modulo])

  function applyColumns(cols: string[]) {
    setVisibleColumns(cols)
    localStorage.setItem(storageKey, JSON.stringify(cols))
    window.dispatchEvent(new Event(`${storageKey}-changed`))
  }

  function toggleColumn(id: string) {
    const updated = visibleColumns.includes(id)
      ? visibleColumns.filter((c) => c !== id)
      : [...visibleColumns, id]
    applyColumns(updated)
  }

  function toggleModule(moduleKey: string) {
    const mod = modules.find((m) => m.key === moduleKey)
    if (!mod) return
    const modIds = mod.columns.map((c) => c.id)
    const allChecked = modIds.every((id) => visibleColumns.includes(id))
    const updated = allChecked
      ? visibleColumns.filter((c) => !modIds.includes(c))
      : [...new Set([...visibleColumns, ...modIds])]
    applyColumns(updated)
  }

  function selectAll() {
    applyColumns(allColumnIds)
  }

  function selectDefaults() {
    applyColumns(defaultColumns)
  }

  function handleLoadVista(vista: Vista) {
    applyColumns(vista.columnas)
    toast.success(`Vista "${vista.nombre}" aplicada`)
  }

  function handleSaveVista() {
    if (!nombreVista.trim()) return
    startTransition(async () => {
      const result = await guardarVista({
        modulo,
        nombre: nombreVista,
        columnas: visibleColumns,
      })
      if (result.ok) {
        toast.success('Vista guardada')
        setNombreVista('')
        const data = await fetchVistas(modulo)
        setVistas(data)
      } else {
        toast.error(result.message)
      }
    })
  }

  function handleDeleteVista(id: string) {
    startTransition(async () => {
      const result = await eliminarVista(id)
      if (result.ok) {
        toast.success('Vista eliminada')
        setVistas((prev) => prev.filter((v) => v.id !== id))
      } else {
        toast.error(result.message)
      }
    })
  }

  function handleSetDefault(id: string) {
    startTransition(async () => {
      const result = await setVistaDefault(id, modulo)
      if (result.ok) {
        toast.success('Vista por defecto actualizada')
        const data = await fetchVistas(modulo)
        setVistas(data)
      }
    })
  }

  if (!hydrated) return null

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger render={<Button variant="outline" size="sm" title="Configurar vista" />}>
        <Settings2 className="h-4 w-4 sm:mr-2" />
        <span className="hidden sm:inline">Vistas</span>
      </SheetTrigger>
      <SheetContent className="w-[340px] sm:w-[400px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Configurar vista</SheetTitle>
        </SheetHeader>

        <div className="mt-4 space-y-4">
          {/* Vistas guardadas */}
          {vistas.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Vistas guardadas</p>
              <div className="space-y-1">
                {vistas.map((v) => (
                  <div key={v.id} className="flex items-center gap-2 rounded border px-2 py-1.5">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex-1 justify-start h-auto py-0 px-1 font-normal"
                      onClick={() => handleLoadVista(v)}
                    >
                      {v.nombre}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => handleSetDefault(v.id)}
                      title={v.es_default ? 'Es la vista por defecto' : 'Hacer por defecto'}
                    >
                      {v.es_default ? <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" /> : <StarOff className="h-3 w-3" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-destructive"
                      onClick={() => handleDeleteVista(v.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Guardar nueva vista */}
          <div className="flex items-center gap-2">
            <Input
              placeholder="Nombre de la vista"
              value={nombreVista}
              onChange={(e) => setNombreVista(e.target.value)}
              className="h-8 text-sm"
              onKeyDown={(e) => e.key === 'Enter' && handleSaveVista()}
            />
            <Button
              size="sm"
              variant="outline"
              onClick={handleSaveVista}
              disabled={!nombreVista.trim() || isPending}
            >
              <Save className="h-3.5 w-3.5" />
            </Button>
          </div>

          {/* Quick actions */}
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={selectAll} className="text-xs">
              Todo
            </Button>
            <Button variant="outline" size="sm" onClick={selectDefaults} className="text-xs">
              Por defecto
            </Button>
            <span className="text-xs text-muted-foreground ml-auto self-center">
              {visibleColumns.length}/{allColumnIds.length}
            </span>
          </div>

          {/* Modules with columns */}
          <div className="space-y-3">
            {modules.map((mod) => {
              const modIds = mod.columns.map((c) => c.id)
              const allChecked = modIds.every((id) => visibleColumns.includes(id))
              const someChecked = modIds.some((id) => visibleColumns.includes(id))

              return (
                <div key={mod.key} className="rounded border p-2.5">
                  <label className="flex items-center gap-2 cursor-pointer mb-2">
                    <Checkbox
                      checked={allChecked}
                      indeterminate={!allChecked && someChecked}
                      onCheckedChange={() => toggleModule(mod.key)}
                    />
                    <span className="text-sm font-medium">{mod.label}</span>
                  </label>
                  <div className="grid grid-cols-1 gap-1 pl-6">
                    {mod.columns.map((col) => (
                      <label key={col.id} className="flex items-center gap-2 text-sm cursor-pointer">
                        <Checkbox
                          checked={visibleColumns.includes(col.id)}
                          onCheckedChange={() => toggleColumn(col.id)}
                        />
                        {col.label}
                      </label>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
