'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import { Settings, Loader2 } from 'lucide-react'
import { actualizarConfigFinanciera } from '@/modules/finanzas/lib/actions'

const MONEDAS = ['ARS', 'USD', 'EUR', 'BRL', 'UYU', 'CLP']

interface ConfigFormProps {
  config: {
    moneda_principal: string
    moneda_equivalencia: string | null
    comprobante_obligatorio_ingreso: boolean
    comprobante_obligatorio_egreso: boolean
    comprobante_obligatorio_transferencia: boolean
    mora_automatica: boolean
    mora_porcentaje_default: number | null
    mora_dias_gracia_default: number | null
    cierre_automatico: boolean
    numeracion_movimientos: boolean
    proximo_numero_movimiento: number | null
  } | null
}

export function ConfigFinancieraForm({ config }: ConfigFormProps) {
  const [pending, startTransition] = useTransition()
  const [editNumero, setEditNumero] = useState(false)

  const c = config ?? {
    moneda_principal: 'ARS',
    moneda_equivalencia: 'USD',
    comprobante_obligatorio_ingreso: false,
    comprobante_obligatorio_egreso: false,
    comprobante_obligatorio_transferencia: false,
    mora_automatica: false,
    mora_porcentaje_default: 5,
    mora_dias_gracia_default: 10,
    cierre_automatico: false,
    numeracion_movimientos: true,
    proximo_numero_movimiento: 1,
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)

    // Switches send value only when checked - set false explicitly
    if (!form.has('comprobante_obligatorio_ingreso')) form.set('comprobante_obligatorio_ingreso', 'false')
    if (!form.has('comprobante_obligatorio_egreso')) form.set('comprobante_obligatorio_egreso', 'false')
    if (!form.has('comprobante_obligatorio_transferencia')) form.set('comprobante_obligatorio_transferencia', 'false')
    if (!form.has('mora_automatica')) form.set('mora_automatica', 'false')
    if (!form.has('cierre_automatico')) form.set('cierre_automatico', 'false')
    if (!form.has('numeracion_movimientos')) form.set('numeracion_movimientos', 'false')

    startTransition(async () => {
      const res = await actualizarConfigFinanciera(form)
      if (res.success) toast.success('Configuracion guardada')
      else toast.error(res.error)
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <Settings className="h-6 w-6 text-muted-foreground" />
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">Configuracion Financiera</h1>
            <p className="text-sm text-muted-foreground">Parametros generales del modulo de finanzas</p>
          </div>
        </div>
        <Button type="submit" disabled={pending}>
          {pending && <Loader2 className="h-4 w-4 animate-spin" />}
          {pending ? 'Guardando...' : 'Guardar configuracion'}
        </Button>
      </div>

      {/* Moneda */}
      <Card>
        <CardHeader><CardTitle className="text-base">Moneda</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Moneda principal</Label>
            <Select name="moneda_principal" defaultValue={c.moneda_principal}>
              {MONEDAS.map(m => <option key={m} value={m}>{m}</option>)}
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Moneda equivalencia (reportes)</Label>
            <Select name="moneda_equivalencia" defaultValue={c.moneda_equivalencia ?? ''}>
              <option value="">Ninguna</option>
              {MONEDAS.filter(m => m !== c.moneda_principal).map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Comprobantes */}
      <Card>
        <CardHeader><CardTitle className="text-base">Comprobantes obligatorios</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>En ingresos</Label>
            <Switch name="comprobante_obligatorio_ingreso" value="true" defaultChecked={c.comprobante_obligatorio_ingreso} />
          </div>
          <div className="flex items-center justify-between">
            <Label>En egresos</Label>
            <Switch name="comprobante_obligatorio_egreso" value="true" defaultChecked={c.comprobante_obligatorio_egreso} />
          </div>
          <div className="flex items-center justify-between">
            <Label>En transferencias</Label>
            <Switch name="comprobante_obligatorio_transferencia" value="true" defaultChecked={c.comprobante_obligatorio_transferencia} />
          </div>
        </CardContent>
      </Card>

      {/* Mora */}
      <Card>
        <CardHeader><CardTitle className="text-base">Mora</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Mora automatica</Label>
            <Switch name="mora_automatica" value="true" defaultChecked={c.mora_automatica} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Porcentaje de mora (%)</Label>
              <Input name="mora_porcentaje_default" type="number" step="0.1" min="0" max="100"
                defaultValue={c.mora_porcentaje_default ?? 5} />
            </div>
            <div className="space-y-2">
              <Label>Dias de gracia</Label>
              <Input name="mora_dias_gracia_default" type="number" min="0" max="90"
                defaultValue={c.mora_dias_gracia_default ?? 10} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cierre y numeracion */}
      <Card>
        <CardHeader><CardTitle className="text-base">Cierre y numeracion</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Cierre automatico mensual</Label>
            <Switch name="cierre_automatico" value="true" defaultChecked={c.cierre_automatico} />
          </div>
          <div className="flex items-center justify-between">
            <Label>Numeracion automatica de movimientos</Label>
            <Switch name="numeracion_movimientos" value="true" defaultChecked={c.numeracion_movimientos} />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Proximo numero de movimiento</Label>
              {!editNumero && (
                <Button type="button" variant="link" size="sm" onClick={() => setEditNumero(true)}>
                  Editar manualmente
                </Button>
              )}
            </div>
            <Input name="proximo_numero_movimiento" type="number" min="1"
              defaultValue={c.proximo_numero_movimiento ?? 1}
              disabled={!editNumero}
            />
          </div>
        </CardContent>
      </Card>

    </form>
  )
}
