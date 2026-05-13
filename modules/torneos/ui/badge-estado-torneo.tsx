'use client'

import { Badge } from '@/components/ui/badge'
import type { EstadoTorneo } from '../lib/types'

const ESTADO_CONFIG: Record<
  EstadoTorneo,
  { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }
> = {
  planificado: { label: 'Planificado', variant: 'secondary' },
  inscripcion: { label: 'Inscripcion', variant: 'outline' },
  en_curso: { label: 'En curso', variant: 'default' },
  finalizado: { label: 'Finalizado', variant: 'secondary' },
  cancelado: { label: 'Cancelado', variant: 'destructive' },
}

export function BadgeEstadoTorneo({ estado }: { estado: EstadoTorneo }) {
  const config = ESTADO_CONFIG[estado] ?? { label: estado, variant: 'secondary' as const }
  return <Badge variant={config.variant}>{config.label}</Badge>
}
