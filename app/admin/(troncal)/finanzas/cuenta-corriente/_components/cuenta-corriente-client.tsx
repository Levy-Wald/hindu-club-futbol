'use client'

import { useState, useTransition, useCallback, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { DollarSign, AlertTriangle, CheckCircle2, Clock, CreditCard } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const TENANT_ID = '11111111-1111-1111-1111-111111111111'

interface Persona {
  id: string
  nombre: string
  apellido: string
  numero_documento: string | null
}

interface Resumen {
  cuotas_pendientes: number
  cuotas_vencidas: number
  saldo_deudor: number
  pagado_ultimos_30d: number
  ultimo_pago_fecha: string | null
}

interface MovimientoRow {
  fecha: string
  tipo_display: string
  concepto: string
  debe: number | null
  haber: number | null
}

function formatMoney(v: number | null): string {
  if (v == null) return '-'
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(v)
}

function formatFecha(iso: string | null): string {
  if (!iso) return '-'
  return new Date(iso + 'T12:00:00').toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })
}

interface CuentaCorrienteClientProps {
  personas: Persona[]
  cajasMap: Record<string, string>
}

export function CuentaCorrienteClient({ personas, cajasMap }: CuentaCorrienteClientProps) {
  const [personaId, setPersonaId] = useState('')
  const [busqueda, setBusqueda] = useState('')
  const [resumen, setResumen] = useState<Resumen | null>(null)
  const [movimientos, setMovimientos] = useState<MovimientoRow[]>([])
  const [loading, setLoading] = useState(false)

  const personasFiltradas = busqueda
    ? personas.filter(p =>
        `${p.apellido} ${p.nombre} ${p.numero_documento ?? ''}`.toLowerCase().includes(busqueda.toLowerCase())
      ).slice(0, 50)
    : personas.slice(0, 50)

  const fetchData = useCallback(async (pid: string) => {
    if (!pid) { setResumen(null); setMovimientos([]); return }
    setLoading(true)
    const supabase = createClient()

    // Resumen from view
    const { data: resumenData } = await supabase
      .from('v_cuenta_corriente_persona')
      .select('*')
      .eq('tenant_id', TENANT_ID)
      .eq('persona_id', pid)
      .maybeSingle()

    setResumen(resumenData ? {
      cuotas_pendientes: Number(resumenData.cuotas_pendientes) || 0,
      cuotas_vencidas: Number(resumenData.cuotas_vencidas) || 0,
      saldo_deudor: Number(resumenData.saldo_deudor) || 0,
      pagado_ultimos_30d: Number(resumenData.pagado_ultimos_30d) || 0,
      ultimo_pago_fecha: resumenData.ultimo_pago_fecha,
    } : null)

    // Cuotas emitidas
    const { data: cuotas } = await supabase
      .from('cuotas_emitidas')
      .select('id, periodo, monto_final, estado, fecha_emision, fecha_vencimiento')
      .eq('tenant_id', TENANT_ID)
      .eq('persona_id', pid)
      .order('fecha_vencimiento', { ascending: false })
      .limit(100)

    // Pagos (via cuotas)
    const cuotaIds = (cuotas ?? []).map(c => c.id)
    let pagos: { cuota_id: string; fecha_pago: string; monto_pagado: number; estado: string }[] = []
    if (cuotaIds.length > 0) {
      const { data: pagosData } = await supabase
        .from('cuotas_pagos')
        .select('cuota_id, fecha_pago, monto_pagado, estado')
        .eq('tenant_id', TENANT_ID)
        .in('cuota_id', cuotaIds)
        .order('fecha_pago', { ascending: false })
      pagos = pagosData ?? []
    }

    // Movimientos manuales
    const { data: movs } = await supabase
      .from('movimientos_caja')
      .select('id, fecha, tipo, monto_neto, descripcion, anulado')
      .eq('tenant_id', TENANT_ID)
      .eq('persona_id', pid)
      .eq('anulado', false)
      .order('fecha', { ascending: false })
      .limit(100)

    // Unify
    const rows: MovimientoRow[] = []

    for (const c of cuotas ?? []) {
      if (c.estado === 'anulada') continue
      rows.push({
        fecha: c.fecha_vencimiento ?? c.fecha_emision,
        tipo_display: 'Cuota emitida',
        concepto: `Periodo ${c.periodo} — vto ${formatFecha(c.fecha_vencimiento)}`,
        debe: Number(c.monto_final) || 0,
        haber: null,
      })
    }

    for (const p of pagos) {
      if (p.estado === 'anulado') continue
      rows.push({
        fecha: p.fecha_pago,
        tipo_display: 'Pago',
        concepto: `Pago de cuota`,
        debe: null,
        haber: Number(p.monto_pagado) || 0,
      })
    }

    for (const m of movs ?? []) {
      rows.push({
        fecha: m.fecha,
        tipo_display: 'Movimiento',
        concepto: m.descripcion || `${m.tipo}`,
        debe: m.tipo === 'egreso' ? Number(m.monto_neto) : null,
        haber: m.tipo === 'ingreso' ? Number(m.monto_neto) : null,
      })
    }

    // Sort by fecha DESC
    rows.sort((a, b) => b.fecha.localeCompare(a.fecha))

    // Compute running balance (from oldest to newest, then reverse display)
    let saldo = 0
    const withSaldo = [...rows].reverse().map(r => {
      if (r.debe) saldo += r.debe
      if (r.haber) saldo -= r.haber
      return { ...r, saldo }
    }).reverse()

    setMovimientos(withSaldo as MovimientoRow[])
    setLoading(false)
  }, [])

  useEffect(() => {
    if (personaId) fetchData(personaId)
    else { setResumen(null); setMovimientos([]) }
  }, [personaId, fetchData])

  const tipoBadgeClass = (tipo: string) => {
    switch (tipo) {
      case 'Cuota emitida': return 'bg-warning-100 text-warning-800 dark:bg-warning-900/30 dark:text-warning-400'
      case 'Pago': return 'bg-success-100 text-success-800 dark:bg-success-900/30 dark:text-success-400'
      default: return 'bg-info-100 text-info-800 dark:bg-info-900/30 dark:text-info-400'
    }
  }

  return (
    <div className="space-y-6">
      {/* Persona selector */}
      <Card>
        <CardContent className="pt-4">
          <div className="space-y-2">
            <Label>Seleccionar persona</Label>
            <Input placeholder="Buscar por nombre o DNI..." value={busqueda} onChange={e => setBusqueda(e.target.value)} />
            <Select value={personaId} onValueChange={v => setPersonaId(v ?? '')}>
              <option value="">Seleccionar...</option>
              {personasFiltradas.map(p => (
                <option key={p.id} value={p.id}>
                  {p.apellido}, {p.nombre} {p.numero_documento ? `(${p.numero_documento})` : ''}
                </option>
              ))}
            </Select>
          </div>
        </CardContent>
      </Card>

      {loading && <p className="text-sm text-muted-foreground text-center">Cargando...</p>}

      {/* Resumen cards */}
      {resumen && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <DollarSign className="h-4 w-4" />
                <span className="text-xs">Saldo deudor</span>
              </div>
              <p className={`text-lg font-bold ${resumen.saldo_deudor > 0 ? 'text-error-600' : 'text-success-600'}`}>
                {formatMoney(resumen.saldo_deudor)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Clock className="h-4 w-4" />
                <span className="text-xs">Cuotas pendientes</span>
              </div>
              <p className="text-lg font-bold">{resumen.cuotas_pendientes}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <AlertTriangle className="h-4 w-4" />
                <span className="text-xs">Cuotas vencidas</span>
              </div>
              <p className="text-lg font-bold">
                {resumen.cuotas_vencidas > 0 ? (
                  <Badge variant="destructive">{resumen.cuotas_vencidas}</Badge>
                ) : '0'}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <CreditCard className="h-4 w-4" />
                <span className="text-xs">Pagado ult. 30d</span>
              </div>
              <p className="text-lg font-bold">{formatMoney(resumen.pagado_ultimos_30d)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <CheckCircle2 className="h-4 w-4" />
                <span className="text-xs">Ultimo pago</span>
              </div>
              <p className="text-sm font-medium">{formatFecha(resumen.ultimo_pago_fecha)}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Detail table */}
      {personaId && !loading && movimientos.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Detalle de movimientos</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Concepto</TableHead>
                    <TableHead className="text-right">Debe</TableHead>
                    <TableHead className="text-right">Haber</TableHead>
                    <TableHead className="text-right">Saldo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {movimientos.map((m, i) => (
                    <TableRow key={i}>
                      <TableCell>{formatFecha(m.fecha)}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={tipoBadgeClass(m.tipo_display)}>
                          {m.tipo_display}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">{m.concepto}</TableCell>
                      <TableCell className="text-right font-mono text-error-600">
                        {m.debe ? formatMoney(m.debe) : ''}
                      </TableCell>
                      <TableCell className="text-right font-mono text-success-600">
                        {m.haber ? formatMoney(m.haber) : ''}
                      </TableCell>
                      <TableCell className="text-right font-mono font-medium">
                        {formatMoney((m as MovimientoRow & { saldo?: number }).saldo ?? 0)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {personaId && !loading && movimientos.length === 0 && resumen && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-sm text-muted-foreground">No hay movimientos para esta persona</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
