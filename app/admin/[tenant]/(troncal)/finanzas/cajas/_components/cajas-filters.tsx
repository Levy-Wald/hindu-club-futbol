'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'
import { TIPOS_CAJA, TIPOS_FISCAL } from '@/modules/finanzas/lib/tipos'

interface CajasFiltersProps {
  entidades: { id: string; nombre: string; tipo: string }[]
  actividades: string[]
  currentFilters: {
    tipo?: string
    tipo_fiscal?: string
    entidad_id?: string
    actividad_slug?: string
    estado?: string
    busqueda?: string
  }
}

export function CajasFilters({ entidades, actividades, currentFilters }: CajasFiltersProps) {
  const router = useRouter()
  const pathname = usePathname()

  function updateFilter(key: string, value: string) {
    const params = new URLSearchParams()
    const current = { ...currentFilters, [key]: value }
    for (const [k, v] of Object.entries(current)) {
      if (v) params.set(k, v)
    }
    // Remove empty values
    if (!value) params.delete(key)
    router.push(`${pathname}?${params.toString()}`)
  }

  function clearFilters() {
    router.push(pathname)
  }

  const hasFilters = !!(currentFilters.tipo || currentFilters.tipo_fiscal || currentFilters.entidad_id || currentFilters.actividad_slug || (currentFilters.estado && currentFilters.estado !== 'no_eliminada') || currentFilters.busqueda)

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="w-full sm:w-48">
        <Input
          placeholder="Buscar por nombre..."
          defaultValue={currentFilters.busqueda ?? ''}
          onChange={e => {
            const val = e.target.value
            // Debounce: only navigate after user stops typing
            const timeout = setTimeout(() => updateFilter('busqueda', val), 400)
            return () => clearTimeout(timeout)
          }}
        />
      </div>
      <div className="w-36">
        <Select value={currentFilters.tipo ?? ''} onValueChange={v => updateFilter('tipo', v ?? '')}>
          <SelectTrigger><SelectValue placeholder="Tipo" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todos</SelectItem>
            {TIPOS_CAJA.map(t => (
              <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="w-36">
        <Select value={currentFilters.tipo_fiscal ?? ''} onValueChange={v => updateFilter('tipo_fiscal', v ?? '')}>
          <SelectTrigger><SelectValue placeholder="Tipo fiscal" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todos</SelectItem>
            {TIPOS_FISCAL.map(t => (
              <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {entidades.length > 0 && (
        <div className="w-44">
          <Select value={currentFilters.entidad_id ?? ''} onValueChange={v => updateFilter('entidad_id', v ?? '')}>
            <SelectTrigger><SelectValue placeholder="Entidad" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todas</SelectItem>
              {entidades.map(e => (
                <SelectItem key={e.id} value={e.id}>{e.nombre}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      {actividades.length > 0 && (
        <div className="w-40">
          <Select value={currentFilters.actividad_slug ?? ''} onValueChange={v => updateFilter('actividad_slug', v ?? '')}>
            <SelectTrigger><SelectValue placeholder="Actividad" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todas</SelectItem>
              {actividades.map(a => (
                <SelectItem key={a} value={a}>{a}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      <div className="w-36">
        <Select value={currentFilters.estado ?? 'no_eliminada'} onValueChange={v => updateFilter('estado', v ?? 'no_eliminada')}>
          <SelectTrigger><SelectValue placeholder="Estado" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="no_eliminada">Activas + Inactivas</SelectItem>
            <SelectItem value="activa">Solo activas</SelectItem>
            <SelectItem value="inactiva">Solo inactivas</SelectItem>
            <SelectItem value="eliminada">Eliminadas</SelectItem>
            <SelectItem value="todas">Todas</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={clearFilters}>
          <X className="h-4 w-4 mr-1" />
          Limpiar
        </Button>
      )}
    </div>
  )
}
