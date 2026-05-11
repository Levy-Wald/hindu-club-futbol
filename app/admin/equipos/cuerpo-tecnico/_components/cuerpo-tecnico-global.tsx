'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { Loader2, Search, ArrowLeft } from 'lucide-react'
import { fetchCuerpoTecnicoGlobal } from '../../_actions/cuerpo-tecnico'

const ROL_LABELS: Record<string, string> = {
  dt: 'Director Técnico',
  asistente_dt: 'Asistente DT',
  preparador_fisico: 'Preparador Físico',
  kine: 'Kinesiólogo',
  medico_equipo: 'Médico',
  utilero: 'Utilero',
  manager: 'Manager',
  scout: 'Scout',
  delegado: 'Delegado',
  referente: 'Referente',
}

type MiembroGlobal = {
  id: string
  persona_id: string
  rol_equipo_slug: string
  equipo_id: string
  fecha_inicio: string | null
  notas: string | null
  personas: {
    id: string
    nombre: string
    apellido: string
    email_principal: string | null
    telefono_principal: string | null
    whatsapp: string | null
    foto_perfil_url: string | null
  } | null
  equipos: {
    id: string
    nombre: string
    disciplina_slug: string
  } | null
}

export function CuerpoTecnicoGlobal() {
  const [miembros, setMiembros] = useState<MiembroGlobal[]>([])
  const [loading, setLoading] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [rolFiltro, setRolFiltro] = useState('')

  useEffect(() => {
    fetchCuerpoTecnicoGlobal()
      .then(data => setMiembros(data as unknown as MiembroGlobal[]))
      .catch(() => toast.error('Error cargando cuerpo técnico'))
      .finally(() => setLoading(false))
  }, [])

  const filtrados = miembros.filter(m => {
    const p = m.personas as unknown as MiembroGlobal['personas']
    const e = m.equipos as unknown as MiembroGlobal['equipos']
    if (!p) return false
    if (rolFiltro && m.rol_equipo_slug !== rolFiltro) return false
    if (busqueda) {
      const q = busqueda.toLowerCase()
      const match = `${p.nombre} ${p.apellido} ${e?.nombre ?? ''}`.toLowerCase().includes(q)
      if (!match) return false
    }
    return true
  })

  // Group by equipo
  const porEquipo = new Map<string, { equipo: MiembroGlobal['equipos']; miembros: MiembroGlobal[] }>()
  for (const m of filtrados) {
    const e = m.equipos as unknown as MiembroGlobal['equipos']
    const key = m.equipo_id
    const existing = porEquipo.get(key)
    if (existing) {
      existing.miembros.push(m)
    } else {
      porEquipo.set(key, { equipo: e, miembros: [m] })
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Link href="/admin/equipos">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Cuerpo Técnico</h1>
          <p className="text-sm text-muted-foreground">Vista global de staff en todos los equipos</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar persona o equipo..." value={busqueda} onChange={e => setBusqueda(e.target.value)} className="pl-8" />
        </div>
        <Select value={rolFiltro} onValueChange={v => setRolFiltro(v ?? '')}>
          <SelectTrigger className="w-[200px]"><SelectValue placeholder="Todos los roles" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todos los roles</SelectItem>
            {Object.entries(ROL_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>
      ) : filtrados.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          {miembros.length === 0 ? 'No hay staff asignado a ningún equipo' : 'Sin resultados para los filtros aplicados'}
        </div>
      ) : (
        <div className="space-y-6">
          {Array.from(porEquipo.entries()).map(([equipoId, { equipo, miembros: eqMiembros }]) => (
            <div key={equipoId}>
              <Link href={`/admin/equipos/${equipoId}`} className="text-sm font-medium hover:underline">
                {(equipo as MiembroGlobal['equipos'])?.nombre ?? 'Equipo'}
                <Badge variant="outline" className="ml-2 text-[10px]">
                  {(equipo as MiembroGlobal['equipos'])?.disciplina_slug}
                </Badge>
              </Link>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 mt-2">
                {eqMiembros.map(m => {
                  const p = m.personas as unknown as MiembroGlobal['personas']
                  if (!p) return null
                  return (
                    <Card key={m.id}>
                      <CardContent className="flex items-center gap-3 py-3">
                        {p.foto_perfil_url ? (
                          <img src={p.foto_perfil_url} alt="" className="h-9 w-9 rounded-full object-cover" />
                        ) : (
                          <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                            {p.nombre[0]}{p.apellido[0]}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{p.apellido}, {p.nombre}</p>
                          <p className="text-xs text-muted-foreground">{ROL_LABELS[m.rol_equipo_slug] ?? m.rol_equipo_slug}</p>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
