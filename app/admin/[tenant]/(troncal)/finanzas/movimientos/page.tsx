import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ArrowLeftRight, FileText } from 'lucide-react'
import { MovimientosFilters } from './_components/movimientos-filters'
import { NuevoMovimientoDialog } from './_components/nuevo-movimiento-dialog'
import { TENANT_ID } from '@/lib/tenant'


function formatMoney(amount: number | null, currency = 'ARS') {
  if (amount == null) return '-'
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency }).format(amount)
}

function formatFecha(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })
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
  searchParams: Promise<{
    tipo?: string
    desde?: string
    hasta?: string
    caja?: string
    categoria?: string
  }>
}

export default async function MovimientosPage({ searchParams }: PageProps) {
  const filters = await searchParams
  const supabase = await createClient()

  // Build query
  let query = supabase
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
      comprobante_tipo,
      comprobante_numero,
      comprobante_url,
      persona_id,
      caja_id,
      persona:personas!movimientos_caja_persona_id_fkey(id, nombre, apellido),
      caja:cajas!movimientos_caja_caja_id_fkey(id, nombre),
      categoria:catalogo_categorias_movimiento!movimientos_caja_categoria_id_fkey(id, nombre)
    `)
    .eq('tenant_id', TENANT_ID)
    .order('fecha', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(100)

  if (filters.tipo) {
    query = query.eq('tipo', filters.tipo)
  }
  if (filters.desde) {
    query = query.gte('fecha', filters.desde)
  }
  if (filters.hasta) {
    query = query.lte('fecha', filters.hasta)
  }
  if (filters.caja) {
    query = query.eq('caja_id', filters.caja)
  }
  if (filters.categoria) {
    query = query.eq('categoria_id', filters.categoria)
  }

  const { data: movimientos, error } = await query

  // Fetch cajas, categorias, productos and cuentas for filters and form
  const [cajasRes, categoriasRes, mediosPagoRes, centrosCostoRes, productosRes, cuentasRes] = await Promise.all([
    supabase
      .from('cajas')
      .select('id, nombre, tipo, activa')
      .eq('tenant_id', TENANT_ID)
      .eq('activa', true)
      .is('deleted_at', null)
      .order('nombre'),
    supabase
      .from('catalogo_categorias_movimiento')
      .select('id, nombre, tipo')
      .eq('tenant_id', TENANT_ID)
      .eq('activo', true)
      .order('nombre'),
    supabase
      .from('medios_pago')
      .select('id, nombre')
      .eq('tenant_id', TENANT_ID)
      .eq('activo', true)
      .order('nombre'),
    supabase
      .from('centros_costo')
      .select('id, nombre')
      .eq('tenant_id', TENANT_ID)
      .eq('activo', true)
      .order('nombre'),
    supabase
      .from('productos')
      .select('id, nombre, sku, tipo_uso')
      .eq('tenant_id', TENANT_ID)
      .eq('activo', true)
      .is('deleted_at', null)
      .order('nombre'),
    supabase
      .from('plan_cuentas')
      .select('id, codigo, nombre')
      .eq('tenant_id', TENANT_ID)
      .eq('es_imputable', true)
      .eq('activa', true)
      .order('codigo'),
  ])

  const cajas = cajasRes.data ?? []
  const categorias = categoriasRes.data ?? []
  const mediosPago = mediosPagoRes.data ?? []
  const centrosCosto = centrosCostoRes.data ?? []
  const productos = productosRes.data ?? []
  const cuentas = cuentasRes.data ?? []

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-xl sm:text-2xl font-bold">Movimientos</h1>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-destructive">Error al cargar movimientos: {error.message}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl sm:text-2xl font-bold">Movimientos</h1>
        <NuevoMovimientoDialog
          cajas={cajas}
          categorias={categorias}
          mediosPago={mediosPago}
          centrosCosto={centrosCosto}
          productos={productos}
          cuentas={cuentas}
          cajaPreseleccionada={filters.caja}
        />
      </div>

      {/* Filtros */}
      <MovimientosFilters
        cajas={cajas}
        categorias={categorias}
        filtrosActuales={filters}
      />

      {/* Tabla */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {movimientos?.length ?? 0} movimiento{(movimientos?.length ?? 0) !== 1 ? 's' : ''}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {!movimientos || movimientos.length === 0 ? (
            <div className="py-12 text-center">
              <ArrowLeftRight className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No se encontraron movimientos</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">Nro</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Descripcion</TableHead>
                    <TableHead>Persona/Entidad</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead className="text-right">Monto</TableHead>
                    <TableHead className="text-right">USD equiv.</TableHead>
                    <TableHead>Caja</TableHead>
                    <TableHead className="w-10">Comp.</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {movimientos.map((mov) => {
                    const personaRaw = mov.persona as unknown
                    const persona = (Array.isArray(personaRaw) ? personaRaw[0] : personaRaw) as { id: string; nombre: string; apellido: string } | null
                    const cajaRaw = mov.caja as unknown
                    const caja = (Array.isArray(cajaRaw) ? cajaRaw[0] : cajaRaw) as { id: string; nombre: string } | null
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
                          <div className="flex items-center gap-1 flex-wrap">
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
                        <TableCell
                          className={`text-right font-medium whitespace-nowrap ${
                            esAnulado
                              ? 'line-through'
                              : mov.tipo === 'ingreso'
                                ? 'text-success-600 dark:text-success-400'
                                : mov.tipo === 'egreso'
                                  ? 'text-error-600 dark:text-error-400'
                                  : ''
                          }`}
                        >
                          {mov.tipo === 'egreso' ? '-' : ''}
                          {formatMoney(mov.monto_neto)}
                        </TableCell>
                        <TableCell className={`text-right whitespace-nowrap ${esAnulado ? 'line-through' : ''}`}>
                          {mov.monto_usd != null ? formatMoney(mov.monto_usd, 'USD') : '-'}
                        </TableCell>
                        <TableCell className={esAnulado ? 'line-through' : ''}>
                          {caja?.nombre ?? '-'}
                        </TableCell>
                        <TableCell>
                          {mov.comprobante_url ? (
                            <a
                              href={mov.comprobante_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center text-primary hover:underline"
                            >
                              <FileText className="h-4 w-4" />
                            </a>
                          ) : (
                            <span className="text-muted-foreground text-xs">-</span>
                          )}
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
