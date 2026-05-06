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
import { Receipt } from 'lucide-react'
import Link from 'next/link'
import { fetchLiquidaciones, fetchCajasParaLiquidacion } from '../_lib/queries'
import { LiquidacionesFilters } from './_components/liquidaciones-filters'
import { NuevaLiquidacionDialog } from './_components/nueva-liquidacion-dialog'
import { LiquidacionActions } from './_components/liquidacion-actions'

const TENANT_ID = '11111111-1111-1111-1111-111111111111'

function formatMoney(amount: number | null, currency = 'ARS') {
  if (amount == null) return '-'
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency }).format(amount)
}

function formatFecha(iso: string | null): string {
  if (!iso) return '-'
  const d = new Date(iso)
  return d.toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })
}

function estadoBadgeClass(estado: string): string {
  switch (estado) {
    case 'borrador':
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
    case 'aprobada':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
    case 'pagada':
      return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
    case 'anulada':
      return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
    default:
      return ''
  }
}

function estadoLabel(estado: string): string {
  switch (estado) {
    case 'borrador':
      return 'Borrador'
    case 'aprobada':
      return 'Aprobada'
    case 'pagada':
      return 'Pagada'
    case 'anulada':
      return 'Anulada'
    default:
      return estado
  }
}

interface PageProps {
  searchParams: Promise<{
    periodo?: string
    estado?: string
    q?: string
  }>
}

export default async function LiquidacionesPage({ searchParams }: PageProps) {
  const filters = await searchParams
  const supabase = await createClient()

  // Fetch liquidaciones con filtros
  const liquidacionesRaw = await fetchLiquidaciones({
    periodo: filters.periodo,
    estado: filters.estado,
  })

  // Filtro por nombre de persona (post-query)
  let liquidaciones = liquidacionesRaw
  if (filters.q) {
    const searchLower = filters.q.toLowerCase()
    liquidaciones = liquidaciones.filter((liq) => {
      const personaRaw = liq.persona as unknown
      const persona = (Array.isArray(personaRaw) ? personaRaw[0] : personaRaw) as {
        id: string
        nombre: string
        apellido: string
      } | null
      if (!persona) return false
      return (
        persona.nombre?.toLowerCase().includes(searchLower) ||
        persona.apellido?.toLowerCase().includes(searchLower)
      )
    })
  }

  // Fetch contratos vigentes para el dialog de nueva liquidacion
  const { data: contratosVigentes } = await supabase
    .from('rrhh_contratos')
    .select(`
      id, modalidad, monto, moneda,
      persona:personas(id, nombre, apellido)
    `)
    .eq('tenant_id', TENANT_ID)
    .eq('estado', 'vigente')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  // Fetch cajas para pagar
  const cajas = await fetchCajasParaLiquidacion()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl sm:text-2xl font-bold">Liquidaciones</h1>
        <NuevaLiquidacionDialog contratos={contratosVigentes ?? []} />
      </div>

      {/* Filtros */}
      <LiquidacionesFilters filtrosActuales={filters} />

      {/* Tabla */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {liquidaciones.length} liquidaci{liquidaciones.length !== 1 ? 'ones' : 'on'}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {liquidaciones.length === 0 ? (
            <div className="py-12 text-center">
              <Receipt className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No se encontraron liquidaciones</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Periodo</TableHead>
                    <TableHead>Persona</TableHead>
                    <TableHead className="text-right">Bruto</TableHead>
                    <TableHead className="text-right">Deducciones</TableHead>
                    <TableHead className="text-right">Neto</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Fecha liquidacion</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {liquidaciones.map((liq) => {
                    const personaRaw = liq.persona as unknown
                    const persona = (Array.isArray(personaRaw) ? personaRaw[0] : personaRaw) as {
                      id: string
                      nombre: string
                      apellido: string
                    } | null

                    const esAnulada = liq.estado === 'anulada'

                    return (
                      <TableRow key={liq.id} className={esAnulada ? 'opacity-50' : ''}>
                        <TableCell className={esAnulada ? 'line-through' : ''}>
                          {liq.periodo}
                        </TableCell>
                        <TableCell className={esAnulada ? 'line-through' : ''}>
                          {persona ? (
                            <Link
                              href={`/admin/personas/${persona.id}`}
                              className="text-primary hover:underline"
                            >
                              {persona.apellido}, {persona.nombre}
                            </Link>
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell className={`text-right whitespace-nowrap ${esAnulada ? 'line-through' : ''}`}>
                          {formatMoney(liq.monto_bruto)}
                        </TableCell>
                        <TableCell className={`text-right whitespace-nowrap ${esAnulada ? 'line-through' : ''}`}>
                          {formatMoney(liq.deducciones)}
                        </TableCell>
                        <TableCell className={`text-right font-medium whitespace-nowrap ${esAnulada ? 'line-through' : ''}`}>
                          {formatMoney(liq.monto_neto)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={estadoBadgeClass(liq.estado)}>
                            {estadoLabel(liq.estado)}
                          </Badge>
                        </TableCell>
                        <TableCell className={esAnulada ? 'line-through' : ''}>
                          {formatFecha(liq.created_at)}
                        </TableCell>
                        <TableCell>
                          <LiquidacionActions
                            liquidacion={{
                              id: liq.id,
                              estado: liq.estado,
                              movimiento_caja_id: liq.movimiento_caja_id,
                            }}
                            cajas={cajas}
                          />
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
