'use client'

import { useState, useTransition, useEffect } from 'react'
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
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { crearMovimiento } from '@/modules/finanzas/lib/actions'

// -------------------------------------------------------------------
// Tipos
// -------------------------------------------------------------------

interface Caja {
  id: string
  nombre: string
  tipo: string
  activa: boolean
}

interface Categoria {
  id: string
  nombre: string
  tipo: string
}

interface MedioPago {
  id: string
  nombre: string
}

interface CentroCosto {
  id: string
  nombre: string
}

interface MovimientoFormProps {
  cajas: Caja[]
  categorias: Categoria[]
  mediosPago: MedioPago[]
  centrosCosto: CentroCosto[]
  cajaPreseleccionada?: string
  onSuccess?: () => void
}

// -------------------------------------------------------------------
// Helpers
// -------------------------------------------------------------------

function formatMoney(amount: number | null, currency = 'ARS') {
  if (amount == null) return '-'
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency }).format(amount)
}

const COMPROBANTE_TIPOS = [
  { value: 'factura_a', label: 'Factura A' },
  { value: 'factura_b', label: 'Factura B' },
  { value: 'factura_c', label: 'Factura C' },
  { value: 'recibo', label: 'Recibo' },
  { value: 'ticket', label: 'Ticket' },
  { value: 'nota_credito', label: 'Nota de credito' },
  { value: 'nota_debito', label: 'Nota de debito' },
  { value: 'otro', label: 'Otro' },
]

// -------------------------------------------------------------------
// Componente
// -------------------------------------------------------------------

