'use client'

import { useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Plus, Pencil, Trash2, MapPin, Trophy, Award } from 'lucide-react'
import { softDeleteTrayectoriaClub, softDeleteLogro } from '../lib/actions'
import { TrayectoriaForm } from './trayectoria-form'
import { LogroForm } from './logro-form'
import { TIPOS_LOGRO } from '../lib/tipos'
import type { TrayectoriaClub, Logro } from '../lib/tipos'

interface TrayectoriaTimelineProps {
  personaId: string
  trayectoriaInicial: TrayectoriaClub[]
  logrosInicial: Logro[]
}

type TimelineItem =
  | { type: 'club'; data: TrayectoriaClub; sortDate: string }
  | { type: 'logro'; data: Logro; sortDate: string }

function buildTimeline(trayectoria: TrayectoriaClub[], logros: Logro[]): TimelineItem[] {
  const items: TimelineItem[] = [
    ...trayectoria.map(c => ({
      type: 'club' as const,
      data: c,
      sortDate: c.fecha_desde || c.created_at.slice(0, 10),
    })),
    ...logros.map(l => ({
      type: 'logro' as const,
      data: l,
      sortDate: l.fecha_otorgado || (l.anio ? `${l.anio}-01-01` : l.created_at.slice(0, 10)),
    })),
  ]
  items.sort((a, b) => b.sortDate.localeCompare(a.sortDate))
  return items
}

export function TrayectoriaTimeline({ personaId, trayectoriaInicial, logrosInicial }: TrayectoriaTimelineProps) {
  const [trayectoria, setTrayectoria] = useState(trayectoriaInicial)
  const [logros, setLogros] = useState(logrosInicial)
  const [clubFormOpen, setClubFormOpen] = useState(false)
  const [logroFormOpen, setLogroFormOpen] = useState(false)
  const [editClub, setEditClub] = useState<TrayectoriaClub | undefined>()
  const [editLogro, setEditLogro] = useState<Logro | undefined>()

  const reload = useCallback(async () => {
    const res = await fetch(`/api/historial-deportivo/${personaId}`)
    if (res.ok) {
      const data = await res.json()
      setTrayectoria(data.trayectoria)
      setLogros(data.logros)
    }
  }, [personaId])

  async function handleDeleteClub(id: string) {
    const res = await softDeleteTrayectoriaClub(id)
    if (!res.ok) { toast.error(res.error ?? 'Error'); return }
    toast.success('Club eliminado')
    setTrayectoria(prev => prev.filter(c => c.id !== id))
  }

  async function handleDeleteLogro(id: string) {
    const res = await softDeleteLogro(id)
    if (!res.ok) { toast.error(res.error ?? 'Error'); return }
    toast.success('Logro eliminado')
    setLogros(prev => prev.filter(l => l.id !== id))
  }

  const timeline = buildTimeline(trayectoria, logros)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Trayectoria deportiva</h3>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => { setEditLogro(undefined); setLogroFormOpen(true) }}>
            <Award className="h-4 w-4 mr-1" />
            Logro
          </Button>
          <Button size="sm" onClick={() => { setEditClub(undefined); setClubFormOpen(true) }}>
            <Plus className="h-4 w-4 mr-1" />
            Club
          </Button>
        </div>
      </div>

      {timeline.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground text-sm">
            Sin historial deportivo registrado. Agregá clubes previos o logros.
          </CardContent>
        </Card>
      ) : (
        <div className="relative pl-6 border-l-2 border-muted space-y-4">
          {timeline.map(item => (
            <div key={`${item.type}-${item.data.id}`} className="relative">
              <div className="absolute -left-[calc(1.5rem+1px)] top-2 h-3 w-3 rounded-full border-2 border-background bg-primary" />
              {item.type === 'club' ? (
                <ClubCard
                  club={item.data}
                  onEdit={() => { setEditClub(item.data); setClubFormOpen(true) }}
                  onDelete={() => handleDeleteClub(item.data.id)}
                />
              ) : (
                <LogroCard
                  logro={item.data}
                  onEdit={() => { setEditLogro(item.data); setLogroFormOpen(true) }}
                  onDelete={() => handleDeleteLogro(item.data.id)}
                />
              )}
            </div>
          ))}
        </div>
      )}

      <TrayectoriaForm
        open={clubFormOpen}
        onOpenChange={setClubFormOpen}
        onSuccess={reload}
        personaId={personaId}
        editData={editClub}
      />
      <LogroForm
        open={logroFormOpen}
        onOpenChange={setLogroFormOpen}
        onSuccess={reload}
        personaId={personaId}
        editData={editLogro}
      />
    </div>
  )
}

function ClubCard({ club, onEdit, onDelete }: { club: TrayectoriaClub; onEdit: () => void; onDelete: () => void }) {
  const periodo = [club.fecha_desde, club.fecha_hasta].filter(Boolean).join(' — ') || 'Sin fechas'
  const stats = [
    club.partidos_jugados != null && `${club.partidos_jugados} PJ`,
    club.goles != null && `${club.goles} goles`,
    club.asistencias != null && `${club.asistencias} asist.`,
  ].filter(Boolean)

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Trophy className="h-4 w-4 text-primary shrink-0" />
              {club.club_nombre}
            </CardTitle>
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span>{periodo}</span>
              {club.club_ciudad && (
                <span className="flex items-center gap-0.5">
                  <MapPin className="h-3 w-3" />
                  {club.club_ciudad}{club.club_pais ? `, ${club.club_pais}` : ''}
                </span>
              )}
            </div>
          </div>
          <div className="flex gap-1 shrink-0">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onEdit}>
              <Pencil className="h-3 w-3" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={onDelete}>
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex flex-wrap gap-2">
          {club.categoria && <Badge variant="secondary">{club.categoria}</Badge>}
          {club.posicion && <Badge variant="outline">{club.posicion}</Badge>}
          {club.numero_camiseta != null && <Badge variant="outline">#{club.numero_camiseta}</Badge>}
          {club.disciplina_slug && <Badge variant="outline" className="capitalize">{club.disciplina_slug}</Badge>}
        </div>
        {stats.length > 0 && (
          <p className="text-xs text-muted-foreground mt-2">{stats.join(' · ')}</p>
        )}
        {club.observaciones && (
          <p className="text-xs text-muted-foreground mt-1">{club.observaciones}</p>
        )}
      </CardContent>
    </Card>
  )
}

function LogroCard({ logro, onEdit, onDelete }: { logro: Logro; onEdit: () => void; onDelete: () => void }) {
  const tipoLabel = TIPOS_LOGRO.find(t => t.value === logro.tipo_logro)?.label ?? logro.tipo_logro

  return (
    <Card className="border-amber-200 dark:border-amber-800/50">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Award className="h-4 w-4 text-amber-500 shrink-0" />
              {tipoLabel}
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              {[logro.torneo_nombre, logro.equipo_nombre, logro.anio].filter(Boolean).join(' · ') || logro.fecha_otorgado || ''}
            </p>
          </div>
          <div className="flex gap-1 shrink-0">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onEdit}>
              <Pencil className="h-3 w-3" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={onDelete}>
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-sm">{logro.descripcion}</p>
      </CardContent>
    </Card>
  )
}
