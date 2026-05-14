import Link from 'next/link'
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
import { AlertTriangle, CheckCircle2, XCircle, Pencil } from 'lucide-react'

const TENANT_ID = '11111111-1111-1111-1111-111111111111'

export default async function ProductosSinCuentasPage() {
  const supabase = await createClient()

  const { data: productos, error } = await supabase
    .from('productos')
    .select('id, nombre, sku, tipo_uso, cuenta_ingreso_id, cuenta_egreso_id')
    .eq('tenant_id', TENANT_ID)
    .eq('activo', true)
    .is('deleted_at', null)
    .or(
      'and(tipo_uso.in.(reventa,servicio),cuenta_ingreso_id.is.null),' +
      'and(tipo_uso.in.(reventa,uso_interno_consumible,uso_interno_bien_uso,servicio),cuenta_egreso_id.is.null)'
    )
    .order('nombre')

  const items = productos ?? []

  const tipoUsoLabel: Record<string, string> = {
    reventa: 'Reventa',
    servicio: 'Servicio',
    uso_interno_consumible: 'Uso interno (consumible)',
    uso_interno_bien_uso: 'Uso interno (bien de uso)',
  }

  // Check which accounts are needed per tipo_uso
  const needsIngreso = (tipo: string | null) => tipo === 'reventa' || tipo === 'servicio'
  const needsEgreso = (_tipo: string | null) => true // all tipo_uso need egreso

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Productos sin cuentas contables</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Productos activos que deberian tener cuentas contables segun su tipo de uso pero no las tienen asignadas.
          </p>
        </div>
      </div>

      {error ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-destructive">Error al cargar: {error.message}</p>
          </CardContent>
        </Card>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <CheckCircle2 className="h-12 w-12 text-success-600 mb-4" />
            <p className="text-lg font-medium">Todos los productos tienen sus cuentas configuradas</p>
            <p className="text-sm text-muted-foreground mt-1">
              No hay productos activos con cuentas contables faltantes.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning-600" />
              {items.length} producto{items.length !== 1 ? 's' : ''} con cuentas faltantes
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>SKU</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Tipo uso</TableHead>
                    <TableHead className="text-center">Cuenta ingreso</TableHead>
                    <TableHead className="text-center">Cuenta egreso</TableHead>
                    <TableHead className="text-right">Accion</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-mono text-sm">
                        {p.sku ?? '-'}
                      </TableCell>
                      <TableCell className="font-medium">{p.nombre}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {tipoUsoLabel[p.tipo_uso ?? ''] ?? p.tipo_uso ?? 'Sin tipo'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        {needsIngreso(p.tipo_uso) ? (
                          p.cuenta_ingreso_id ? (
                            <CheckCircle2 className="h-4 w-4 text-success-600 mx-auto" />
                          ) : (
                            <XCircle className="h-4 w-4 text-error-600 mx-auto" />
                          )
                        ) : (
                          <span className="text-muted-foreground text-xs">N/A</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {needsEgreso(p.tipo_uso) ? (
                          p.cuenta_egreso_id ? (
                            <CheckCircle2 className="h-4 w-4 text-success-600 mx-auto" />
                          ) : (
                            <XCircle className="h-4 w-4 text-error-600 mx-auto" />
                          )
                        ) : (
                          <span className="text-muted-foreground text-xs">N/A</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          render={<Link href={`/admin/productos/${p.id}`} />}
                        >
                          <Pencil className="h-3.5 w-3.5 mr-1" />
                          Editar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
