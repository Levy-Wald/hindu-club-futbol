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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  User,
  CreditCard,
  CheckCircle2,
  AlertTriangle,
  Clock,
  FileText,
  Search,
  ArrowRightLeft,
  Wallet,
  Shield,
  LogOut,
  Mail,
  Phone,
  Calendar,
  Hash,
  Building2,
  MoreHorizontal,
  TrendingUp,
  TrendingDown,
  Minus,
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
  pendiente: 'bg-warning-100 text-warning-800 dark:bg-warning-900/30 dark:text-warning-400',
  vencida: 'bg-error-100 text-error-800 dark:bg-error-900/30 dark:text-error-400',
  pagada: 'bg-success-100 text-success-800 dark:bg-success-900/30 dark:text-success-400',
  parcial: 'bg-warning-100 text-warning-800 dark:bg-warning-900/30 dark:text-warning-400',
  anulada: 'bg-neutral-100 text-neutral-800 dark:bg-neutral-900/30 dark:text-neutral-400',
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
  const proximaVencida = cuotasPendientes
    .slice()
    .sort((a, b) => a.fecha_vencimiento.localeCompare(b.fecha_vencimiento))[0]
  const alDia = cuotasVencidas.length === 0

  const esSocio = atributos.includes('socio_padron')

  const ultimoMovimiento = movimientos[0] ?? null

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

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Mi cuenta</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Gestioná tu membresía, cuotas y medios de pago
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger>
            <Button variant="outline" size="icon" className="shrink-0">
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">Más acciones</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuItem
              onClick={() =>
                toast.info(
                  'Tu solicitud de cambio de plan fue enviada. Te contactaremos a la brevedad.'
                )
              }
            >
              <ArrowRightLeft className="h-4 w-4 mr-2" />
              Cambiar de plan
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() =>
                toast.info(
                  'Tu solicitud de baja fue enviada. Te contactaremos para confirmar.'
                )
              }
            >
              <LogOut className="h-4 w-4 mr-2" />
              Solicitar baja
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* ── Carnet de socio ── */}
      <Card className="overflow-hidden">
        {/* Accent top border */}
        <div className="h-1 w-full bg-gradient-to-r from-primary via-primary/70 to-primary/30" />
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-6">
            {/* Avatar + badge */}
            <div className="shrink-0 flex sm:flex-col items-center gap-3 sm:gap-3">
              {persona.foto_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={persona.foto_url}
                  alt={persona.nombre}
                  className="h-20 w-20 rounded-2xl object-cover ring-2 ring-primary/20"
                />
              ) : (
                <div className="h-20 w-20 rounded-2xl bg-primary/10 flex items-center justify-center ring-2 ring-primary/20">
                  <User className="h-10 w-10 text-primary/50" />
                </div>
              )}
              <Badge
                variant={esSocio ? 'default' : 'secondary'}
                className="text-xs whitespace-nowrap"
              >
                {esSocio ? 'Socio activo' : 'Usuario'}
              </Badge>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0 space-y-4">
              <div>
                <h2 className="text-xl font-bold tracking-tight">
                  {persona.apellido?.toUpperCase()}, {persona.nombre}
                </h2>
                <p className="text-sm text-muted-foreground">{tenant.nombre}</p>
                {membresia.padron_nombre && (
                  <p className="text-xs text-muted-foreground/70 mt-0.5">
                    Padrón: {membresia.padron_nombre}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-3">
                {membresia.numero_socio && (
                  <div className="flex items-start gap-2">
                    <Hash className="h-3.5 w-3.5 mt-0.5 shrink-0 text-muted-foreground" />
                    <div>
                      <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">
                        N° socio
                      </p>
                      <p className="text-sm font-mono font-semibold">
                        {membresia.numero_socio}
                      </p>
                    </div>
                  </div>
                )}
                {persona.dni && (
                  <div className="flex items-start gap-2">
                    <Shield className="h-3.5 w-3.5 mt-0.5 shrink-0 text-muted-foreground" />
                    <div>
                      <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">
                        DNI
                      </p>
                      <p className="text-sm font-medium">{persona.dni}</p>
                    </div>
                  </div>
                )}
                {persona.email && (
                  <div className="flex items-start gap-2">
                    <Mail className="h-3.5 w-3.5 mt-0.5 shrink-0 text-muted-foreground" />
                    <div>
                      <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">
                        Email
                      </p>
                      <p className="text-sm font-medium truncate">{persona.email}</p>
                    </div>
                  </div>
                )}
                {persona.telefono && (
                  <div className="flex items-start gap-2">
                    <Phone className="h-3.5 w-3.5 mt-0.5 shrink-0 text-muted-foreground" />
                    <div>
                      <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">
                        Teléfono
                      </p>
                      <p className="text-sm font-medium">{persona.telefono}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-start gap-2">
                  <Calendar className="h-3.5 w-3.5 mt-0.5 shrink-0 text-muted-foreground" />
                  <div>
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">
                      Desde
                    </p>
                    <p className="text-sm font-medium">
                      {formatFechaCorta(membresia.fecha_alta ?? persona.created_at)}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Building2 className="h-3.5 w-3.5 mt-0.5 shrink-0 text-muted-foreground" />
                  <div>
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">
                      Plan
                    </p>
                    <p className="text-sm font-medium">
                      {PLAN_LABELS[tenant.plan] ?? tenant.plan}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Financial summary row ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Saldo */}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Saldo cuenta corriente
                </p>
                <p
                  className={cn(
                    'text-2xl font-bold mt-1 tabular-nums',
                    saldo > 0
                      ? 'text-success-600 dark:text-success-400'
                      : saldo < 0
                        ? 'text-error-600 dark:text-error-400'
                        : 'text-foreground'
                  )}
                >
                  {formatMonto(saldo)}
                </p>
              </div>
              <div
                className={cn(
                  'h-9 w-9 rounded-lg flex items-center justify-center shrink-0',
                  saldo > 0
                    ? 'bg-success-100 dark:bg-success-900/30'
                    : saldo < 0
                      ? 'bg-error-100 dark:bg-error-900/30'
                      : 'bg-muted'
                )}
              >
                {saldo > 0 ? (
                  <TrendingUp className="h-4 w-4 text-success-600 dark:text-success-400" />
                ) : saldo < 0 ? (
                  <TrendingDown className="h-4 w-4 text-error-600 dark:text-error-400" />
                ) : (
                  <Minus className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
            </div>
            <div className="mt-3">
              {alDia ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-success-700 dark:text-success-400">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Al día
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-error-700 dark:text-error-400">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  {cuotasVencidas.length} cuota{cuotasVencidas.length > 1 ? 's' : ''} vencida{cuotasVencidas.length > 1 ? 's' : ''}
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Cuotas pendientes */}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Cuotas pendientes
                </p>
                <p className="text-2xl font-bold mt-1 tabular-nums">
                  {cuotasPendientes.length}
                </p>
              </div>
              <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
                <Clock className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
            <div className="mt-3">
              {proximaVencida ? (
                <p className="text-xs text-muted-foreground">
                  Próximo: {formatFecha(proximaVencida.fecha_vencimiento)}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">Sin vencimientos próximos</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Último movimiento */}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Último movimiento
                </p>
                <p className="text-2xl font-bold mt-1 tabular-nums">
                  {ultimoMovimiento
                    ? formatFechaCorta(ultimoMovimiento.fecha)
                    : '—'}
                </p>
              </div>
              <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
                <ArrowRightLeft className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
            <div className="mt-3">
              {ultimoMovimiento ? (
                <p className="text-xs text-muted-foreground">
                  {ultimoMovimiento.tipo === 'ingreso' ? 'Ingreso' : 'Egreso'}{' '}
                  {ultimoMovimiento.descripcion
                    ? `· ${ultimoMovimiento.descripcion.slice(0, 28)}${ultimoMovimiento.descripcion.length > 28 ? '…' : ''}`
                    : ''}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">Sin movimientos registrados</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Quick actions ── */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            toast.info('Tus comprobantes están disponibles. Próximamente podrás descargarlos desde acá.')
          }
        >
          <FileText className="h-4 w-4 mr-1.5" />
          Mis comprobantes
        </Button>
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
          Medio de pago
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            toast.info(
              'Tu solicitud de cambio de plan fue enviada. Te contactaremos a la brevedad.'
            )
          }
        >
          <ArrowRightLeft className="h-4 w-4 mr-1.5" />
          Cambiar plan
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="text-destructive hover:text-destructive border-destructive/30 hover:border-destructive/60 hover:bg-destructive/5"
          onClick={() =>
            toast.info(
              'Tu solicitud de baja fue enviada. Te contactaremos para confirmar.'
            )
          }
        >
          <LogOut className="h-4 w-4 mr-1.5" />
          Solicitar baja
        </Button>
      </div>

      {/* ── Convenios de pago ── */}
      {convenios.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Wallet className="h-4 w-4 text-muted-foreground" />
              Convenios de pago vigentes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {convenios.map((convenio) => (
              <div
                key={convenio.id}
                className="rounded-xl border bg-muted/30 px-4 py-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">
                    Convenio desde {formatFecha(convenio.fecha_inicio)}
                  </p>
                  <Badge variant="outline" className="text-xs">
                    Vigente
                  </Badge>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                  <div>
                    <p className="text-muted-foreground mb-0.5">Deuda original</p>
                    <p className="font-semibold text-foreground">
                      {formatMonto(convenio.deuda_original)}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-0.5">Cuota</p>
                    <p className="font-semibold text-foreground">
                      {formatMonto(convenio.monto_cuota)}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-0.5">Progreso</p>
                    <p className="font-semibold text-foreground">
                      {convenio.cuotas_pagadas} / {convenio.cantidad_cuotas} pagadas
                    </p>
                  </div>
                  {convenio.proximo_vencimiento && (
                    <div>
                      <p className="text-muted-foreground mb-0.5">Próximo vencimiento</p>
                      <p className="font-semibold text-foreground">
                        {formatFecha(convenio.proximo_vencimiento)}
                      </p>
                    </div>
                  )}
                </div>
                {/* Progress bar */}
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{
                      width: `${Math.round((convenio.cuotas_pagadas / convenio.cantidad_cuotas) * 100)}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* ── Cuotas + Movimientos tabs ── */}
      <Tabs defaultValue="cuotas">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="cuotas" className="flex-1 sm:flex-none gap-2">
            <Clock className="h-3.5 w-3.5" />
            Cuotas
            {cuotas.length > 0 && (
              <Badge variant="secondary" className="text-xs ml-0.5 px-1.5 h-4">
                {cuotas.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="movimientos" className="flex-1 sm:flex-none gap-2">
            <ArrowRightLeft className="h-3.5 w-3.5" />
            Movimientos
            {movimientos.length > 0 && (
              <Badge variant="secondary" className="text-xs ml-0.5 px-1.5 h-4">
                {movimientos.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Cuotas tab */}
        <TabsContent value="cuotas" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-base">Historial de cuotas</CardTitle>
                  <CardDescription className="mt-0.5">
                    Cuotas emitidas en tu cuenta
                  </CardDescription>
                </div>
                <ExportFormatSelector getData={() => cuotasExportData} />
              </div>
            </CardHeader>
            <CardContent>
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
                <div className="py-12 text-center">
                  <div className="mx-auto h-12 w-12 rounded-xl bg-muted flex items-center justify-center mb-3">
                    <Clock className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium text-foreground">
                    {cuotas.length === 0 ? 'Sin cuotas emitidas' : 'Sin resultados'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {cuotas.length === 0
                      ? 'No tenés cuotas emitidas. Todo en orden.'
                      : 'Probá con otros filtros de búsqueda.'}
                  </p>
                </div>
              ) : (
                <div className="rounded-lg border overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/40">
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
                          <TableCell className="font-mono text-sm tabular-nums">
                            {formatMonto(cuota.monto_final, cuota.moneda)}
                          </TableCell>
                          <TableCell>
                            <span
                              className={cn(
                                'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold',
                                ESTADO_CUOTA_STYLES[cuota.estado] ?? 'bg-neutral-100 text-neutral-800'
                              )}
                            >
                              {ESTADO_CUOTA_LABELS[cuota.estado] ?? cuota.estado}
                            </span>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground hidden sm:table-cell">
                            {formatFecha(cuota.fecha_emision)}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
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
        </TabsContent>

        {/* Movimientos tab */}
        <TabsContent value="movimientos" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-base">Historial de movimientos</CardTitle>
                  <CardDescription className="mt-0.5">
                    Últimos movimientos en tu cuenta
                  </CardDescription>
                </div>
                <ExportFormatSelector getData={() => movimientosExportData} />
              </div>
            </CardHeader>
            <CardContent>
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
                <div className="py-12 text-center">
                  <div className="mx-auto h-12 w-12 rounded-xl bg-muted flex items-center justify-center mb-3">
                    <ArrowRightLeft className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium text-foreground">
                    {movimientos.length === 0 ? 'Sin movimientos' : 'Sin resultados'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {movimientos.length === 0
                      ? 'No hay movimientos registrados en tu cuenta.'
                      : 'Probá con otros filtros de búsqueda.'}
                  </p>
                </div>
              ) : (
                <div className="rounded-lg border overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/40">
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
                            {mov.numero ? `#${mov.numero}` : '—'}
                          </TableCell>
                          <TableCell>
                            <span
                              className={cn(
                                'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold',
                                mov.tipo === 'ingreso'
                                  ? 'bg-success-100 text-success-800 dark:bg-success-900/30 dark:text-success-400'
                                  : 'bg-error-100 text-error-800 dark:bg-error-900/30 dark:text-error-400'
                              )}
                            >
                              {mov.tipo === 'ingreso' ? 'Ingreso' : 'Egreso'}
                            </span>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground truncate max-w-[180px]">
                            {mov.descripcion ?? '—'}
                          </TableCell>
                          <TableCell
                            className={cn(
                              'text-right font-mono text-sm font-semibold tabular-nums',
                              mov.tipo === 'ingreso'
                                ? 'text-success-600 dark:text-success-400'
                                : 'text-error-600 dark:text-error-400'
                            )}
                          >
                            {mov.tipo === 'ingreso' ? '+' : '−'}
                            {formatMonto(Math.abs(mov.monto_neto), mov.moneda)}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
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
        </TabsContent>
      </Tabs>
    </div>
  )
}
