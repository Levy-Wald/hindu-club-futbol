import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { DollarSign, TrendingUp } from 'lucide-react'
import { NuevaCotizacionDialog } from './_components/nueva-cotizacion-dialog'
import { CotizacionActions } from './_components/cotizacion-actions'

const TENANT_ID = '11111111-1111-1111-1111-111111111111'

function formatMoney(v: number | null): string {
  if (v == null) return '-'
  return new Intl.NumberFormat('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v)
}

function formatFecha(iso: string): string {
  return new Date(iso + 'T12:00:00').toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })
}

interface PageProps {
  searchParams: Promise<{ moneda?: string; desde?: string; hasta?: string }>
}

export default async function CotizacionesPage({ searchParams }: PageProps) {
  const filters = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from('cotizaciones')
    .select('*')
    .eq('tenant_id', TENANT_ID)
    .order('fecha', { ascending: false })

  if (filters.moneda) query = query.eq('moneda', filters.moneda)
  if (filters.desde) query = query.gte('fecha', filters.desde)
  if (filters.hasta) query = query.lte('fecha', filters.hasta)

  const { data: cotizaciones, error } = await query
  const items = cotizaciones ?? []

  // TC actuales: ultima cotizacion por moneda
  const { data: allCotiz } = await supabase
    .from('cotizaciones')
    .select('moneda, valor_compra, valor_venta, fecha, fuente')
    .eq('tenant_id', TENANT_ID)
    .order('fecha', { ascending: false })

  const actuales = new Map<string, { moneda: string; valor_compra: number; valor_venta: number; fecha: string; fuente: string }>()
  for (const c of allCotiz ?? []) {
    if (!actuales.has(c.moneda)) actuales.set(c.moneda, c)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <DollarSign className="h-6 w-6 text-muted-foreground" />
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">Cotizaciones</h1>
            <p className="text-sm text-muted-foreground">Tipo de cambio historico</p>
          </div>
        </div>
        <NuevaCotizacionDialog />
      </div>

      {/* TC actuales */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            TC actuales
          </CardTitle>
        </CardHeader>
        <CardContent>
          {actuales.size === 0 ? (
            <p className="text-sm text-muted-foreground">
              No hay cotizaciones cargadas. Carga la primera para empezar.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {Array.from(actuales.values()).map(c => (
                <div key={c.moneda} className="border rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <Badge variant="outline">{c.moneda}</Badge>
                    <span className="text-xs text-muted-foreground">{formatFecha(c.fecha)}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Compra</span>
                      <p className="font-medium">${formatMoney(c.valor_compra)}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Venta</span>
                      <p className="font-medium">${formatMoney(c.valor_venta)}</p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Fuente: {c.fuente}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabla historica */}
      {error ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-destructive">Error: {error.message}</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{items.length} cotizacion(es)</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {items.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-sm text-muted-foreground">No se encontraron cotizaciones</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Moneda</TableHead>
                      <TableHead className="text-right">Compra</TableHead>
                      <TableHead className="text-right">Venta</TableHead>
                      <TableHead>Fuente</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map(c => (
                      <TableRow key={c.id}>
                        <TableCell>{formatFecha(c.fecha)}</TableCell>
                        <TableCell><Badge variant="outline">{c.moneda}</Badge></TableCell>
                        <TableCell className="text-right font-mono">${formatMoney(c.valor_compra)}</TableCell>
                        <TableCell className="text-right font-mono">${formatMoney(c.valor_venta)}</TableCell>
                        <TableCell>{c.fuente}</TableCell>
                        <TableCell className="text-right">
                          <CotizacionActions cotizacion={c} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
