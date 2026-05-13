'use client'

import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { Federacion } from '../lib/types'

export function FiltrosTorneos({
  filtroTipo,
  setFiltroTipo,
  filtroEstado,
  setFiltroEstado,
  filtroFederacion,
  setFiltroFederacion,
  busqueda,
  setBusqueda,
  federaciones,
}: {
  filtroTipo: string
  setFiltroTipo: (v: string) => void
  filtroEstado: string
  setFiltroEstado: (v: string) => void
  filtroFederacion: string
  setFiltroFederacion: (v: string) => void
  busqueda: string
  setBusqueda: (v: string) => void
  federaciones: Federacion[]
}) {
  return (
    <div className="flex flex-wrap gap-3">
      <Select
        value={filtroTipo}
        onValueChange={(v) => setFiltroTipo(v === '__all__' ? '' : (v ?? ''))}
      >
        <SelectTrigger className="w-[150px]" data-testid="filtro-tipo">
          <SelectValue placeholder="Tipo" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__all__">Todos</SelectItem>
          <SelectItem value="interno">Interno</SelectItem>
          <SelectItem value="externo">Externo</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={filtroEstado}
        onValueChange={(v) => setFiltroEstado(v === '__all__' ? '' : (v ?? ''))}
      >
        <SelectTrigger className="w-[160px]" data-testid="filtro-estado">
          <SelectValue placeholder="Estado" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__all__">Todos</SelectItem>
          <SelectItem value="planificado">Planificado</SelectItem>
          <SelectItem value="inscripcion">Inscripcion</SelectItem>
          <SelectItem value="en_curso">En curso</SelectItem>
          <SelectItem value="finalizado">Finalizado</SelectItem>
          <SelectItem value="cancelado">Cancelado</SelectItem>
        </SelectContent>
      </Select>

      {federaciones.length > 0 && (
        <Select
          value={filtroFederacion}
          onValueChange={(v) => setFiltroFederacion(v === '__all__' ? '' : (v ?? ''))}
        >
          <SelectTrigger className="w-[180px]" data-testid="filtro-federacion">
            <SelectValue placeholder="Federacion" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Todas</SelectItem>
            {federaciones.map((f) => (
              <SelectItem key={f.id} value={f.id}>
                {f.nombre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      <Input
        placeholder="Buscar por nombre..."
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
        className="w-[200px]"
        data-testid="input-busqueda"
      />
    </div>
  )
}
