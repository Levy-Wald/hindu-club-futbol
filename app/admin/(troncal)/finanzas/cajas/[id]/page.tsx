import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Banknote,
  Building2,
  Smartphone,
  Wallet,
  Bitcoin,
  CreditCard,
  TrendingUp,
  TrendingDown,
  ArrowLeft,
  Plus,
  ArrowLeftRight,
} from 'lucide-react'
import {
  fetchCaja,
  fetchMovimientosCaja,
  fetchEntidadesParaCajas,
  fetchCuentasImputables,
  fetchActividadesUsadasEnCajas,
} from '@/modules/finanzas/lib/queries'
import { TIPOS_CAJA, TIPOS_FISCAL } from '@/modules/finanzas/lib/tipos'
import { CajaFormDialog } from '@/modules/finanzas/ui/caja-form'
import { CajaDetailActions } from './_components/caja-detail-actions'
import { createClient } from '@/lib/supabase/server'

const TENANT_ID = '11111111-1111-1111-1111-111111111111'

function formatMoney(amount: number | null, currency = 'ARS') {
  if (amount == null) return '-'
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency }).format(amount)
}

function formatFecha(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })
}

function tipoIcon(tipo: string) {
  switch (tipo) {
    case 'efectivo': return Banknote
    case 'banco': return Building2
    case 'mercadopago': return Smartphone
    case 'cripto': return Bitcoin
    case 'tarjeta': return CreditCard
    case 'digital': return Smartphone
    default: return Wallet
  }
}

function tipoBadgeClass(tipo: string): string {
  switch (tipo) {
    case 'ingreso':
      return 'bg-success-100 text-success-800 dark:bg-success-900/30 dark:text-success-400'
    case 'egreso':
      return 'bg-error-100 text-error-800 dark:bg-error-900/30 dark:text-error-400'
    case 'transferencia':
      return 'bg-info-100 text-info-800 dark:bg-info-900/30 dark:text-info-400'
    default:
      return ''
  }
}

