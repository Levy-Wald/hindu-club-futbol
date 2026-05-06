import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
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
  TrendingUp,
  TrendingDown,
  ArrowLeft,
  Plus,
  ArrowLeftRight,
} from 'lucide-react'

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
    case 'efectivo':
      return Banknote
    case 'banco':
      return Building2
    case 'digital':
      return Smartphone
    default:
      return Wallet
  }
}

function tipoLabel(tipo: string) {
  switch (tipo) {
    case 'efectivo':
      return 'Efectivo'
    case 'banco':
      return 'Banco'
    case 'digital':
      return 'Digital'
    default:
      return tipo
  }
}

function tipoBadgeClass(tipo: string): string {
  switch (tipo) {
    case 'ingreso':
      return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
    case 'egreso':
      return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
    case 'transferencia':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
    default:
      return ''
  }
}

function tipoMovLabel(tipo: string): string {
  switch (tipo) {
    case 'ingreso':
      return 'Ingreso'
    case 'egreso':
      return 'Egreso'
    case 'transferencia':
      return 'Transferencia'
    default:
      return tipo
  }
}

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function CajaDetailPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  // Fetch caja
  const { data: caja, error } = await supabase
    .from('cajas')
    .select(`
      id,
      nombre,
      tipo,
      saldo_actual,
      moneda,
      activa,
      responsable_id,
      cuenta_contable_id,
      created_at,
      responsable:personas!cajas_responsable_id_fkey(id, nombre, apellido),
      cuenta_contable:plan_cuentas!cajas_cuenta_contable_id_fkey(id, codigo, nombre)
    `)
    .eq('id', id)
    .eq('tenant_id', TENANT_ID)
    .maybeSingle()

  if (error || !caja) {
    notFound()
  }

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

  // Fetch last 50 movements
  const { data: movimientos } = await supabase
    .from('movimientos_caja')
    .select(`
      id,
      numero,
      fecha,
      tipo,
      descripcion,
      monto_bruto,
      monto_neto,
      monto_usd,
      anulado,
      anulado_at,
      motivo_anulacion,
      persona_id,
      persona:personas!movimientos_caja_persona_id_fkey(id, nombre, apellido),
      categoria:catalogo_categorias_movimiento!movimientos_caja_categoria_id_fkey(id, nombre)
    `)
    .eq('tenant_id', TENANT_ID)
    .eq('caja_id', id)
    .order('fecha', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(50)

  const Icon = tipoIcon(caja.tipo)
  const responsableRaw = caja.responsable as unknown
  const responsable = (Array.isArray(responsableRaw) ? responsableRaw[0] : responsableRaw) as { id: string; nombre: string; apellido: string } | null
  const cuentaContableRaw = caja.cuenta_contable as unknown
  const cuentaContable = (Array.isArray(cuentaContableRaw) ? cuentaContableRaw[0] : cuentaContableRaw) as { id: string; codigo: string; nombre: string } | null
  const moneda = caja.moneda ?? 'ARS'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" render={<Link href="/admin/finanzas/cajas" />}>
          <ArrowLeft className="h-4 w-4" />
          <span className="sr-only">Volver a cajas</span>
        </Button>
        <h1 className="text-xl sm:text-2xl font-bold">{caja.nombre}</h1>
        <Badge variant={caja.activa ? 'default' : 'secondary'}>
          {caja.activa ? 'Activa' : 'Inactiva'}
        </Badge>
      </div>

      {/* Info card */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-muted">
                <Icon className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{tipoLabel(caja.tipo)}</p>
                <p className="text-2xl font-bold">{formatMoney(caja.saldo_actual, moneda)}</p>
              </div>
            </div>
            {cuentaContable && (
              <div>
                <p className="text-xs text-muted-foreground">Cuenta contable</p>
                <p className="text-sm font-medium">{cuentaContable.codigo} - {cuentaContable.nombre}</p>
              </div>
            )}
            {responsable && (
              <div>
                <p className="text-xs text-muted-foreground">Responsable</p>
                <p className="text-sm font-medium">{responsable.apellido}, {responsable.nombre}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Stats del mes */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30">
              <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Ingresos del mes</p>
              <p className="text-lg font-bold text-green-600 dark:text-green-400">
                {formatMoney(ingresosMes, moneda)}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900/30">
              <TrendingDown className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Egresos del mes</p>
              <p className="text-lg font-bold text-red-600 dark:text-red-400">
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
              <p className={`text-lg font-bold ${ingresosMes - egresosMes >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
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
                        <TableCell className={`text-right font-medium ${esAnulado ? 'line-through' : mov.tipo === 'ingreso' ? 'text-green-600 dark:text-green-400' : mov.tipo === 'egreso' ? 'text-red-600 dark:text-red-400' : ''}`}>
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
