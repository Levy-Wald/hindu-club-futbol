'use client'

import { useState, useEffect, useTransition } from 'react'
import { Loader2, BarChart3 } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { obtenerStatsEquiposAction, type StatsEquipo } from '../lib/stats-actions'

export function PantallaStatsEquipos({
  torneos,
}: {
  torneos: { id: string; nombre: string }[]
}) {
  const [isPending, startTransition] = useTransition()
  const [equipos, setEquipos] = useState<StatsEquipo[]>([])
  const [torneoId, setTorneoId] = useState('')

  useEffect(() => {
    startTransition(async () => {
      const res = await obtenerStatsEquiposAction({
        torneo_id: torneoId || undefined,
      })
      if (res.ok) setEquipos(res.equipos)
    })
  }, [torneoId])

  return (
    <div data-testid="pantalla-stats-equipos">
      <div className="flex items-center gap-3 mb-6">
        <BarChart3 className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Estadísticas por equipo</h1>
      </div>

      <div className="flex items-center gap-3 mb-4">
        {torneos.length > 0 && (
          <Select value={torneoId} onValueChange={(v) => setTorneoId(v === '__all__' ? '' : (v ?? ''))}>
            <SelectTrigger className="w-52">
              <SelectValue placeholder="Todos los torneos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">Todos los torneos</SelectItem>
              {torneos.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        {isPending && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
      </div>

      {equipos.length === 0 && !isPending && (
        <div className="rounded-lg border p-8 text-center text-muted-foreground">
          <BarChart3 className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>No hay estadísticas cargadas aún.</p>
        </div>
      )}

      {equipos.length > 0 && (
        <div className="rounded-lg border overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-3 py-2 text-left w-10">#</th>
                <th className="px-3 py-2 text-left">Equipo</th>
                <th className="px-3 py-2 text-center w-10">PJ</th>
                <th className="px-3 py-2 text-center w-10">G</th>
                <th className="px-3 py-2 text-center w-10">A</th>
                <th className="px-3 py-2 text-center w-10">TA</th>
                <th className="px-3 py-2 text-center w-10">TR</th>
              </tr>
            </thead>
            <tbody>
              {equipos.map((e, i) => (
                <tr key={e.equipo_id} className="border-b last:border-b-0">
                  <td className="px-3 py-2 font-semibold">{i + 1}</td>
                  <td className="px-3 py-2">{e.equipo_nombre}</td>
                  <td className="px-3 py-2 text-center">{e.partidos_jugados}</td>
                  <td className="px-3 py-2 text-center font-medium">{e.goles_totales}</td>
                  <td className="px-3 py-2 text-center">{e.asistencias_totales}</td>
                  <td className="px-3 py-2 text-center">{e.tarjetas_amarillas}</td>
                  <td className="px-3 py-2 text-center">{e.tarjetas_rojas}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
