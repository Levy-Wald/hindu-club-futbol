'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { Loader2, Plus, Search, UserMinus, UserPlus } from 'lucide-react'
import { fetchCuerpoTecnico, asignarStaff, desvincularStaff, fetchRolesStaff } from '../../_actions/cuerpo-tecnico'
import { buscarPersonas } from '../../_actions'

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

type Miembro = {
  id: string
  persona_id: string
  rol_equipo_slug: string
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
}

export function CuerpoTecnicoTab({ equipoId }: { equipoId: string }) {
  const [miembros, setMiembros] = useState<Miembro[]>([])
  const [rolesStaff, setRolesStaff] = useState<{ slug: string; nombre: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  // Search state
  const [busqueda, setBusqueda] = useState('')
  const [resultados, setResultados] = useState<{ id: string; nombre: string; apellido: string; numero_documento: string | null }[]>([])
  const [buscando, setBuscando] = useState(false)
  const [personaSeleccionada, setPersonaSeleccionada] = useState<{ id: string; nombre: string; apellido: string } | null>(null)
  const [rolSeleccionado, setRolSeleccionado] = useState('')

  const cargar = async () => {
    setLoading(true)
    try {
      const data = await fetchCuerpoTecnico(equipoId)
      setMiembros(data as unknown as Miembro[])
    } catch {
      toast.error('Error cargando cuerpo técnico')
    }
    setLoading(false)
  }

  useEffect(() => { cargar() }, [equipoId])
  useEffect(() => { fetchRolesStaff().then(setRolesStaff) }, [])

  useEffect(() => {
    if (busqueda.length < 2) { setResultados([]); return }
    const timer = setTimeout(async () => {
      setBuscando(true)
      const res = await buscarPersonas(busqueda)
      if (res.ok) setResultados(res.data)
      setBuscando(false)
    }, 300)
    return () => clearTimeout(timer)
  }, [busqueda])

  const handleAsignar = async () => {
    if (!personaSeleccionada || !rolSeleccionado) {
      toast.error('Seleccioná una persona y un rol')
      return
    }
    setSaving(true)
    const res = await asignarStaff({
      equipo_id: equipoId,
      persona_id: personaSeleccionada.id,
      rol_equipo_slug: rolSeleccionado,
    })
    if (res.ok) {
      toast.success(res.message)
      setModalOpen(false)
      setPersonaSeleccionada(null)
      setRolSeleccionado('')
      setBusqueda('')
      cargar()
    } else {
      toast.error(res.message)
    }
    setSaving(false)
  }

  const handleDesvincular = async (personaEquipoId: string) => {
    if (!confirm('¿Desvincular este miembro del cuerpo técnico?')) return
    const res = await desvincularStaff(personaEquipoId, equipoId)
    if (res.ok) { toast.success(res.message); cargar() }
    else toast.error(res.message)
  }

  // Group by role
  const porRol = new Map<string, Miembro[]>()
  for (const m of miembros) {
    const list = porRol.get(m.rol_equipo_slug) ?? []
    list.push(m)
    porRol.set(m.rol_equipo_slug, list)
  }

  const rolOrder = ['dt', 'asistente_dt', 'preparador_fisico', 'kine', 'medico_equipo', 'utilero', 'manager', 'scout', 'delegado', 'referente']
  const rolesOrdenados = rolOrder.filter(r => porRol.has(r))

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{miembros.length} miembros en el cuerpo técnico</p>
        <Button onClick={() => setModalOpen(true)} size="sm">
          <UserPlus className="h-4 w-4 mr-1" /> Asignar staff
        </Button>
      </div>

      {miembros.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          No hay staff asignado a este equipo
        </div>
      ) : (
        <div className="space-y-4">
          {rolesOrdenados.map(rol => (
            <div key={rol}>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">{ROL_LABELS[rol] ?? rol}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {(porRol.get(rol) ?? []).map(m => {
                  const p = m.personas as unknown as Miembro['personas']
                  if (!p) return null
                  return (
                    <Card key={m.id}>
                      <CardContent className="flex items-center gap-3 py-3">
                        {p.foto_perfil_url ? (
                          <img src={p.foto_perfil_url} alt="" className="h-10 w-10 rounded-full object-cover" />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                            {p.nombre[0]}{p.apellido[0]}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{p.apellido}, {p.nombre}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {p.telefono_principal ?? p.email_principal ?? '—'}
                          </p>
                        </div>
                        <Button size="icon" variant="ghost" onClick={() => handleDesvincular(m.id)} title="Desvincular">
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

      {/* Modal asignar */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Asignar staff al equipo</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <div>
              <Label>Buscar persona</Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Nombre o DNI..."
                  value={busqueda}
                  onChange={e => { setBusqueda(e.target.value); setPersonaSeleccionada(null) }}
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
                        setBusqueda(`${r.apellido}, ${r.nombre}`)
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
            <Button onClick={handleAsignar} disabled={saving || !personaSeleccionada || !rolSeleccionado}>
              {saving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              Asignar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
