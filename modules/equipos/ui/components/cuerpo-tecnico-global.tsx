'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { Loader2, Search, ArrowLeft, UserPlus, UserMinus } from 'lucide-react'
import { fetchCuerpoTecnicoGlobal, asignarStaff, desvincularStaff, fetchRolesStaff, fetchEquipos } from '@/modules/equipos/lib/actions/cuerpo-tecnico'
import { buscarPersonas } from '@/modules/equipos/lib/actions'

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

type Equipo = { id: string; nombre: string; disciplina_slug: string }

export function CuerpoTecnicoGlobal() {
  const [miembros, setMiembros] = useState<MiembroGlobal[]>([])
  const [loading, setLoading] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [rolFiltro, setRolFiltro] = useState('')

  // Modal state
  const [modalOpen, setModalOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [equipos, setEquipos] = useState<Equipo[]>([])
  const [rolesStaff, setRolesStaff] = useState<{ slug: string; nombre: string }[]>([])

  // Persona search state
  const [busquedaPersona, setBusquedaPersona] = useState('')
  const [resultados, setResultados] = useState<{ id: string; nombre: string; apellido: string; numero_documento: string | null }[]>([])
  const [buscando, setBuscando] = useState(false)
  const [personaSeleccionada, setPersonaSeleccionada] = useState<{ id: string; nombre: string; apellido: string } | null>(null)
  const [rolSeleccionado, setRolSeleccionado] = useState('')
  const [equipoSeleccionado, setEquipoSeleccionado] = useState('')

  const cargar = async () => {
    setLoading(true)
    try {
      const data = await fetchCuerpoTecnicoGlobal()
      setMiembros(data as unknown as MiembroGlobal[])
    } catch {
      toast.error('Error cargando cuerpo técnico')
    }
    setLoading(false)
  }

  useEffect(() => { cargar() }, [])
  useEffect(() => { fetchRolesStaff().then(setRolesStaff) }, [])
  useEffect(() => { fetchEquipos().then(data => setEquipos(data as unknown as Equipo[])) }, [])

  useEffect(() => {
    if (busquedaPersona.length < 2) { setResultados([]); return }
    const timer = setTimeout(async () => {
      setBuscando(true)
      const res = await buscarPersonas(busquedaPersona)
      if (res.ok) setResultados(res.data)
      setBuscando(false)
    }, 300)
    return () => clearTimeout(timer)
  }, [busquedaPersona])

  const handleAsignar = async () => {
    if (!personaSeleccionada || !rolSeleccionado || !equipoSeleccionado) {
      toast.error('Seleccioná un equipo, una persona y un rol')
      return
    }
    setSaving(true)
    const res = await asignarStaff({
      equipo_id: equipoSeleccionado,
      persona_id: personaSeleccionada.id,
      rol_equipo_slug: rolSeleccionado,
    })
    if (res.ok) {
      toast.success(res.message)
      setModalOpen(false)
      setPersonaSeleccionada(null)
      setRolSeleccionado('')
      setEquipoSeleccionado('')
      setBusquedaPersona('')
      cargar()
    } else {
      toast.error(res.message)
    }
    setSaving(false)
  }

  const handleDesvincular = async (personaEquipoId: string, equipoId: string) => {
    if (!confirm('¿Desvincular este miembro del cuerpo técnico?')) return
    const res = await desvincularStaff(personaEquipoId, equipoId)
    if (res.ok) { toast.success(res.message); cargar() }
    else toast.error(res.message)
  }

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
      <div className="flex items-center justify-between gap-3">
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
        <Button onClick={() => setModalOpen(true)} size="sm">
          <UserPlus className="h-4 w-4 mr-1" /> Asociar persona
        </Button>
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
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleDesvincular(m.id, equipoId)}
                          title="Dar de baja"
                        >
                          <UserMinus className="h-3.5 w-3.5" />
                        </Button>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: asociar persona a equipo */}
      <Dialog open={modalOpen} onOpenChange={open => {
        setModalOpen(open)
        if (!open) {
          setPersonaSeleccionada(null)
          setBusquedaPersona('')
          setResultados([])
          setRolSeleccionado('')
          setEquipoSeleccionado('')
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Asociar persona a equipo</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <div>
              <Label>Equipo</Label>
              <Select value={equipoSeleccionado} onValueChange={v => setEquipoSeleccionado(v ?? '')}>
                <SelectTrigger><SelectValue placeholder="Seleccionar equipo" /></SelectTrigger>
                <SelectContent>
                  {equipos.map(e => (
                    <SelectItem key={e.id} value={e.id}>{e.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Buscar persona</Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Nombre o DNI..."
                  value={busquedaPersona}
                  onChange={e => { setBusquedaPersona(e.target.value); setPersonaSeleccionada(null) }}
                  className="pl-8"
                />
              </div>
              {buscando && <p className="text-xs text-muted-foreground mt-1">Buscando...</p>}
              {resultados.length > 0 && !personaSeleccionada && (
                <div className="border rounded-md mt-1 max-h-40 overflow-y-auto">
                  {resultados.map(r => (
                    <button
                      key={r.id}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-muted/50"
                      onClick={() => {
                        setPersonaSeleccionada({ id: r.id, nombre: r.nombre, apellido: r.apellido })
                        setBusquedaPersona(`${r.apellido}, ${r.nombre}`)
                        setResultados([])
                      }}
                    >
                      {r.apellido}, {r.nombre} {r.numero_documento ? `(${r.numero_documento})` : ''}
                    </button>
                  ))}
                </div>
              )}
              {personaSeleccionada && (
                <Badge variant="secondary" className="mt-1">{personaSeleccionada.apellido}, {personaSeleccionada.nombre}</Badge>
              )}
            </div>
            <div>
              <Label>Rol</Label>
              <Select value={rolSeleccionado} onValueChange={v => setRolSeleccionado(v ?? '')}>
                <SelectTrigger><SelectValue placeholder="Seleccionar rol" /></SelectTrigger>
                <SelectContent>
                  {rolesStaff.map(r => (
                    <SelectItem key={r.slug} value={r.slug}>{r.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleAsignar} disabled={saving || !personaSeleccionada || !rolSeleccionado || !equipoSeleccionado}>
              {saving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              Asociar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
