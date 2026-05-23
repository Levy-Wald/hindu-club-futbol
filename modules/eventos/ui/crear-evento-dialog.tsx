'use client'

import { useState, useTransition } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { crearEventoConInvitacionesAction } from '../lib/actions'
import type { InvitadoInput } from '../lib/types'
import { useRouter } from 'next/navigation'
import { X, Plus, Shuffle } from 'lucide-react'

const TIPOS_EVENTO = [
  { slug: 'entrenamiento', nombre: 'Entrenamiento' },
  { slug: 'partido', nombre: 'Partido' },
  { slug: 'amistoso', nombre: 'Amistoso' },
  { slug: 'reunion', nombre: 'Reunion' },
  { slug: 'vencimiento', nombre: 'Vencimiento' },
  { slug: 'actividad', nombre: 'Actividad general' },
  { slug: 'reserva', nombre: 'Reserva' },
  { slug: 'mantenimiento', nombre: 'Mantenimiento' },
  { slug: 'asamblea', nombre: 'Asamblea' },
  { slug: 'otro', nombre: 'Otro' },
]

const PERIODICIDADES = [
  { value: 'nunca', label: 'Sin repeticion' },
  { value: 'diario', label: 'Todos los dias' },
  { value: 'dias_semana', label: 'Dias de la semana' },
  { value: 'quincenal', label: 'Cada 15 dias' },
  { value: 'mensual', label: 'Cada mes' },
  { value: 'anual', label: 'Todos los anos' },
]

const DIAS_SEMANA = ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom']