function tipoMovLabel(tipo: string): string {
  switch (tipo) {
    case 'ingreso': return 'Ingreso'
    case 'egreso': return 'Egreso'
    case 'transferencia': return 'Transferencia'
    default: return tipo
  }
}

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function CajaDetailPage({ params }: PageProps) {
  const { id } = await params

  const [caja, movimientos, entidades, cuentas, actividades] = await Promise.all([
    fetchCaja(id),
    fetchMovimientosCaja(id),
    fetchEntidadesParaCajas(),
    fetchCuentasImputables(),
    fetchActividadesUsadasEnCajas(),
  ])

  if (!caja) notFound()

  // Personas for edit form
  const supabase = await createClient()
  const { data: personas } = await supabase
    .from('personas')
    .select('id, nombre, apellido')
    .eq('tenant_id', TENANT_ID)
    .order('apellido')
    .limit(500)

  // Stats: ingresos y egresos del mes actual
  const now = new Date()
  const primerDiaMes = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const ultimoDiaMes = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString()

  const { data: ingresosData } = await supabase
    .from('movimientos_caja')
    .select('monto_neto')
    .eq('tenant_id', TENANT_ID)
    .eq('caja_id', id)
    .eq('tipo', 'ingreso')
    .eq('anulado', false)
    .gte('fecha', primerDiaMes)
    .lte('fecha', ultimoDiaMes)

  const { data: egresosData } = await supabase
    .from('movimientos_caja')
    .select('monto_neto')
    .eq('tenant_id', TENANT_ID)
    .eq('caja_id', id)
    .eq('tipo', 'egreso')
    .eq('anulado', false)
    .gte('fecha', primerDiaMes)
    .lte('fecha', ultimoDiaMes)

  const ingresosMes = (ingresosData ?? []).reduce((sum, m) => sum + (m.monto_neto ?? 0), 0)
  const egresosMes = (egresosData ?? []).reduce((sum, m) => sum + (m.monto_neto ?? 0), 0)

  const Icon = tipoIcon(caja.tipo)
  const moneda = caja.moneda ?? 'ARS'
  const isDeleted = !!caja.deleted_at

  const responsableRaw = caja.responsable as unknown
  const responsable = (Array.isArray(responsableRaw) ? responsableRaw[0] : responsableRaw) as { id: string; nombre: string; apellido: string } | null
  const cuentaRaw = caja.cuenta as unknown
  const cuenta = (Array.isArray(cuentaRaw) ? cuentaRaw[0] : cuentaRaw) as { id: string; codigo: string; nombre: string } | null
  const entidadRaw = caja.entidad as unknown
  const entidad = (Array.isArray(entidadRaw) ? entidadRaw[0] : entidadRaw) as { id: string; nombre: string } | null

  const tipoFiscalDef = TIPOS_FISCAL.find(t => t.value === caja.tipo_fiscal)
  const tipoLabel = TIPOS_CAJA.find(t => t.value === caja.tipo)?.label ?? caja.tipo

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2 flex-wrap">
        <Button variant="ghost" size="icon" render={<Link href="/admin/finanzas/cajas" />}>
          <ArrowLeft className="h-4 w-4" />
          <span className="sr-only">Volver a cajas</span>
        </Button>
        <h1 className="text-xl sm:text-2xl font-bold">{caja.nombre}</h1>
        <Badge variant={caja.activa ? 'default' : 'secondary'}>
          {isDeleted ? 'Eliminada' : caja.activa ? 'Activa' : 'Inactiva'}
        </Badge>
        {tipoFiscalDef && (
          <Badge variant="secondary" className={tipoFiscalDef.color}>
            {tipoFiscalDef.label}
          </Badge>
        )}
        <div className="ml-auto flex items-center gap-2">
          {!isDeleted && (
            <CajaFormDialog
              caja={caja}
              entidades={entidades}
              personas={personas ?? []}
              cuentas={cuentas}
              actividadesSugeridas={actividades}
              trigger={<Button variant="outline" size="sm">Editar</Button>}
            />
          )}
          <CajaDetailActions cajaId={caja.id} cajaName={caja.nombre} isDeleted={isDeleted} saldo={caja.saldo_actual} />
        </div>
      </div>

      {/* Info card */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-start gap-6">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-muted">
                <Icon className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{tipoLabel}</p>
                <p className="text-2xl font-bold">{formatMoney(caja.saldo_actual, moneda)}</p>
              </div>
            </div>
            {entidad && (
              <div>
                <p className="text-xs text-muted-foreground">Entidad</p>
                <p className="text-sm font-medium">{entidad.nombre}</p>
              </div>
            )}
            {caja.actividad_slug && (
              <div>
                <p className="text-xs text-muted-foreground">Actividad</p>
                <p className="text-sm font-medium">{caja.actividad_slug}</p>
              </div>
            )}
            {responsable && (
              <div>
                <p className="text-xs text-muted-foreground">Responsable</p>
                <p className="text-sm font-medium">{responsable.apellido}, {responsable.nombre}</p>
              </div>
            )}
            {cuenta && (
              <div>
                <p className="text-xs text-muted-foreground">Cuenta contable</p>
                <p className="text-sm font-medium">{cuenta.codigo} - {cuenta.nombre}</p>
              </div>
            )}
          </div>

          {/* Datos bancarios */}
          {(caja.banco_nombre || caja.cbu || caja.numero_cuenta) && (
            <div className="mt-4 pt-4 border-t flex flex-wrap gap-6">
              {caja.banco_nombre && (
                <div>
                  <p className="text-xs text-muted-foreground">Banco / Plataforma</p>
                  <p className="text-sm font-medium">{caja.banco_nombre}</p>
                </div>
              )}
              {caja.cbu && (
                <div>
                  <p className="text-xs text-muted-foreground">CBU/CVU</p>
                  <p className="text-sm font-mono">{caja.cbu}</p>
                </div>
              )}
              {caja.numero_cuenta && (
                <div>
                  <p className="text-xs text-muted-foreground">Nro. cuenta</p>
                  <p className="text-sm font-medium">{caja.numero_cuenta}</p>
                </div>
              )}
            </div>
          )}

          {caja.descripcion && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-xs text-muted-foreground">Descripcion</p>
              <p className="text-sm">{caja.descripcion}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats del mes */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-success-100 dark:bg-success-900/30">
              <TrendingUp className="h-5 w-5 text-success-600 dark:text-success-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Ingresos del mes</p>
              <p className="text-lg font-bold text-success-600 dark:text-success-400">
                {formatMoney(ingresosMes, moneda)}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-error-100 dark:bg-error-900/30">
              <TrendingDown className="h-5 w-5 text-error-600 dark:text-error-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Egresos del mes</p>
              <p className="text-lg font-bold text-error-600 dark:text-error-400">
                {formatMoney(egresosMes, moneda)}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
              <ArrowLeftRight className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Neto del mes</p>
              <p className={`text-lg font-bold ${ingresosMes - egresosMes >= 0 ? 'text-success-600 dark:text-success-400' : 'text-error-600 dark:text-error-400'}`}>
                {formatMoney(ingresosMes - egresosMes, moneda)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Boton nuevo movimiento */}
      <div className="flex justify-end">
        <Button render={<Link href={`/admin/finanzas/movimientos?caja=${id}`} />}>
          <Plus className="h-4 w-4 mr-1" />
          Nuevo movimiento
        </Button>
      </div>

      {/* Tabla de movimientos */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Ultimos movimientos</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {!movimientos || movimientos.length === 0 ? (
            <div className="py-12 text-center">
              <Wallet className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No hay movimientos en esta caja</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-20">Nro</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Descripcion</TableHead>
                    <TableHead>Persona/Entidad</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead className="text-right">Monto</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {movimientos.map((mov) => {
                    const personaRaw = mov.persona as unknown
                    const persona = (Array.isArray(personaRaw) ? personaRaw[0] : personaRaw) as { id: string; nombre: string; apellido: string } | null
                    const categoriaRaw = mov.categoria as unknown
                    const categoria = (Array.isArray(categoriaRaw) ? categoriaRaw[0] : categoriaRaw) as { id: string; nombre: string } | null
                    const esAnulado = mov.anulado === true

                    return (
                      <TableRow key={mov.id} className={esAnulado ? 'opacity-50' : ''}>
                        <TableCell className={esAnulado ? 'line-through' : ''}>
                          {mov.numero ?? '-'}
                        </TableCell>
                        <TableCell className={esAnulado ? 'line-through' : ''}>
                          {formatFecha(mov.fecha)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Badge variant="secondary" className={tipoBadgeClass(mov.tipo)}>
                              {tipoMovLabel(mov.tipo)}
                            </Badge>
                            {esAnulado && (
                              <Badge variant="destructive" className="text-[10px]">
                                ANULADO
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className={`max-w-[200px] truncate ${esAnulado ? 'line-through' : ''}`}>
                          {mov.descripcion || '-'}
                        </TableCell>
                        <TableCell className={esAnulado ? 'line-through' : ''}>
                          {persona ? `${persona.apellido}, ${persona.nombre}` : '-'}
                        </TableCell>
                        <TableCell className={esAnulado ? 'line-through' : ''}>
                          {categoria?.nombre ?? '-'}
                        </TableCell>
                        <TableCell className={`text-right font-medium ${esAnulado ? 'line-through' : mov.tipo === 'ingreso' ? 'text-success-600 dark:text-success-400' : mov.tipo === 'egreso' ? 'text-error-600 dark:text-error-400' : ''}`}>
                          {mov.tipo === 'egreso' ? '-' : ''}
                          {formatMoney(mov.monto_neto, moneda)}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
