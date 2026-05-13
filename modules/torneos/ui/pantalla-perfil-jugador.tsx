'use client'

import { useState, useEffect, useTransition } from 'react'
import Link from 'next/link'
import { ArrowLeft, Loader2, User, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { obtenerStatsJugadorAction, type PerfilStats } from '../lib/stats-actions'

export function PantallaPerfilJugador({ personaId }: { personaId: string }) {
  const [isPending, startTransition] = useTransition()
  const [perfil, setPerfil] = useState<PerfilStats | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    startTransition(async () => {
      const res = await obtenerStatsJugadorAction({ persona_id: personaId })
      if (res.ok) setPerfil(res.perfil)
      else setError(res.error)
    })
  }, [personaId])

  if (isPending && !perfil) {
    return (
      <div className="flex items-center justify-center py-20" data-testid="pantalla-perfil-jugador">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return (
      <div data-testid="pantalla-perfil-jugador">
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4 text-destructive">
          {error}
        </div>
      </div>
    )
  }

  if (!perfil) return null

  const t = perfil.totales

  return (
    <div data-testid="pantalla-perfil-jugador">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/competencias/stats/jugadores">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex items-center gap-3 flex-1">
          <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
            <User className="h-6 w-6 text-muted-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">
              {perfil.apellido}, {perfil.nombre}
            </h1>
            {perfil.equipo_nombre && (
              <p className="text-sm text-muted-foreground">{perfil.equipo_nombre}</p>
            )}
          </div>
        </div>
      </div>

      {/* Stats totales */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 mb-6" data-testid="stats-totales">
        <StatCard label="Partidos" value={t.partidos_jugados} />
        <StatCard label="Goles" value={t.goles} highlight />
        <StatCard label="Asistencias" value={t.asistencias} />
        <StatCard label="TA" value={t.tarjetas_amarillas} />
        <StatCard label="TR" value={t.tarjetas_rojas} />
        <StatCard label="Minutos" value={t.minutos_jugados} icon={<Clock className="h-3 w-3" />} />
      </div>

      {/* Stats avanzadas — mock */}
      <div className="rounded-lg border p-4 mb-6" data-testid="stats-avanzadas-mock">
        <div className="flex items-center gap-2 mb-3">
          <h3 className="font-semibold">Stats avanzadas</h3>
          <Badge variant="outline" className="text-orange-500 border-orange-500 text-xs">
            Próximamente — FASE 16
          </Badge>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <MockStat label="xG (Expected Goals)" />
          <MockStat label="Pases completados" />
          <MockStat label="Duelos ganados" />
          <MockStat label="Tiros al arco" />
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          Estas estadísticas se calcularán con modelos externos cuando se integre el servicio en
          FASE 16.
        </p>
      </div>

      {/* Últimos partidos */}
      {perfil.partidos.length > 0 && (
        <div className="rounded-lg border overflow-x-auto">
          <div className="px-4 py-3 border-b">
            <h3 className="font-semibold">Últimos partidos</h3>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-3 py-2 text-left">Fecha</th>
                <th className="px-3 py-2 text-left">vs</th>
                <th className="px-3 py-2 text-center">Resultado</th>
                <th className="px-3 py-2 text-center w-8">G</th>
                <th className="px-3 py-2 text-center w-8">A</th>
                <th className="px-3 py-2 text-center w-8">T</th>
              </tr>
            </thead>
            <tbody>
              {perfil.partidos.map((p) => (
                <tr key={p.evento_id} className="border-b last:border-b-0">
                  <td className="px-3 py-2">{p.fecha}</td>
                  <td className="px-3 py-2">{p.rival}</td>
                  <td className="px-3 py-2 text-center">
                    {p.marcador_local !== null ? `${p.marcador_local}-${p.marcador_visitante}` : '—'}
                  </td>
                  <td className="px-3 py-2 text-center font-medium">{p.goles || ''}</td>
                  <td className="px-3 py-2 text-center">{p.asistencias || ''}</td>
                  <td className="px-3 py-2 text-center">
                    {(p.tarjetas_amarillas || 0) + (p.tarjetas_rojas || 0) || ''}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {perfil.partidos.length === 0 && (
        <div className="rounded-lg border p-8 text-center text-muted-foreground">
          No hay partidos con estadísticas cargadas.
        </div>
      )}
    </div>
  )
}

function StatCard({
  label,
  value,
  highlight,
  icon,
}: {
  label: string
  value: number
  highlight?: boolean
  icon?: React.ReactNode
}) {
  return (
    <div className="rounded-lg border p-3 text-center">
      <p className={`text-2xl font-bold ${highlight ? 'text-primary' : ''}`}>
        {icon && <span className="inline-flex mr-1">{icon}</span>}
        {value}
      </p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  )
}

function MockStat({ label }: { label: string }) {
  return (
    <div className="rounded-lg border border-dashed p-3 text-center opacity-50">
      <p className="text-2xl font-bold text-muted-foreground">—</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  )
}
