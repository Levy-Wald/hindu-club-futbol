'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
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

export function ContratosFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()

  const modalidad = searchParams.get('modalidad') ?? ''
  const estado = searchParams.get('estado') ?? ''
  const q = searchParams.get('q') ?? ''

  function updateFilter(key: string, value: string | undefined) {
    const params = new URLSearchParams(searchParams.toString())

    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }

    router.push(`${pathname}${params.toString() ? `?${params}` : ''}`)
  }

  function clearFilters() {
    router.push(pathname)
  }

  const hasFilters = modalidad || estado || q

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
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Buscar persona */}
          <div className="space-y-1">
            <Label className="text-xs">Buscar persona</Label>
            <Input
              type="text"
              placeholder="Nombre o apellido..."
              value={q}
              onChange={(e) => updateFilter('q', e.target.value || undefined)}
            />
          </div>

          {/* Modalidad */}
          <div className="space-y-1">
            <Label className="text-xs">Modalidad</Label>
            <Select
              value={modalidad || 'todas'}
              onValueChange={(v) => updateFilter('modalidad', !v || v === 'todas' ? undefined : v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas</SelectItem>
                <SelectItem value="relacion_dependencia">Rel. dependencia</SelectItem>
                <SelectItem value="monotributo">Monotributo</SelectItem>
                <SelectItem value="honorarios">Honorarios</SelectItem>
                <SelectItem value="informal">Informal</SelectItem>
                <SelectItem value="pasantia">Pasantia</SelectItem>
                <SelectItem value="voluntariado">Voluntariado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Estado */}
          <div className="space-y-1">
            <Label className="text-xs">Estado</Label>
            <Select
              value={estado || 'todos'}
              onValueChange={(v) => updateFilter('estado', !v || v === 'todos' ? undefined : v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="vigente">Vigente</SelectItem>
                <SelectItem value="vencido">Vencido</SelectItem>
                <SelectItem value="rescindido">Rescindido</SelectItem>
                <SelectItem value="suspendido">Suspendido</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
