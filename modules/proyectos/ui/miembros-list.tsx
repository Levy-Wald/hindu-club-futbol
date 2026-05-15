'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { Plus, Trash2, UserPlus } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { agregarMiembro, actualizarRolMiembro, eliminarMiembro } from '../lib/actions'
import type { Miembro, RolMiembro } from '../lib/tipos'
import { ROL_MIEMBRO_LABELS } from '../lib/tipos'

interface Props {
  proyectoId: string
  miembros: Miembro[]
  personasDisponibles?: { id: string; nombre: string; apellido: string; email_principal: string | null }[]
}

export function MiembrosList({ proyectoId, miembros, personasDisponibles = [] }: Props) {
  const [addOpen, setAddOpen] = useState(false)
  const [busqueda, setBusqueda] = useState('')
  const [selectedPersona, setSelectedPersona] = useState('')
  const [selectedRol, setSelectedRol] = useState<RolMiembro>('miembro')

  const miembroIds = new Set(miembros.map(m => m.persona_id))
  const disponibles = personasDisponibles
    .filter(p => !miembroIds.has(p.id))
    .filter(p => !busqueda || `${p.nombre} ${p.apellido}`.toLowerCase().includes(busqueda.toLowerCase()))

  async function handleAdd() {
    if (!selectedPersona) return
    const res = await agregarMiembro(proyectoId, selectedPersona, selectedRol)
    if (res.ok) {
      toast.success(res.message)
      setAddOpen(false)
      setSelectedPersona('')
    } else {
      toast.error(res.message)
    }
  }

  async function handleChangeRol(personaId: string, rol: RolMiembro) {
    const res = await actualizarRolMiembro(proyectoId, personaId, rol)
    if (!res.ok) toast.error(res.message)
  }

  async function handleRemove(personaId: string) {
    if (!confirm('¿Quitar este miembro del proyecto?')) return
    const res = await eliminarMiembro(proyectoId, personaId)
    if (res.ok) toast.success(res.message)
    else toast.error(res.message)
  }

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium">Equipo ({miembros.length})</h3>
        <Button size="sm" variant="outline" onClick={() => setAddOpen(true)}>
          <UserPlus className="h-4 w-4 mr-1" /> Agregar
        </Button>
      </div>

      <div className="space-y-2">
        {miembros.map(m => (
          <div key={m.persona_id} className="flex items-center justify-between border rounded-lg p-3">
            <div>
              <p className="text-sm font-medium">
                {m.persona ? `${m.persona.apellido}, ${m.persona.nombre}` : m.persona_id}
              </p>
              {m.persona?.email_principal && (
                <p className="text-xs text-muted-foreground">{m.persona.email_principal}</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Select value={m.rol} onValueChange={(v) => handleChangeRol(m.persona_id, v as RolMiembro)}>
                <SelectTrigger className="w-[140px] h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(ROL_MIEMBRO_LABELS).map(([val, label]) => (
                    <SelectItem key={val} value={val}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleRemove(m.persona_id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
        {miembros.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-8">Sin miembros. Agrega personas al equipo del proyecto.</p>
        )}
      </div>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Agregar miembro</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Buscar persona..."
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
            />
            <Select value={selectedPersona} onValueChange={v => setSelectedPersona(v ?? '')}>
              <SelectTrigger><SelectValue placeholder="Seleccionar persona..." /></SelectTrigger>
              <SelectContent>
                {disponibles.slice(0, 30).map(p => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.apellido}, {p.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedRol} onValueChange={v => setSelectedRol((v ?? 'miembro') as RolMiembro)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(ROL_MIEMBRO_LABELS).map(([val, label]) => (
                  <SelectItem key={val} value={val}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={handleAdd} disabled={!selectedPersona} className="w-full">
              <Plus className="h-4 w-4 mr-1" /> Agregar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
