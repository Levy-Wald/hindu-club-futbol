'use client'

import { useState, useEffect, useTransition } from 'react'
import Link from 'next/link'
import { Loader2, BarChart3 } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { obtenerRankingJugadoresAction, type RankingItem } from '../lib/stats-actions'

type Metrica = 'goles' | 'asistencias' | 'tarjetas_amarillas' | 'minutos_jugados'

const METRICAS: { value: Metrica; label: string }[] = [
  { value: 'goles', label: 'Goles' },
  { value: 'asistencias', label: 'Asistencias' },
  { value: 'tarjetas_amarillas', label: 'Tarjetas amarillas' },
  { value: 'minutos_jugados', label: 'Minutos jugados' },
]

export function PantallaRankingJugadores({
  torneos,
}: {
  torneos: { id: string; nombre: string }[]
}) {
  const [isPending, startTransition] = useTransition()
  const [ranking, setRanking] = useState<RankingItem[]>([])
  const [torneoId, setTorneoId] = useState('')
  const [metrica, setMetrica] = useState<Metrica>('goles')

  useEffect(() => {
    startTransition(async () => {
      const res = await obtenerRankingJugadoresAction({
        torneo_id: torneoId || undefined,
        metrica,
      })
      if (res.ok) setRanking(res.ranking)
    })
  }, [torneoId, metrica])

  return (
    <div data-testid="pantalla-stats-jugadores">
      <div className="flex items-center gap-3 mb-6">
        <BarChart3 className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Ranking de jugadores</h1>
      </div>

      <div className="flex items-center gap-3 mb-4 flex-wrap">
        {torneos.length > 0 && (
          <Select value={torneoId} onValueChange={(v) => setTorneoId(v === '__all__' ? '' : (v ?? ''))}>
            <SelectTrigger className="w-52" data-testid="filtro-torneo-stats">
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

        <Select value={metrica} onValueChange={(v) => setMetrica((v ?? 'goles') as Metrica)}>
          <SelectTrigger className="w-48" data-testid="filtro-metrica">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {METRICAS.map((m) => (
              <SelectItem key={m.value} value={m.value}>
                {m.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {isPending && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
      </div>

      {ranking.length === 0 && !isPending && (
        <div className="rounded-lg border p-8 text-center text-muted-foreground">
          <BarChart3 className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>No hay estadísticas cargadas aún.</p>
          <p className="text-xs mt-1">Cargá resultados detallados de partidos para ver el ranking.</p>
        </div>
      )}

      {ranking.length > 0 && (
        <div className="rounded-lg border overflow-x-auto" data-testid="tabla-ranking-jugadores">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-3 py-2 text-left w-10">#</th>
                <th className="px-3 py-2 text-left">Jugador</th>
                <th className="px-3 py-2 text-left">Equipo</th>
                <th className="px-3 py-2 text-center w-10">PJ</th>
                <th className="px-3 py-2 text-center w-10">G</th>
                <th className="px-3 py-2 text-center w-10">A</th>
                <th className="px-3 py-2 text-center w-10">TA</th>
                <th className="px-3 py-2 text-center w-10">TR</th>
                <th className="px-3 py-2 text-center w-12">Min</th>
              </tr>
            </thead>
            <tbody>
              {ranking.map((r, i) => (
                <tr
                  key={r.persona_id}
                  className="border-b last:border-b-0 hover:bg-muted/30"
                  data-testid={`fila-jugador-${r.persona_id}`}
                >
                  <td className="px-3 py-2 font-semibold">{i + 1}</td>
                  <td className="px-3 py-2">
                    <Link
                      href={`/admin/competencias/stats/jugadores/${r.persona_id}`}
                      className="text-primary hover:underline"
                    >
                      {r.jugador_nombre}
                    </Link>
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">{r.equipo_nombre ?? '—'}</td>
                  <td className="px-3 py-2 text-center">{r.partidos_jugados}</td>
                  <td className="px-3 py-2 text-center font-medium">{r.goles}</td>
                  <td className="px-3 py-2 text-center">{r.asistencias}</td>
                  <td className="px-3 py-2 text-center">{r.tarjetas_amarillas}</td>
                  <td className="px-3 py-2 text-center">{r.tarjetas_rojas}</td>
                  <td className="px-3 py-2 text-center">{r.minutos_jugados}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
