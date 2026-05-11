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

interface Caja {
  id: string
  nombre: string
  tipo: string
  activa: boolean
}

interface Categoria {
  id: string
  nombre: string
  tipo: string
}

interface FiltrosActuales {
  tipo?: string
  desde?: string
  hasta?: string
  caja?: string
  categoria?: string
}

interface MovimientosFiltersProps {
  cajas: Caja[]
  categorias: Categoria[]
  filtrosActuales: FiltrosActuales
}

export function MovimientosFilters({ cajas, categorias, filtrosActuales }: MovimientosFiltersProps) {
  const router = useRouter()

  function updateFilter(key: string, value: string | undefined) {
    const params = new URLSearchParams()
    const current = { ...filtrosActuales, [key]: value }

    Object.entries(current).forEach(([k, v]) => {
      if (v) params.set(k, v)
    })

    router.push(`/admin/finanzas/movimientos${params.toString() ? `?${params}` : ''}`)
  }

  function clearFilters() {
    router.push('/admin/finanzas/movimientos')
  }

  const hasFilters = Object.values(filtrosActuales).some((v) => !!v)

  // Filter categorias by selected tipo
  const categoriasFiltered = filtrosActuales.tipo
    ? categorias.filter((c) => c.tipo === filtrosActuales.tipo)
    : categorias

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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Tipo */}
          <div className="space-y-1">
            <Label className="text-xs">Tipo</Label>
            <Select
              value={filtrosActuales.tipo ?? 'todos'}
              onValueChange={(v) => updateFilter('tipo', !v || v === 'todos' ? undefined : v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="ingreso">Ingreso</SelectItem>
                <SelectItem value="egreso">Egreso</SelectItem>
                <SelectItem value="transferencia">Transferencia</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Fecha desde */}
          <div className="space-y-1">
            <Label className="text-xs">Desde</Label>
            <Input
              type="date"
              value={filtrosActuales.desde ?? ''}
              onChange={(e) => updateFilter('desde', e.target.value || undefined)}
            />
          </div>

          {/* Fecha hasta */}
          <div className="space-y-1">
            <Label className="text-xs">Hasta</Label>
            <Input
              type="date"
              value={filtrosActuales.hasta ?? ''}
              onChange={(e) => updateFilter('hasta', e.target.value || undefined)}
            />
          </div>

          {/* Caja */}
          <div className="space-y-1">
            <Label className="text-xs">Caja</Label>
            <Select
              value={filtrosActuales.caja ?? 'todas'}
              onValueChange={(v) => updateFilter('caja', !v || v === 'todas' ? undefined : v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas</SelectItem>
                {cajas.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Categoria */}
          <div className="space-y-1">
            <Label className="text-xs">Categoria</Label>
            <Select
              value={filtrosActuales.categoria ?? 'todas'}
              onValueChange={(v) => updateFilter('categoria', !v || v === 'todas' ? undefined : v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas</SelectItem>
                {categoriasFiltered.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
