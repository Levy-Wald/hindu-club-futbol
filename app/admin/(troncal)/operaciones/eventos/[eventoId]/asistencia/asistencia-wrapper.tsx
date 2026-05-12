'use client'

import { QueryProvider } from '@/components/providers/query-provider'
import { PantallaAsistencia } from '@/modules/asistencias/ui/pantalla-asistencia'
import type { InvitadosPorCategoria } from '@/modules/asistencias/lib/types'

type Props = {
  eventoId: string
  tenantId: string
  initialData: InvitadosPorCategoria
  eventoInfo: {
    titulo: string | null
    fecha: string | null
    tipo_evento_slug: string
    equipo_nombre: string | null
  }
}

export function AsistenciaWrapper(props: Props) {
  return (
    <QueryProvider>
      <PantallaAsistencia {...props} />
    </QueryProvider>
  )
}