// Generate time options every 15 min
function generateTimeOptions(): string[] {
  const opts: string[] = []
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 15) {
      opts.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`)
    }
  }
  return opts
}
const TIME_OPTIONS = generateTimeOptions()

interface CrearEventoDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultFecha?: string
  sedes: { id: string; nombre: string }[]
  equipos: { id: string; nombre: string }[]
  personas: { id: string; nombre: string; apellido: string }[]
  entidades: { id: string; nombre: string }[]
  personaId: string
  tenantId: string
}

export function CrearEventoDialog({
  open,
  onOpenChange,
  defaultFecha,
  sedes,
  equipos,
  personas,
  entidades,
  personaId,
  tenantId,
}: CrearEventoDialogProps) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [successInfo, setSuccessInfo] = useState<{ codigo: string; link: string | null } | null>(null)
  const router = useRouter()

  // Basic fields
  const [titulo, setTitulo] = useState('')
  const [tipoSlug, setTipoSlug] = useState('entrenamiento')
  const [fechaInicio, setFechaInicio] = useState(defaultFecha ?? '')
  const [fechaFin, setFechaFin] = useState(defaultFecha ?? '')
  const [descripcion, setDescripcion] = useState('')
  const [sedeId, setSedeId] = useState('')
  const [equipoId, setEquipoId] = useState('')
  const [lugarEncuentro, setLugarEncuentro] = useState('')

  // Horarios
  const [horaConvocatoria, setHoraConvocatoria] = useState('')
  const [horaInicio, setHoraInicio] = useState('')
  const [horaFin, setHoraFin] = useState('')

  // Recurrence
  const [periodicidad, setPeriodicidad] = useState('nunca')
  const [diasSemana, setDiasSemana] = useState<boolean[]>([false, false, false, false, false, false, false])
  const [fechaFinRecurrencia, setFechaFinRecurrencia] = useState('')

  // Access code
  const [codigoManual, setCodigoManual] = useState('')
  const [codigoGenerado, setCodigoGenerado] = useState('')

  // Invitados
  const [invitados, setInvitados] = useState<InvitadoInput[]>([])
  const [emailExternoInput, setEmailExternoInput] = useState('')

  function resetForm() {
    setTitulo('')
    setTipoSlug('entrenamiento')
    setFechaInicio(defaultFecha ?? '')
    setFechaFin(defaultFecha ?? '')
    setDescripcion('')
    setSedeId('')
    setEquipoId('')
    setLugarEncuentro('')
    setHoraConvocatoria('')
    setHoraInicio('')
    setHoraFin('')
    setPeriodicidad('nunca')
    setDiasSemana([false, false, false, false, false, false, false])
    setFechaFinRecurrencia('')
    setCodigoManual('')
    setCodigoGenerado('')
    setInvitados([])
    setEmailExternoInput('')
    setError(null)
    setSuccessInfo(null)
  }

  function handleFechaInicioChange(v: string) {
    setFechaInicio(v)
    if (!fechaFin || fechaFin < v) setFechaFin(v)
  }

  function toggleDiaSemana(idx: number) {
    setDiasSemana(prev => prev.map((v, i) => i === idx ? !v : v))
  }

  function handleGenerarCodigo() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let code = ''
    for (let i = 0; i < 10; i++) code += chars[Math.floor(Math.random() * chars.length)]
    setCodigoGenerado(code)
    setCodigoManual(code)
  }

  // Invitados helpers
  function addInvitadoPersona(personaIdToAdd: string) {
    if (invitados.some(i => i.tipo === 'persona' && i.ref_id === personaIdToAdd)) return
    setInvitados(prev => [...prev, { tipo: 'persona', ref_id: personaIdToAdd }])
  }

  function addInvitadoEquipo(equipoIdToAdd: string) {
    if (invitados.some(i => i.tipo === 'equipo' && i.ref_id === equipoIdToAdd)) return
    setInvitados(prev => [...prev, { tipo: 'equipo', ref_id: equipoIdToAdd }])
  }

  function addInvitadoEntidad(entidadIdToAdd: string) {
    if (invitados.some(i => i.tipo === 'entidad' && i.ref_id === entidadIdToAdd)) return
    setInvitados(prev => [...prev, { tipo: 'entidad', ref_id: entidadIdToAdd }])
  }

  function addEmailExterno() {
    const email = emailExternoInput.trim()
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return
    if (invitados.some(i => i.tipo === 'email_externo' && i.email === email)) return
    setInvitados(prev => [...prev, { tipo: 'email_externo', email }])
    setEmailExternoInput('')
  }

  function removeInvitado(idx: number) {
    setInvitados(prev => prev.filter((_, i) => i !== idx))
  }

  function getInvitadoLabel(inv: InvitadoInput): string {
    if (inv.tipo === 'email_externo') return inv.email ?? ''
    if (inv.tipo === 'persona') {
      const p = personas.find(p => p.id === inv.ref_id)
      return p ? `${p.nombre} ${p.apellido}` : inv.ref_id ?? ''
    }
    if (inv.tipo === 'equipo') {
      return equipos.find(e => e.id === inv.ref_id)?.nombre ?? inv.ref_id ?? ''
    }
    if (inv.tipo === 'entidad') {
      return entidades.find(e => e.id === inv.ref_id)?.nombre ?? inv.ref_id ?? ''
    }
    return ''
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!titulo.trim() || !fechaInicio || !fechaFin) {
      setError('Titulo, fecha inicio y fecha fin son obligatorios')
      return
    }

    startTransition(async () => {
      const result = await crearEventoConInvitacionesAction({
        evento: {
          titulo: titulo.trim(),
          tipo_evento_slug: tipoSlug,
          fecha_inicio: fechaInicio,
          fecha_fin: fechaFin,
          hora_inicio: horaInicio || undefined,
          hora_fin: horaFin || undefined,
          modulo_origen: 'manual',
          periodicidad: periodicidad as 'nunca',
          dias_semana: periodicidad === 'dias_semana' ? diasSemana : undefined,
          fecha_fin_recurrencia: periodicidad !== 'nunca' && fechaFinRecurrencia ? fechaFinRecurrencia : undefined,
          responsables_persona_id: [personaId],
          sede_id: sedeId || undefined,
          equipo_id: equipoId || undefined,
          descripcion: descripcion.trim() || undefined,
          lugar_encuentro: lugarEncuentro.trim() || undefined,
        },
        invitados,
        codigo_acceso_manual: codigoManual || undefined,
      })

      if (!result.ok) {
        setError(result.error)
        return
      }

      setSuccessInfo({
        codigo: result.data.codigo_acceso ?? '',
        link: result.data.link_registro,
      })

      // Auto-close after showing success briefly
      setTimeout(() => {
        resetForm()
        onOpenChange(false)
        router.refresh()
      }, 2000)
    })
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) { setError(null); setSuccessInfo(null) } }}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nuevo evento</DialogTitle>
        </DialogHeader>

        {successInfo ? (
          <div className="space-y-3 py-4">
            <div className="text-sm text-green-700 bg-green-50 p-4 rounded-md space-y-2">
              <p className="font-medium">Evento creado exitosamente</p>
              {successInfo.codigo && (
                <p>Codigo de acceso: <span className="font-mono font-bold">{successInfo.codigo}</span></p>
              )}
              {invitados.length > 0 && (
                <p>{invitados.length} invitacion(es) enviada(s)</p>
              )}
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">{error}</div>
            )}

            {/* Title + Type */}
            <div className="space-y-2">
              <Label htmlFor="ev-titulo">Titulo *</Label>
              <Input id="ev-titulo" value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ej: Entrenamiento Sub-20" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ev-tipo">Tipo *</Label>
              <Select value={tipoSlug} onValueChange={(v) => setTipoSlug(v ?? 'entrenamiento')}>
                <SelectTrigger id="ev-tipo"><SelectValue placeholder="Seleccionar tipo" /></SelectTrigger>
                <SelectContent>
                  {TIPOS_EVENTO.map((t) => (
                    <SelectItem key={t.slug} value={t.slug}>{t.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="ev-fecha-inicio">Fecha inicio *</Label>
                <Input id="ev-fecha-inicio" type="date" value={fechaInicio} onChange={(e) => handleFechaInicioChange(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ev-fecha-fin">Fecha fin *</Label>
                <Input id="ev-fecha-fin" type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} min={fechaInicio} />
              </div>
            </div>

            {/* Horarios */}
            <fieldset className="border rounded-md p-3 space-y-3">
              <legend className="text-sm font-medium px-1">Horarios</legend>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Convocatoria</Label>
                  <Select value={horaConvocatoria || undefined} onValueChange={v => setHoraConvocatoria(v ?? '')}>
                    <SelectTrigger><SelectValue placeholder="--:--" /></SelectTrigger>
                    <SelectContent className="max-h-48">
                      {TIME_OPTIONS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Inicio</Label>
                  <Select value={horaInicio || undefined} onValueChange={v => setHoraInicio(v ?? '')}>
                    <SelectTrigger><SelectValue placeholder="--:--" /></SelectTrigger>
                    <SelectContent className="max-h-48">
                      {TIME_OPTIONS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Fin</Label>
                  <Select value={horaFin || undefined} onValueChange={v => setHoraFin(v ?? '')}>
                    <SelectTrigger><SelectValue placeholder="--:--" /></SelectTrigger>
                    <SelectContent className="max-h-48">
                      {TIME_OPTIONS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </fieldset>

            {/* Recurrence */}
            <fieldset className="border rounded-md p-3 space-y-3">
              <legend className="text-sm font-medium px-1">Recurrencia</legend>
              <Select value={periodicidad} onValueChange={v => setPeriodicidad(v ?? 'nunca')}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PERIODICIDADES.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                </SelectContent>
              </Select>
              {periodicidad === 'dias_semana' && (
                <div className="flex gap-1 flex-wrap">
                  {DIAS_SEMANA.map((dia, idx) => (
                    <Button
                      key={dia}
                      type="button"
                      size="sm"
                      variant={diasSemana[idx] ? 'default' : 'outline'}
                      className="h-8 w-10 text-xs"
                      onClick={() => toggleDiaSemana(idx)}
                    >
                      {dia}
                    </Button>
                  ))}
                </div>
              )}
              {periodicidad !== 'nunca' && (
                <div className="space-y-1">
                  <Label className="text-xs">Fin de recurrencia</Label>
                  <Input type="date" value={fechaFinRecurrencia} onChange={e => setFechaFinRecurrencia(e.target.value)} min={fechaFin} />
                </div>
              )}
            </fieldset>

            {/* Location */}
            <div className="grid grid-cols-2 gap-3">
              {sedes.length > 0 && (
                <div className="space-y-2">
                  <Label>Sede</Label>
                  <Select value={sedeId || undefined} onValueChange={(v) => setSedeId(v ?? '')}>
                    <SelectTrigger><SelectValue placeholder="Sin sede" /></SelectTrigger>
                    <SelectContent>
                      {sedes.map((s) => <SelectItem key={s.id} value={s.id}>{s.nombre}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}
              {equipos.length > 0 && (
                <div className="space-y-2">
                  <Label>Equipo</Label>
                  <Select value={equipoId || undefined} onValueChange={(v) => setEquipoId(v ?? '')}>
                    <SelectTrigger><SelectValue placeholder="Sin equipo" /></SelectTrigger>
                    <SelectContent>
                      {equipos.map((eq) => <SelectItem key={eq.id} value={eq.id}>{eq.nombre}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Lugar de encuentro</Label>
              <Input value={lugarEncuentro} onChange={e => setLugarEncuentro(e.target.value)} placeholder="Ej: Cancha 1, Pileta..." />
            </div>

            {/* Codigo de acceso */}
            <fieldset className="border rounded-md p-3 space-y-3">
              <legend className="text-sm font-medium px-1">Codigo de acceso</legend>
              <div className="flex gap-2">
                <Input
                  value={codigoManual}
                  onChange={e => setCodigoManual(e.target.value.toUpperCase())}
                  placeholder="Se genera automaticamente"
                  maxLength={20}
                  className="font-mono"
                />
                <Button type="button" variant="outline" size="sm" onClick={handleGenerarCodigo}>
                  <Shuffle className="h-4 w-4 mr-1" /> Generar
                </Button>
              </div>
              {codigoGenerado && (
                <p className="text-xs text-muted-foreground">Codigo: <span className="font-mono font-bold">{codigoGenerado}</span></p>
              )}
            </fieldset>

            {/* Invitados */}
            <fieldset className="border rounded-md p-3 space-y-3">
              <legend className="text-sm font-medium px-1">Invitados ({invitados.length})</legend>

              {/* Equipos */}
              {equipos.length > 0 && (
                <div className="space-y-1">
                  <Label className="text-xs">Equipos</Label>
                  <Select value={undefined} onValueChange={v => v && addInvitadoEquipo(v)}>
                    <SelectTrigger><SelectValue placeholder="Agregar equipo..." /></SelectTrigger>
                    <SelectContent>
                      {equipos.filter(eq => !invitados.some(i => i.tipo === 'equipo' && i.ref_id === eq.id)).map(eq => (
                        <SelectItem key={eq.id} value={eq.id}>{eq.nombre}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Personas */}
              {personas.length > 0 && (
                <div className="space-y-1">
                  <Label className="text-xs">Personas</Label>
                  <Select value={undefined} onValueChange={v => v && addInvitadoPersona(v)}>
                    <SelectTrigger><SelectValue placeholder="Agregar persona..." /></SelectTrigger>
                    <SelectContent className="max-h-48">
                      {personas.filter(p => !invitados.some(i => i.tipo === 'persona' && i.ref_id === p.id)).map(p => (
                        <SelectItem key={p.id} value={p.id}>{p.nombre} {p.apellido}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Entidades */}
              {entidades.length > 0 && (
                <div className="space-y-1">
                  <Label className="text-xs">Entidades</Label>
                  <Select value={undefined} onValueChange={v => v && addInvitadoEntidad(v)}>
                    <SelectTrigger><SelectValue placeholder="Agregar entidad..." /></SelectTrigger>
                    <SelectContent>
                      {entidades.filter(e => !invitados.some(i => i.tipo === 'entidad' && i.ref_id === e.id)).map(e => (
                        <SelectItem key={e.id} value={e.id}>{e.nombre}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Emails externos */}
              <div className="space-y-1">
                <Label className="text-xs">Emails externos</Label>
                <div className="flex gap-2">
                  <Input
                    type="email"
                    value={emailExternoInput}
                    onChange={e => setEmailExternoInput(e.target.value)}
                    placeholder="email@ejemplo.com"
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addEmailExterno() } }}
                  />
                  <Button type="button" variant="outline" size="sm" onClick={addEmailExterno}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Selected invitados list */}
              {invitados.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-1">
                  {invitados.map((inv, idx) => (
                    <Badge key={idx} variant="secondary" className="gap-1 pr-1">
                      <span className="text-[10px] opacity-60 uppercase">{inv.tipo === 'email_externo' ? 'ext' : inv.tipo.slice(0, 3)}</span>
                      {getInvitadoLabel(inv)}
                      <button type="button" onClick={() => removeInvitado(idx)} className="ml-0.5 hover:text-destructive">
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </fieldset>

            {/* Description */}
            <div className="space-y-2">
              <Label>Descripcion</Label>
              <Textarea value={descripcion} onChange={(e) => setDescripcion(e.target.value)} rows={2} />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? 'Creando...' : 'Crear evento'}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
