import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui/card'
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
  MoreHorizontal,
  ArrowRight,
  Trash2,
  RotateCcw,
} from 'lucide-react'
import {
  fetchCajas,
  fetchEntidadesParaCajas,
  fetchActividadesUsadasEnCajas,
  fetchCuentasImputables,
} from '@/modules/finanzas/lib/queries'
import { CajaFormDialog } from '@/modules/finanzas/ui/caja-form'
import { TIPOS_CAJA, TIPOS_FISCAL } from '@/modules/finanzas/lib/tipos'
import { CajasFilters } from './_components/cajas-filters'
import { CajaActions } from './_components/caja-actions'
import { TENANT_ID } from '@/lib/tenant'


function formatMoney(amount: number | null, currency = 'ARS') {
  if (amount == null) return '-'
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency }).format(amount)
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

interface PageProps {
  searchParams: Promise<{
    tipo?: string
    tipo_fiscal?: string
    entidad_id?: string
    actividad_slug?: string
    estado?: string
    busqueda?: string
  }>
}

export default async function CajasPage({ searchParams }: PageProps) {
  const sp = await searchParams

  const [cajas, entidades, actividades, cuentas] = await Promise.all([
    fetchCajas({
      tipo: sp.tipo,
      tipo_fiscal: sp.tipo_fiscal,
      entidad_id: sp.entidad_id,
      actividad_slug: sp.actividad_slug,
      estado: sp.estado || 'no_eliminada',
      busqueda: sp.busqueda,
    }),
    fetchEntidadesParaCajas(),
    fetchActividadesUsadasEnCajas(),
    fetchCuentasImputables(),
  ])

  // Fetch personas for form
  const supabase = await createClient()
  const { data: personas } = await supabase
    .from('personas')
    .select('id, nombre, apellido')
    .eq('tenant_id', TENANT_ID)
    .order('apellido')
    .limit(500)

  // Totals
  const activas = cajas.filter((c: { activa: boolean; deleted_at: string | null }) => c.activa && !c.deleted_at)
  const totalArs = activas
    .filter((c: { moneda: string }) => c.moneda === 'ARS')
    .reduce((sum: number, c: { saldo_actual: number | null }) => sum + (c.saldo_actual ?? 0), 0)
  const totalUsd = activas
    .filter((c: { moneda: string }) => c.moneda === 'USD')
    .reduce((sum: number, c: { saldo_actual: number | null }) => sum + (c.saldo_actual ?? 0), 0)

  const tipoFiscalBadge = (tf: string) => {
    const def = TIPOS_FISCAL.find(t => t.value === tf)
    if (!def) return <Badge variant="secondary">{tf}</Badge>
    return <Badge variant="secondary" className={def.color}>{def.label}</Badge>
  }

  const tipoLabel = (tipo: string) => {
    const def = TIPOS_CAJA.find(t => t.value === tipo)
    return def?.label ?? tipo
  }

  const hasFilters = !!(sp.tipo || sp.tipo_fiscal || sp.entidad_id || sp.actividad_slug || (sp.estado && sp.estado !== 'no_eliminada') || sp.busqueda)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl sm:text-2xl font-bold">Cajas</h1>
        <CajaFormDialog
          entidades={entidades}
          personas={personas ?? []}
          cuentas={cuentas}
          actividadesSugeridas={actividades}
        />
      </div>

      {/* Totales */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total ARS (activas)</p>
            <p className="text-2xl font-bold">{formatMoney(totalArs, 'ARS')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total USD (activas)</p>
            <p className="text-2xl font-bold">{formatMoney(totalUsd, 'USD')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Cajas activas</p>
            <p className="text-2xl font-bold">{activas.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <CajasFilters
        entidades={entidades}
        actividades={actividades}
        currentFilters={sp}
      />

      {/* Tabla */}
      {cajas.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Wallet className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">
              {hasFilters ? 'No hay cajas que coincidan con los filtros' : 'No hay cajas registradas'}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {hasFilters ? 'Proba ajustando los filtros.' : 'Crea una caja para comenzar a registrar movimientos.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Tipo fiscal</TableHead>
                    <TableHead>Entidad</TableHead>
                    <TableHead>Actividad</TableHead>
                    <TableHead>Moneda</TableHead>
                    <TableHead className="text-right">Saldo</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cajas.map((caja) => {
                    const Icon = tipoIcon(caja.tipo)
                    const entidadRaw = caja.entidad as unknown
                    const entidad = (Array.isArray(entidadRaw) ? entidadRaw[0] : entidadRaw) as { id: string; nombre: string } | null
                    const isDeleted = !!caja.deleted_at

                    return (
                      <TableRow
                        key={caja.id}
                        className={isDeleted ? 'opacity-50' : !caja.activa ? 'opacity-70' : ''}
                      >
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted shrink-0">
                              <Icon className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <div>
                              <Link
                                href={`/admin/finanzas/cajas/${caja.id}`}
                                className="font-medium hover:underline"
                              >
                                {caja.nombre}
                              </Link>
                              {!caja.activa && !isDeleted && (
                                <Badge variant="secondary" className="ml-2 text-[10px]">Inactiva</Badge>
                              )}
                              {isDeleted && (
                                <Badge variant="destructive" className="ml-2 text-[10px]">Eliminada</Badge>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{tipoLabel(caja.tipo)}</Badge>
                        </TableCell>
                        <TableCell>{tipoFiscalBadge(caja.tipo_fiscal)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {entidad?.nombre ?? '-'}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {caja.actividad_slug ?? '-'}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{caja.moneda}</Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium tabular-nums">
                          {formatMoney(caja.saldo_actual, caja.moneda ?? 'ARS')}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <CajaActions
                              caja={caja}
                              entidades={entidades}
                              personas={personas ?? []}
                              cuentas={cuentas}
                              actividadesSugeridas={actividades}
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              render={<Link href={`/admin/finanzas/cajas/${caja.id}`} />}
                            >
                              <ArrowRight className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
