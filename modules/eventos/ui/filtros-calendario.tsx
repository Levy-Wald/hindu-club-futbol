'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const TIPOS_EVENTO = [
  { slug: '', nombre: 'Todos los tipos' },
  { slug: 'entrenamiento', nombre: 'Entrenamiento' },
  { slug: 'partido', nombre: 'Partido' },
  { slug: 'amistoso', nombre: 'Amistoso' },
  { slug: 'reunion', nombre: 'Reunion' },
  { slug: 'vencimiento', nombre: 'Vencimiento' },
  { slug: 'reserva', nombre: 'Reserva' },
  { slug: 'otro', nombre: 'Otro' },
]

const MODULOS_ORIGEN = [
  { slug: '', nombre: 'Todos los origenes' },
  { slug: 'manual', nombre: 'Manual' },
  { slug: 'equipos', nombre: 'Equipos' },
  { slug: 'finanzas', nombre: 'Finanzas' },
  { slug: 'proyectos', nombre: 'Proyectos' },
]

export function FiltrosCalendario({
  equipos,
  tenantId,
}: {
  equipos: { id: string; nombre: string }[]
  tenantId: string
}) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const tipoActual = searchParams.get('tipo') ?? ''
  const moduloActual = searchParams.get('modulo') ?? ''
  const equipoActual = searchParams.get('equipo') ?? ''

  function updateFilter(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    router.push(`/admin/${tenantId}/calendario?${params.toString()}`)
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Select value={tipoActual} onValueChange={(v) => updateFilter('tipo', v)}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Todos los tipos" />
        </SelectTrigger>
        <SelectContent>
          {TIPOS_EVENTO.map((t) => (
            <SelectItem key={t.slug || '__all'} value={t.slug}>{t.nombre}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={moduloActual} onValueChange={(v) => updateFilter('modulo', v)}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Todos los origenes" />
        </SelectTrigger>
        <SelectContent>
          {MODULOS_ORIGEN.map((m) => (
            <SelectItem key={m.slug || '__all'} value={m.slug}>{m.nombre}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {equipos.length > 0 && (
        <Select value={equipoActual} onValueChange={(v) => updateFilter('equipo', v)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Todos los equipos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todos los equipos</SelectItem>
            {equipos.map((eq) => (
              <SelectItem key={eq.id} value={eq.id}>{eq.nombre}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  )
}
