'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { ChevronDown, Plus, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { crearCaja, editarCaja } from '../lib/actions'
import { TIPOS_CAJA, TIPOS_FISCAL, MONEDAS } from '../lib/tipos'

interface CajaFormProps {
  caja?: {
    id: string
    nombre: string
    tipo: string
    tipo_fiscal: string
    moneda: string
    cuenta_id: string | null
    responsable_id: string | null
    entidad_id: string | null
    actividad_slug: string | null
    banco_nombre: string | null
    cbu: string | null
    numero_cuenta: string | null
    descripcion: string | null
    activa: boolean
  }
  entidades: { id: string; nombre: string; tipo: string }[]
  personas: { id: string; nombre: string; apellido: string }[]
  cuentas: { id: string; codigo: string; nombre: string }[]
  actividadesSugeridas: string[]
  trigger?: React.ReactNode
}

export function CajaFormDialog({
  caja,
  entidades,
  personas,
  cuentas,
  actividadesSugeridas,
  trigger,
}: CajaFormProps) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const isEdit = !!caja

  const [nombre, setNombre] = useState(caja?.nombre ?? '')
  const [tipo, setTipo] = useState(caja?.tipo ?? 'efectivo')
  const [tipoFiscal, setTipoFiscal] = useState(caja?.tipo_fiscal ?? 'blanco')
  const [moneda, setMoneda] = useState(caja?.moneda ?? 'ARS')
  const [activa, setActiva] = useState(caja?.activa ?? true)
  const [entidadId, setEntidadId] = useState(caja?.entidad_id ?? '')
  const [actividadSlug, setActividadSlug] = useState(caja?.actividad_slug ?? '')
  const [responsableId, setResponsableId] = useState(caja?.responsable_id ?? '')
  const [bancoNombre, setBancoNombre] = useState(caja?.banco_nombre ?? '')
  const [cbuVal, setCbuVal] = useState(caja?.cbu ?? '')
  const [numeroCuenta, setNumeroCuenta] = useState(caja?.numero_cuenta ?? '')
  const [cuentaId, setCuentaId] = useState(caja?.cuenta_id ?? '')
  const [descripcion, setDescripcion] = useState(caja?.descripcion ?? '')

  const [seccion2Open, setSeccion2Open] = useState(!!caja?.entidad_id || !!caja?.actividad_slug || !!caja?.responsable_id)
  const [seccion3Open, setSeccion3Open] = useState(!!caja?.banco_nombre || !!caja?.cbu)
  const [seccion4Open, setSeccion4Open] = useState(!!caja?.cuenta_id || !!caja?.descripcion)

  const showBancarios = tipo === 'banco' || tipo === 'mercadopago'

  function resetForm() {
    setNombre('')
    setTipo('efectivo')
    setTipoFiscal('blanco')
    setMoneda('ARS')
    setActiva(true)
    setEntidadId('')
    setActividadSlug('')
    setResponsableId('')
    setBancoNombre('')
    setCbuVal('')
    setNumeroCuenta('')
    setCuentaId('')
    setDescripcion('')
    setSeccion2Open(false)
    setSeccion3Open(false)
    setSeccion4Open(false)
  }

  function handleSubmit() {
    if (!nombre.trim()) {
      toast.error('El nombre es obligatorio')
      return
    }

    const fd = new FormData()
    fd.set('nombre', nombre.trim())
    fd.set('tipo', tipo)
    fd.set('tipo_fiscal', tipoFiscal)
    fd.set('moneda', moneda)
    fd.set('activa', activa ? 'true' : 'false')
    if (entidadId) fd.set('entidad_id', entidadId)
    if (actividadSlug.trim()) fd.set('actividad_slug', actividadSlug.trim())
    if (responsableId) fd.set('responsable_id', responsableId)
    if (bancoNombre.trim()) fd.set('banco_nombre', bancoNombre.trim())
    if (cbuVal.trim()) fd.set('cbu', cbuVal.trim())
    if (numeroCuenta.trim()) fd.set('numero_cuenta', numeroCuenta.trim())
    if (cuentaId) fd.set('cuenta_id', cuentaId)
    if (descripcion.trim()) fd.set('descripcion', descripcion.trim())

    startTransition(async () => {
      const res = isEdit ? await editarCaja(caja.id, fd) : await crearCaja(fd)
      if (res.success) {
        toast.success(isEdit ? 'Caja actualizada' : 'Caja creada')
        setOpen(false)
        if (!isEdit) resetForm()
        router.refresh()
      } else {
        toast.error(res.error ?? 'Error desconocido')
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger as React.ReactElement ?? (
        <Button>
          <Plus className="h-4 w-4 mr-1" />
          Nueva caja
        </Button>
      )} />
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar caja' : 'Nueva caja'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-5">
          {/* Seccion 1: Identificacion */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground">Identificacion</h4>
            <div className="space-y-2">
              <Label>Nombre *</Label>
              <Input value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Ej: Caja General" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Tipo *</Label>
                <Select value={tipo} onValueChange={v => setTipo(v ?? 'efectivo')}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TIPOS_CAJA.map(t => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Moneda *</Label>
                <Select value={moneda} onValueChange={v => setMoneda(v ?? 'ARS')}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {MONEDAS.map(m => (
                      <SelectItem key={m} value={m}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Tipo fiscal *</Label>
              <div className="flex gap-2">
                {TIPOS_FISCAL.map(tf => (
                  <button
                    key={tf.value}
                    type="button"
                    onClick={() => setTipoFiscal(tf.value)}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium border transition-colors ${
                      tipoFiscal === tf.value
                        ? tf.color + ' border-transparent'
                        : 'bg-muted/50 text-muted-foreground border-border hover:bg-muted'
                    }`}
                  >
                    {tf.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={activa} onCheckedChange={setActiva} />
              <Label>Activa</Label>
            </div>
          </div>

          {/* Seccion 2: Asociacion */}
          <Collapsible open={seccion2Open} onOpenChange={setSeccion2Open}>
            <CollapsibleTrigger className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground w-full">
              <ChevronDown className={`h-4 w-4 transition-transform ${seccion2Open ? '' : '-rotate-90'}`} />
              Asociacion (opcional)
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-3 mt-2">
              <div className="space-y-2">
                <Label>Entidad</Label>
                <Select value={entidadId} onValueChange={v => setEntidadId(v ?? '')}>
                  <SelectTrigger><SelectValue placeholder="Sin entidad" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Sin entidad</SelectItem>
                    {entidades.map(e => (
                      <SelectItem key={e.id} value={e.id}>{e.nombre} ({e.tipo})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Actividad</Label>
                <Input
                  value={actividadSlug}
                  onChange={e => setActividadSlug(e.target.value)}
                  placeholder="Ej: cuotas, cantina, torneos"
                  list="actividades-sugeridas"
                />
                {actividadesSugeridas.length > 0 && (
                  <datalist id="actividades-sugeridas">
                    {actividadesSugeridas.map(a => <option key={a} value={a} />)}
                  </datalist>
                )}
              </div>
              <div className="space-y-2">
                <Label>Responsable</Label>
                <Select value={responsableId} onValueChange={v => setResponsableId(v ?? '')}>
                  <SelectTrigger><SelectValue placeholder="Sin responsable" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Sin responsable</SelectItem>
                    {personas.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.apellido}, {p.nombre}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Seccion 3: Datos bancarios */}
          {showBancarios && (
            <Collapsible open={seccion3Open} onOpenChange={setSeccion3Open}>
              <CollapsibleTrigger className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground w-full">
                <ChevronDown className={`h-4 w-4 transition-transform ${seccion3Open ? '' : '-rotate-90'}`} />
                Datos bancarios
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-3 mt-2">
                <div className="space-y-2">
                  <Label>Banco / Plataforma</Label>
                  <Input value={bancoNombre} onChange={e => setBancoNombre(e.target.value)} placeholder="Ej: Galicia, Santander" />
                </div>
                <div className="space-y-2">
                  <Label>CBU/CVU</Label>
                  <Input value={cbuVal} onChange={e => setCbuVal(e.target.value)} placeholder="22 digitos" />
                </div>
                <div className="space-y-2">
                  <Label>Numero de cuenta</Label>
                  <Input value={numeroCuenta} onChange={e => setNumeroCuenta(e.target.value)} placeholder="Ej: 123-456789/0" />
                </div>
              </CollapsibleContent>
            </Collapsible>
          )}

          {/* Seccion 4: Contabilidad */}
          <Collapsible open={seccion4Open} onOpenChange={setSeccion4Open}>
            <CollapsibleTrigger className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground w-full">
              <ChevronDown className={`h-4 w-4 transition-transform ${seccion4Open ? '' : '-rotate-90'}`} />
              Contabilidad (opcional)
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-3 mt-2">
              <div className="space-y-2">
                <Label>Cuenta contable</Label>
                <Select value={cuentaId} onValueChange={v => setCuentaId(v ?? '')}>
                  <SelectTrigger><SelectValue placeholder="Sin cuenta" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Sin cuenta</SelectItem>
                    {cuentas.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.codigo} - {c.nombre}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Descripcion</Label>
                <Textarea value={descripcion} onChange={e => setDescripcion(e.target.value)} rows={2} />
              </div>
            </CollapsibleContent>
          </Collapsible>

          <Button onClick={handleSubmit} disabled={isPending} className="w-full">
            {isPending ? <><Loader2 className="h-4 w-4 mr-1 animate-spin" />Guardando...</> : isEdit ? 'Guardar cambios' : 'Crear caja'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
