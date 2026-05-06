'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  User, CreditCard, CheckCircle2, AlertTriangle, Clock, FileText,
  Search, Download, ArrowRightLeft, Wallet, Shield, LogOut, ChevronRight,
  Mail, Phone, Calendar, Hash, Building2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { ExportFormatSelector } from '@/components/ui/export-format-selector'
import type { ExportData } from '@/lib/export/formats'

// --- Types ---

interface Persona {
  id: string
  nombre: string
  apellido: string
  foto_url: string | null
  dni: string | null
  email: string | null
  telefono: string | null
  fecha_nacimiento: string | null
  created_at: string
}

interface Tenant {
  nombre: string
  plan: string
  tipo: string
}

interface Membresia {
  numero_socio: string | null
  fecha_alta: string | null
  padron_nombre: string | null
}

interface CuentaCorriente {
  saldo: number
  saldo_usd: number | null
  ultimo_movimiento_at: string | null
  tipo: string
}

interface Cuota {
  id: string
  periodo: string
  monto_original: number
  monto_final: number
  estado: string
  fecha_emision: string
  fecha_vencimiento: string
  moneda: string
}

interface Movimiento {
  id: string
  numero: number | null
  tipo: string
  monto_neto: number
  moneda: string
  fecha: string
  descripcion: string | null
  categoria_id: string | null
  anulado: boolean
}

interface Convenio {
  id: string
  deuda_original: number
  cantidad_cuotas: number
  monto_cuota: number
  cuotas_pagadas: number
  estado: string
  fecha_inicio: string
  proximo_vencimiento: string | null
}

interface MiCuentaClientProps {
  persona: Persona
  tenant: Tenant
  membresia: Membresia
  atributos: string[]
  cuentaCorriente: CuentaCorriente | null
  cuotas: Cuota[]
  movimientos: Movimiento[]
  convenios: Convenio[]
}

// --- Helpers ---

const PLAN_LABELS: Record<string, string> = {
  free: 'Free',
  pro: 'Pro',
  enterprise: 'Enterprise',
}

const ESTADO_CUOTA_STYLES: Record<string, string> = {
  pendiente: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  vencida: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  pagada: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  parcial: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  anulada: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
}

const ESTADO_CUOTA_LABELS: Record<string, string> = {
  pendiente: 'Pendiente',
  vencida: 'Vencida',
  pagada: 'Pagada',
  parcial: 'Parcial',
  anulada: 'Anulada',
}

function formatMonto(monto: number, moneda = 'ARS'): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: moneda,
  }).format(monto)
}

