'use client'

import { useState, useTransition } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { UserPlus, UserMinus } from 'lucide-react'
import { toast } from 'sonner'
import { agregarMiembro, quitarMiembro } from '../../_actions'

interface Persona {
  id: string
  nombre: string
  apellido: string
  numero_documento: string | null
  email_principal: string | null
}

interface Miembro {
  id: string
  persona_id: string
  rol_equipo_slug: string
  dorsal: number | null
  posicion: string | null
  fecha_inicio: string | null
  activo: boolean
  personas: Persona | null
}

interface Rol {
  slug: string
  nombre: string
  categoria: string
}

interface PlantelProps {
  equipoId: string
  miembros: Miembro[]
  roles: Rol[]
}

const ROL_COLORS: Record<string, string> = {
  staff: 'bg-indigo-500/10 text-indigo-500',
  jugador: 'bg-blue-500/10 text-blue-500',
  otro: 'bg-gray-500/10 text-gray-500',
}

export function Plantel({ equipoId, miembros, roles }: PlantelProps) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [personaId, setPersonaId] = useState('')
  const [rolSlug, setRolSlug] = useState('')
  const [dorsal, setDorsal] = useState('')
  const [posicion, setPosicion] = useState('')

  function handleAgregar(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      const result = await agregarMiembro({
        equipo_id: equipoId,
        persona_id: personaId.trim(),
        rol_equipo_slug: rolSlug,
        dorsal: dorsal ? parseInt(dorsal, 10) : null,
        posicion: posicion || null,
      })
      if (result.ok) {
        toast.success(result.message)
        setOpen(false)
        setPersonaId('')
        setRolSlug('')
        setDorsal('')
        setPosicion('')
      } else {
        toast.error(result.message)
      }
    })
  }

  function handleQuitar(miembroId: string) {
    startTransition(async () => {
      const result = await quitarMiembro(miembroId, equipoId)
      if (result.ok) toast.success(result.message)
      else toast.error(result.message)
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Plantel</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<Button size="sm" variant="outline" />}>
            <UserPlus className="h-4 w-4 mr-1" />
            Agregar
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Agregar miembro</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAgregar} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="persona_id">ID de persona</Label>
                <Input
                  id="persona_id"
                  value={personaId}
                  onChange={(e) => setPersonaId(e.target.value)}
                  placeholder="UUID de la persona"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Ingresa el ID de la persona a agregar al equipo.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="rol">Rol</Label>
                <Select value={rolSlug} onValueChange={(v) => setRolSlug(v ?? '')}>
                  <SelectTrigger id="rol">
                    <SelectValue placeholder="Seleccionar rol" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((r) => (
                      <SelectItem key={r.slug} value={r.slug}>
                        {r.nombre} ({r.categoria})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="dorsal">Dorsal</Label>
                  <Input
                    id="dorsal"
                    type="number"
                    value={dorsal}
                    onChange={(e) => setDorsal(e.target.value)}
                    placeholder="Ej: 10"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="posicion">Posicion</Label>
                  <Input
                    id="posicion"
                    value={posicion}
                    onChange={(e) => setPosicion(e.target.value)}
                    placeholder="Ej: Delantero"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending ? 'Agregando...' : 'Agregar'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {miembros.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">No hay miembros en este equipo.</p>
      ) : (
        <div className="space-y-2">
          {miembros.map((m) => {
            const persona = m.personas
            const rol = roles.find((r) => r.slug === m.rol_equipo_slug)
            const colorClass = ROL_COLORS[rol?.categoria ?? 'otro'] ?? ROL_COLORS.otro

            return (
              <div
                key={m.id}
                className="flex items-center gap-3 rounded-lg border p-3"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-sm font-medium">
                  {m.dorsal ?? '—'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">
                    {persona ? `${persona.apellido}, ${persona.nombre}` : m.persona_id}
                  </p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    {m.posicion && <span>{m.posicion}</span>}
                    {m.fecha_inicio && <span>desde {m.fecha_inicio}</span>}
                  </div>
                </div>
                <Badge variant="secondary" className={colorClass}>
                  {rol?.nombre ?? m.rol_equipo_slug}
                </Badge>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0 text-destructive"
                  onClick={() => handleQuitar(m.id)}
                  disabled={isPending}
                >
                  <UserMinus className="h-4 w-4" />
                </Button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
