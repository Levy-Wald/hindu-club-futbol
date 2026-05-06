'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Filter, X } from 'lucide-react'

interface FiltrosActuales {
  periodo?: string
  estado?: string
  q?: string
}

interface LiquidacionesFiltersProps {
  filtrosActuales: FiltrosActuales
}

export function LiquidacionesFilters({ filtrosActuales }: LiquidacionesFiltersProps) {
  const router = useRouter()

  function updateFilter(key: string, value: string | undefined) {
    const params = new URLSearchParams()
    const current = { ...filtrosActuales, [key]: value }

    Object.entries(current).forEach(([k, v]) => {
      if (v) params.set(k, v)
    })

    router.push(`/admin/rrhh/liquidaciones${params.toString() ? `?${params}` : ''}`)
  }

  function clearFilters() {
    router.push('/admin/rrhh/liquidaciones')
  }

  const hasFilters = Object.values(filtrosActuales).some((v) => !!v)

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Filtros</span>
          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="ml-auto">
              <X className="h-3.5 w-3.5 mr-1" />
              Limpiar
            </Button>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {/* Periodo */}
          <div className="space-y-1">
            <Label className="text-xs">Periodo</Label>
            <Input
              type="month"
              value={filtrosActuales.periodo ?? ''}
              onChange={(e) => updateFilter('periodo', e.target.value || undefined)}
            />
          </div>

          {/* Estado */}
          <div className="space-y-1">
            <Label className="text-xs">Estado</Label>
            <Select
              value={filtrosActuales.estado ?? 'todos'}
              onValueChange={(v) => updateFilter('estado', !v || v === 'todos' ? undefined : v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="borrador">Borrador</SelectItem>
                <SelectItem value="aprobada">Aprobada</SelectItem>
                <SelectItem value="pagada">Pagada</SelectItem>
                <SelectItem value="anulada">Anulada</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Buscar persona */}
          <div className="space-y-1">
            <Label className="text-xs">Buscar persona</Label>
            <Input
              type="text"
              placeholder="Nombre o apellido..."
              value={filtrosActuales.q ?? ''}
              onChange={(e) => updateFilter('q', e.target.value || undefined)}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