export function MovimientoForm({
  cajas,
  categorias,
  mediosPago,
  centrosCosto,
  cajaPreseleccionada,
  onSuccess,
}: MovimientoFormProps) {
  const [isPending, startTransition] = useTransition()

  // Form state
  const [tipo, setTipo] = useState<string>('ingreso')
  const [cajaId, setCajaId] = useState<string>(cajaPreseleccionada ?? '')
  const [cajaDestinoId, setCajaDestinoId] = useState<string>('')
  const [montoBruto, setMontoBruto] = useState<string>('')
  const [impuestos, setImpuestos] = useState<string>('')
  const [retenciones, setRetenciones] = useState<string>('')
  const [categoriaId, setCategoriaId] = useState<string>('')
  const [medioPagoId, setMedioPagoId] = useState<string>('')
  const [personaBusqueda, setPersonaBusqueda] = useState<string>('')
  const [personaId, setPersonaId] = useState<string>('')
  const [entidadNombre, setEntidadNombre] = useState<string>('')
  const [comprobanteTipo, setComprobanteTipo] = useState<string>('')
  const [comprobanteNumero, setComprobanteNumero] = useState<string>('')
  const [centroCostoId, setCentroCostoId] = useState<string>('')
  const [fecha, setFecha] = useState<string>(new Date().toISOString().split('T')[0])
  const [descripcion, setDescripcion] = useState<string>('')

  // Auto-calc monto neto
  const bruto = parseFloat(montoBruto) || 0
  const imp = parseFloat(impuestos) || 0
  const ret = parseFloat(retenciones) || 0
  const montoNeto = bruto - imp - ret

  // Filter categorias by tipo
  const categoriasFiltered = categorias.filter((c) => c.tipo === tipo)

  // Reset categoria when tipo changes
  useEffect(() => {
    setCategoriaId('')
  }, [tipo])

  function handleSubmit() {
    // Validations
    if (!tipo) {
      toast.error('Selecciona un tipo de movimiento')
      return
    }
    if (!cajaId) {
      toast.error('Selecciona una caja')
      return
    }
    if (tipo === 'transferencia' && !cajaDestinoId) {
      toast.error('Selecciona una caja destino para la transferencia')
      return
    }
    if (tipo === 'transferencia' && cajaDestinoId === cajaId) {
      toast.error('La caja destino debe ser diferente a la caja origen')
      return
    }
    if (bruto <= 0) {
      toast.error('El monto bruto debe ser mayor a cero')
      return
    }
    if (!fecha) {
      toast.error('Selecciona una fecha')
      return
    }

    const formData = new FormData()
    formData.set('tipo', tipo)
    formData.set('caja_id', cajaId)
    if (tipo === 'transferencia' && cajaDestinoId) {
      formData.set('caja_destino_id', cajaDestinoId)
    }
    formData.set('monto_bruto', bruto.toString())
    formData.set('impuestos', imp.toString())
    formData.set('retenciones', ret.toString())
    formData.set('monto_neto', montoNeto.toString())
    if (categoriaId) formData.set('categoria_id', categoriaId)
    if (medioPagoId) formData.set('medio_pago_id', medioPagoId)
    if (personaId) formData.set('persona_id', personaId)
    if (entidadNombre) formData.set('entidad_nombre', entidadNombre)
    if (comprobanteTipo) formData.set('comprobante_tipo', comprobanteTipo)
    if (comprobanteNumero) formData.set('comprobante_numero', comprobanteNumero)
    if (centroCostoId) formData.set('centro_costo_id', centroCostoId)
    formData.set('fecha', fecha)
    if (descripcion) formData.set('descripcion', descripcion)

    startTransition(async () => {
      const result = await crearMovimiento(formData)
      if (result.success) {
        toast.success('Movimiento creado correctamente')
        onSuccess?.()
      } else {
        toast.error(result.error ?? 'Error al crear el movimiento')
      }
    })
  }

  return (
    <div className="space-y-4">
      {/* Tipo */}
      <div className="space-y-1.5">
        <Label>Tipo de movimiento *</Label>
        <Select value={tipo} onValueChange={(val) => setTipo(val ?? 'ingreso')}>
          <SelectTrigger>
            <SelectValue placeholder="Seleccionar tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ingreso">Ingreso</SelectItem>
            <SelectItem value="egreso">Egreso</SelectItem>
            <SelectItem value="transferencia">Transferencia entre cajas</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Caja origen */}
      <div className="space-y-1.5">
        <Label>{tipo === 'transferencia' ? 'Caja origen *' : 'Caja *'}</Label>
        <Select value={cajaId} onValueChange={(val) => setCajaId(val ?? '')}>
          <SelectTrigger>
            <SelectValue placeholder="Seleccionar caja" />
          </SelectTrigger>
          <SelectContent>
            {cajas.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.nombre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Caja destino (solo transferencia) */}
      {tipo === 'transferencia' && (
        <div className="space-y-1.5">
          <Label>Caja destino *</Label>
          <Select value={cajaDestinoId} onValueChange={(val) => setCajaDestinoId(val ?? '')}>
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar caja destino" />
            </SelectTrigger>
            <SelectContent>
              {cajas
                .filter((c) => c.id !== cajaId)
                .map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.nombre}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Montos */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="space-y-1.5">
          <Label>Monto bruto *</Label>
          <Input
            type="number"
            min="0"
            step="0.01"
            placeholder="0.00"
            value={montoBruto}
            onChange={(e) => setMontoBruto(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Impuestos</Label>
          <Input
            type="number"
            min="0"
            step="0.01"
            placeholder="0.00"
            value={impuestos}
            onChange={(e) => setImpuestos(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Retenciones</Label>
          <Input
            type="number"
            min="0"
            step="0.01"
            placeholder="0.00"
            value={retenciones}
            onChange={(e) => setRetenciones(e.target.value)}
          />
        </div>
      </div>

      {/* Monto neto (calculated) */}
      <div className="rounded-lg bg-muted/50 p-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Monto neto</span>
          <span className={`text-lg font-bold ${montoNeto > 0 ? (tipo === 'ingreso' ? 'text-success-600 dark:text-success-400' : tipo === 'egreso' ? 'text-error-600 dark:text-error-400' : '') : ''}`}>
            {formatMoney(montoNeto)}
          </span>
        </div>
      </div>

      {/* Categoria y medio de pago */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Categoria</Label>
          <Select value={categoriaId} onValueChange={(val) => setCategoriaId(val ?? '')}>
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar categoria" />
            </SelectTrigger>
            <SelectContent>
              {categoriasFiltered.length === 0 ? (
                <SelectItem value="_none" disabled>
                  Sin categorias para este tipo
                </SelectItem>
              ) : (
                categoriasFiltered.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.nombre}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Medio de pago</Label>
          <Select value={medioPagoId} onValueChange={(val) => setMedioPagoId(val ?? '')}>
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar medio" />
            </SelectTrigger>
            <SelectContent>
              {mediosPago.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Persona / Entidad */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Persona (DNI o nombre)</Label>
          <Input
            type="text"
            placeholder="Buscar por DNI o nombre..."
            value={personaBusqueda}
            onChange={(e) => {
              setPersonaBusqueda(e.target.value)
              // For simplicity, using the input as persona_id if it looks like a UUID
              // In a full implementation, this would be an autocomplete search
              setPersonaId('')
            }}
          />
          <p className="text-[10px] text-muted-foreground">
            Ingresa el ID de la persona o usa el buscador (proximamente)
          </p>
        </div>
        <div className="space-y-1.5">
          <Label>Entidad (si no es persona)</Label>
          <Input
            type="text"
            placeholder="Nombre de la entidad..."
            value={entidadNombre}
            onChange={(e) => setEntidadNombre(e.target.value)}
          />
        </div>
      </div>

      {/* Comprobante */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Tipo de comprobante</Label>
          <Select value={comprobanteTipo} onValueChange={(val) => setComprobanteTipo(val ?? '')}>
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar tipo" />
            </SelectTrigger>
            <SelectContent>
              {COMPROBANTE_TIPOS.map((ct) => (
                <SelectItem key={ct.value} value={ct.value}>
                  {ct.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Numero de comprobante</Label>
          <Input
            type="text"
            placeholder="0001-00000001"
            value={comprobanteNumero}
            onChange={(e) => setComprobanteNumero(e.target.value)}
          />
        </div>
      </div>

      {/* Centro de costo y fecha */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Centro de costo</Label>
          <Select value={centroCostoId} onValueChange={(val) => setCentroCostoId(val ?? '')}>
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar centro" />
            </SelectTrigger>
            <SelectContent>
              {centrosCosto.map((cc) => (
                <SelectItem key={cc.id} value={cc.id}>
                  {cc.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Fecha *</Label>
          <Input
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
          />
        </div>
      </div>

      {/* Descripcion */}
      <div className="space-y-1.5">
        <Label>Descripcion</Label>
        <Textarea
          placeholder="Detalle del movimiento..."
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          rows={3}
        />
      </div>

      {/* Submit */}
      <div className="flex justify-end gap-2 pt-2">
        <Button onClick={handleSubmit} disabled={isPending}>
          {isPending && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
          Registrar movimiento
        </Button>
      </div>
    </div>
  )
}
