'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Users, Activity, Trophy, AlertTriangle } from 'lucide-react'
import { EquipoStatsCard } from './equipo-stats-card'
import { JugadorPerformanceList } from './jugador-performance-list'
import { ComparativaChart } from './comparativa-chart'
import { ExportButtons } from './export-buttons'
import type { StatsEquipo, PerformanceJugador, ComparativaEquipo } from '../lib/queries'

interface DashboardDeportivoProps {
  stats: StatsEquipo[]
  jugadores: PerformanceJugador[]
  comparativa: ComparativaEquipo[]
}

export function DashboardDeportivo({ stats, jugadores, comparativa }: DashboardDeportivoProps) {
  const [equipoFiltro, setEquipoFiltro] = useState('')

  const totalConvocados = stats.reduce((a, s) => a + Number(s.convocados_activos), 0)
  const totalLesionados = stats.reduce((a, s) => a + Number(s.lesionados_activos), 0)
  const totalTorneos = stats.reduce((a, s) => a + Number(s.torneos_inscriptos_activos), 0)
  const pctLesionados = totalConvocados > 0 ? ((totalLesionados / totalConvocados) * 100).toFixed(1) : '0'

  const jugadoresFiltrados = equipoFiltro
    ? jugadores.filter(j => j.equipo_id === equipoFiltro)
    : jugadores

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h1 className="text-xl sm:text-2xl font-bold">Reportes Deportivos</h1>
        <div className="flex gap-2">
          <Select value={equipoFiltro} onValueChange={v => setEquipoFiltro(v === 'todos' ? '' : (v ?? ''))}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Todos los equipos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los equipos</SelectItem>
              {stats.map(s => (
                <SelectItem key={s.equipo_id} value={s.equipo_id}>{s.equipo_nombre}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <ExportButtons stats={stats} jugadores={jugadoresFiltrados} />
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <SummaryCard icon={<Users className="h-4 w-4" />} label="Equipos activos" value={stats.length} />
        <SummaryCard icon={<Users className="h-4 w-4" />} label="Convocados" value={totalConvocados} />
        <SummaryCard
          icon={<AlertTriangle className="h-4 w-4" />}
          label="Lesionados"
          value={totalLesionados}
          extra={<Badge variant="destructive" className="text-[10px] ml-1">{pctLesionados}%</Badge>}
        />
        <SummaryCard icon={<Trophy className="h-4 w-4" />} label="Torneos" value={totalTorneos} />
      </div>

      {/* Comparativa chart */}
      {comparativa.length > 0 && <ComparativaChart data={comparativa} />}

      {/* Equipos cards */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Por equipo</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {(equipoFiltro ? stats.filter(s => s.equipo_id === equipoFiltro) : stats).map(s => (
            <EquipoStatsCard key={s.equipo_id} stats={s} />
          ))}
        </div>
      </div>

      {/* Jugadores */}
      <JugadorPerformanceList jugadores={jugadoresFiltrados} />
    </div>
  )
}

function SummaryCard({ icon, label, value, extra }: {
  icon: React.ReactNode; label: string; value: number; extra?: React.ReactNode
}) {
  return (
    <Card>
      <CardContent className="pt-4 pb-3 px-4">
        <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
          {icon}
          {label}
        </div>
        <div className="flex items-center">
          <p className="text-2xl font-bold">{value}</p>
          {extra}
        </div>
      </CardContent>
    </Card>
  )
}
