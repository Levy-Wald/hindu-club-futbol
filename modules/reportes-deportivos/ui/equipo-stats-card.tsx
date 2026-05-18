'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Users, AlertTriangle, Trophy, Activity } from 'lucide-react'
import type { StatsEquipo } from '../lib/queries'

interface EquipoStatsCardProps {
  stats: StatsEquipo
}

export function EquipoStatsCard({ stats }: EquipoStatsCardProps) {
  const asist = Number(stats.asistencia_promedio_30d)
  const asistLabel = asist > 0 ? `${asist.toFixed(0)}%` : '—'

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold flex items-center justify-between">
          <span className="truncate">{stats.equipo_nombre}</span>
          <Badge variant="outline" className="capitalize shrink-0 ml-2">{stats.disciplina_slug}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-2 gap-3">
          <Stat icon={<Users className="h-3 w-3" />} label="Convocados" value={stats.convocados_activos} />
          <Stat
            icon={<AlertTriangle className="h-3 w-3" />}
            label="Lesionados"
            value={stats.lesionados_activos}
            variant={Number(stats.lesionados_activos) > 0 ? 'destructive' : undefined}
          />
          <Stat icon={<Activity className="h-3 w-3" />} label="Asist. 30d" value={asistLabel} />
          <Stat icon={<Trophy className="h-3 w-3" />} label="Torneos" value={stats.torneos_inscriptos_activos} />
        </div>
      </CardContent>
    </Card>
  )
}

function Stat({ icon, label, value, variant }: {
  icon: React.ReactNode; label: string; value: string | number; variant?: 'destructive'
}) {
  return (
    <div className="space-y-0.5">
      <div className="flex items-center gap-1 text-[10px] text-muted-foreground">{icon}{label}</div>
      <p className={`text-lg font-bold ${variant === 'destructive' ? 'text-destructive' : ''}`}>{value}</p>
    </div>
  )
}
