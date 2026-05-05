import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { fetchEquipoDetalle, fetchRolesEquipo } from '../_lib/queries'
import { Plantel } from './_components/plantel'

const DIAS_SEMANA = ['', 'Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado', 'Domingo']

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function EquipoDetallePage({ params }: PageProps) {
  const { id } = await params

  let equipo
  try {
    equipo = await fetchEquipoDetalle(id)
  } catch {
    notFound()
  }

  const roles = await fetchRolesEquipo()

  const categoria = equipo.categoria as {
    nombre_display: string
    disciplina_slug: string
    modalidad: string | null
  } | null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Link href="/admin/equipos">
          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold truncate">{equipo.nombre}</h1>
          <div className="flex flex-wrap items-center gap-2 mt-1 text-sm text-muted-foreground">
            {categoria && <span>{categoria.nombre_display}</span>}
            <span>{equipo.disciplina_slug}</span>
            {equipo.modalidad && <span>({equipo.modalidad})</span>}
          </div>
        </div>
        <Badge variant={equipo.activo ? 'default' : 'secondary'}>
          {equipo.activo ? 'activo' : 'inactivo'}
        </Badge>
      </div>

      {/* Plantel */}
      <Plantel
        equipoId={equipo.id}
        miembros={equipo.miembros as never[]}
        roles={roles}
      />

      {/* Horarios */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Horarios</h2>
        {equipo.horarios.length === 0 ? (
          <p className="text-center text-muted-foreground py-6">No hay horarios cargados.</p>
        ) : (
          <div className="rounded-md border divide-y">
            {equipo.horarios.map((h) => (
              <div key={h.id} className="flex items-center justify-between p-3">
                <div>
                  <p className="font-medium">{DIAS_SEMANA[h.dia_semana ?? 0] ?? `Dia ${h.dia_semana}`}</p>
                  <p className="text-sm text-muted-foreground">
                    {h.hora_inicio?.slice(0, 5)} - {h.hora_fin?.slice(0, 5)}
                  </p>
                </div>
                <Badge variant="outline">{h.tipo_actividad ?? 'otro'}</Badge>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