function formatFecha(fecha: string): string {
  return new Date(fecha + 'T12:00:00').toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function formatFechaCorta(fecha: string): string {
  return new Date(fecha + 'T12:00:00').toLocaleDateString('es-AR', {
    month: 'short',
    year: 'numeric',
  })
}

// --- Component ---

export function MiCuentaClient({
  persona,
  tenant,
  membresia,
  atributos,
  cuentaCorriente,
  cuotas,
  movimientos,
  convenios,
}: MiCuentaClientProps) {
  const [cuotaSearch, setCuotaSearch] = useState('')
  const [cuotaFilter, setCuotaFilter] = useState('todos')
  const [movSearch, setMovSearch] = useState('')
  const [movFilter, setMovFilter] = useState('todos')

  const saldo = cuentaCorriente?.saldo ?? 0
  const cuotasVencidas = cuotas.filter((c) => c.estado === 'vencida')
  const cuotasPendientes = cuotas.filter((c) => c.estado === 'pendiente' || c.estado === 'vencida')
  const alDia = cuotasVencidas.length === 0

  const esSocio = atributos.includes('socio_padron')
  const esAdmin = atributos.includes('admin_tenant') || atributos.includes('admin_sistema')

  // Filter cuotas
  const filteredCuotas = useMemo(() => {
    let result = cuotas
    if (cuotaFilter !== 'todos') {
      result = result.filter((c) => c.estado === cuotaFilter)
    }
    if (cuotaSearch) {
      const q = cuotaSearch.toLowerCase()
      result = result.filter(
        (c) =>
          c.periodo.toLowerCase().includes(q) ||
          formatMonto(c.monto_final).includes(q)
      )
    }
    return result
  }, [cuotas, cuotaFilter, cuotaSearch])

  // Filter movimientos
  const filteredMovimientos = useMemo(() => {
    let result = movimientos
    if (movFilter !== 'todos') {
      result = result.filter((m) => m.tipo === movFilter)
    }
    if (movSearch) {
      const q = movSearch.toLowerCase()
      result = result.filter(
        (m) =>
          (m.descripcion ?? '').toLowerCase().includes(q) ||
          (m.numero ? `#${m.numero}`.includes(q) : false) ||
          formatMonto(m.monto_neto).includes(q)
      )
    }
    return result
  }, [movimientos, movFilter, movSearch])

  // Export data
  const cuotasExportData: ExportData = {
    filename: 'mis-cuotas',
    headers: ['Periodo', 'Monto', 'Estado', 'Vencimiento'],
    rows: filteredCuotas.map((c) => [
      c.periodo,
      formatMonto(c.monto_final, c.moneda),
      ESTADO_CUOTA_LABELS[c.estado] ?? c.estado,
      formatFecha(c.fecha_vencimiento),
    ]),
  }

  const movimientosExportData: ExportData = {
    filename: 'mis-movimientos',
    headers: ['#', 'Tipo', 'Descripcion', 'Monto', 'Fecha'],
    rows: filteredMovimientos.map((m) => [
      m.numero ? `#${m.numero}` : '-',
      m.tipo === 'ingreso' ? 'Ingreso' : 'Egreso',
      m.descripcion ?? '-',
      `${m.tipo === 'ingreso' ? '+' : '-'}${formatMonto(Math.abs(m.monto_neto), m.moneda)}`,
      formatFecha(m.fecha),
    ]),
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">Mi cuenta</h1>
            <p className="text-sm text-muted-foreground">
              Gestioná tu membresía, cuotas y medios de pago
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => toast.info('Tu solicitud de cambio de plan fue enviada. Te contactaremos a la brevedad.')}
          >
            <ArrowRightLeft className="h-4 w-4 mr-1.5" />
            Cambiar de plan
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-destructive hover:text-destructive"
            onClick={() => toast.info('Tu solicitud de baja fue enviada. Te contactaremos para confirmar.')}
          >
            <LogOut className="h-4 w-4 mr-1.5" />
            Solicitar baja
          </Button>
        </div>
      </div>

      {/* Row 1: Carnet + Saldo */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Carnet de socio */}
        <Card className="lg:col-span-3">
          <CardContent className="p-5">
            <div className="flex flex-col sm:flex-row gap-5">
              {/* Avatar */}
              <div className="shrink-0 flex sm:flex-col items-center gap-3 sm:gap-2">
                {persona.foto_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={persona.foto_url}
                    alt={persona.nombre}
                    className="h-20 w-20 rounded-xl object-cover border-2 border-primary/20"
                  />
                ) : (
                  <div className="h-20 w-20 rounded-xl bg-primary/10 flex items-center justify-center border-2 border-primary/20">
                    <User className="h-10 w-10 text-primary/50" />
                  </div>
                )}
                <Badge
                  variant={esSocio ? 'default' : 'secondary'}
                  className="text-xs"
                >
                  {esSocio ? 'Socio activo' : 'Usuario'}
                </Badge>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0 space-y-3">
                <div>
                  <h2 className="text-lg font-bold truncate">
                    {persona.apellido?.toUpperCase()}, {persona.nombre}
                  </h2>
                  <p className="text-sm text-muted-foreground">{tenant.nombre}</p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-2 text-sm">
                  {membresia.numero_socio && (
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Hash className="h-3.5 w-3.5 shrink-0" />
                      <span className="font-mono font-medium text-foreground">
                        N° {membresia.numero_socio}
                      </span>
                    </div>
                  )}
                  {persona.dni && (
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Shield className="h-3.5 w-3.5 shrink-0" />
                      <span>DNI {persona.dni}</span>
                    </div>
                  )}
                  {persona.email && (
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Mail className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{persona.email}</span>
                    </div>
                  )}
                  {persona.telefono && (
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Phone className="h-3.5 w-3.5 shrink-0" />
                      <span>{persona.telefono}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5 shrink-0" />
                    <span>Desde {formatFechaCorta(membresia.fecha_alta ?? persona.created_at)}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Building2 className="h-3.5 w-3.5 shrink-0" />
                    <span>Plan {PLAN_LABELS[tenant.plan] ?? tenant.plan}</span>
                  </div>
                </div>

                {membresia.padron_nombre && (
                  <p className="text-xs text-muted-foreground">
                    Padrón: {membresia.padron_nombre}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Saldo */}
        <Card className="lg:col-span-2">
          <CardContent className="p-5 flex flex-col justify-between h-full">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Saldo cuenta corriente
              </p>
              <p
                className={cn(
                  'text-3xl font-bold mt-1',
                  saldo > 0
                    ? 'text-green-600 dark:text-green-400'
                    : saldo < 0
                      ? 'text-red-600 dark:text-red-400'
                      : 'text-foreground'
                )}
              >
                {formatMonto(saldo)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {saldo > 0
                  ? 'Saldo a favor'
                  : saldo < 0
                    ? 'Saldo deudor'
                    : 'Sin saldo'}
              </p>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {alDia ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800 dark:bg-green-900/30 dark:text-green-400">
                    <CheckCircle2 className="h-4 w-4" />
                    Al día
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-3 py-1 text-sm font-medium text-red-800 dark:bg-red-900/30 dark:text-red-400">
                    <AlertTriangle className="h-4 w-4" />
                    {cuotasVencidas.length} vencida{cuotasVencidas.length > 1 ? 's' : ''}
                  </span>
                )}
              </div>
              {cuotasPendientes.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  {cuotasPendientes.length} pendiente{cuotasPendientes.length > 1 ? 's' : ''}
                </p>
              )}
            </div>

            {cuentaCorriente?.ultimo_movimiento_at && (
              <p className="text-xs text-muted-foreground mt-2">
                Último mov: {formatFecha(cuentaCorriente.ultimo_movimiento_at.split('T')[0])}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Medio de pago */}
      <Card>
        <CardContent className="p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                <Wallet className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium">Medio de pago</p>
                <p className="text-xs text-muted-foreground">
                  No hay medio de pago configurado
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                toast.info(
                  'Tu solicitud fue enviada. El club te contactará para configurar tu medio de pago.'
                )
              }
            >
              <CreditCard className="h-4 w-4 mr-1.5" />
              Solicitar cambio de medio de pago
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Convenios de pago vigentes */}
      {convenios.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Convenios de pago
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {convenios.map((convenio) => (
                <div
                  key={convenio.id}
                  className="border rounded-lg px-4 py-3 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">
                      Convenio desde {formatFecha(convenio.fecha_inicio)}
                    </p>
                    <Badge variant="outline" className="text-xs">
                      Vigente
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div>
                      <p className="text-muted-foreground">Deuda original</p>
                      <p className="font-medium text-foreground">{formatMonto(convenio.deuda_original)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Cuota</p>
                      <p className="font-medium text-foreground">{formatMonto(convenio.monto_cuota)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Progreso</p>
                      <p className="font-medium text-foreground">
                        {convenio.cuotas_pagadas}/{convenio.cantidad_cuotas} pagadas
                      </p>
                    </div>
                    {convenio.proximo_vencimiento && (
                      <div>
                        <p className="text-muted-foreground">Próximo vencimiento</p>
                        <p className="font-medium text-foreground">{formatFecha(convenio.proximo_vencimiento)}</p>
                      </div>
                    )}
                  </div>
                  {/* Progress bar */}
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${(convenio.cuotas_pagadas / convenio.cantidad_cuotas) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cuotas */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Cuotas
                {cuotas.length > 0 && (
                  <Badge variant="secondary" className="text-xs ml-1">
                    {cuotas.length}
                  </Badge>
                )}
              </CardTitle>
              <CardDescription className="mt-0.5">
                Historial completo de cuotas emitidas
              </CardDescription>
            </div>
            <ExportFormatSelector
              getData={() => cuotasExportData}
            />
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por periodo o monto..."
                value={cuotaSearch}
                onChange={(e) => setCuotaSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select
              value={cuotaFilter}
              onValueChange={(v) => setCuotaFilter(v ?? 'todos')}
            >
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="pendiente">Pendiente</SelectItem>
                <SelectItem value="vencida">Vencida</SelectItem>
                <SelectItem value="pagada">Pagada</SelectItem>
                <SelectItem value="parcial">Parcial</SelectItem>
                <SelectItem value="anulada">Anulada</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {filteredCuotas.length === 0 ? (
            <div className="py-8 text-center">
              <Clock className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                {cuotas.length === 0
                  ? 'No tenés cuotas emitidas. Todo en orden.'
                  : 'No se encontraron cuotas con esos filtros.'}
              </p>
            </div>
          ) : (
            <div className="rounded-md border overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Periodo</TableHead>
                    <TableHead>Monto</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="hidden sm:table-cell">Emisión</TableHead>
                    <TableHead>Vencimiento</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCuotas.map((cuota) => (
                    <TableRow key={cuota.id}>
                      <TableCell className="font-medium">{cuota.periodo}</TableCell>
                      <TableCell className="font-mono text-sm">
                        {formatMonto(cuota.monto_final, cuota.moneda)}
                      </TableCell>
                      <TableCell>
                        <span
                          className={cn(
                            'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium',
                            ESTADO_CUOTA_STYLES[cuota.estado] ?? 'bg-gray-100 text-gray-800'
                          )}
                        >
                          {ESTADO_CUOTA_LABELS[cuota.estado] ?? cuota.estado}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground hidden sm:table-cell">
                        {formatFecha(cuota.fecha_emision)}
                      </TableCell>
                      <TableCell className="text-xs">
                        {formatFecha(cuota.fecha_vencimiento)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Movimientos */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <ArrowRightLeft className="h-4 w-4" />
                Historial de movimientos
                {movimientos.length > 0 && (
                  <Badge variant="secondary" className="text-xs ml-1">
                    {movimientos.length}
                  </Badge>
                )}
              </CardTitle>
              <CardDescription className="mt-0.5">
                Últimos movimientos en tu cuenta
              </CardDescription>
            </div>
            <ExportFormatSelector
              getData={() => movimientosExportData}
            />
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por descripción o número..."
                value={movSearch}
                onChange={(e) => setMovSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select
              value={movFilter}
              onValueChange={(v) => setMovFilter(v ?? 'todos')}
            >
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="ingreso">Ingresos</SelectItem>
                <SelectItem value="egreso">Egresos</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {filteredMovimientos.length === 0 ? (
            <div className="py-8 text-center">
              <ArrowRightLeft className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                {movimientos.length === 0
                  ? 'No hay movimientos registrados en tu cuenta.'
                  : 'No se encontraron movimientos con esos filtros.'}
              </p>
            </div>
          ) : (
            <div className="rounded-md border overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">#</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead className="text-right">Monto</TableHead>
                    <TableHead>Fecha</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMovimientos.map((mov) => (
                    <TableRow key={mov.id}>
                      <TableCell className="text-xs font-mono text-muted-foreground">
                        {mov.numero ? `#${mov.numero}` : '-'}
                      </TableCell>
                      <TableCell>
                        <span
                          className={cn(
                            'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium',
                            mov.tipo === 'ingreso'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                              : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                          )}
                        >
                          {mov.tipo === 'ingreso' ? 'Ingreso' : 'Egreso'}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm truncate max-w-[200px]">
                        {mov.descripcion ?? '-'}
                      </TableCell>
                      <TableCell
                        className={cn(
                          'text-right font-mono text-sm font-medium',
                          mov.tipo === 'ingreso'
                            ? 'text-green-600 dark:text-green-400'
                            : 'text-red-600 dark:text-red-400'
                        )}
                      >
                        {mov.tipo === 'ingreso' ? '+' : '-'}
                        {formatMonto(Math.abs(mov.monto_neto), mov.moneda)}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {formatFecha(mov.fecha)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
