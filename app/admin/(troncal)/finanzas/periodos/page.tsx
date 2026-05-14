import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { CalendarDays } from 'lucide-react'
import { PeriodoActions } from './_components/periodo-actions'
import { NuevoPeriodoDialog } from './_components/nuevo-periodo-dialog'

const TENANT_ID = '11111111-1111-1111-1111-111111111111'

function mesLabel(mes: number): string {
  const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
  return meses[mes - 1] ?? String(mes)
}

export default async function PeriodosContablesPage() {
  const supabase = await createClient()

  const { data: periodos, error } = await supabase
    .from('periodos_contables')
    .select('*, cerrado_por:personas!cerrado_por_id(id, nombre, apellido)')
    .eq('tenant_id', TENANT_ID)
    .order('anio', { ascending: false })
    .order('mes', { ascending: false })

  const items = periodos ?? []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <CalendarDays className="h-6 w-6 text-muted-foreground" />
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">Periodos Contables</h1>
            <p className="text-sm text-muted-foreground">
              {items.filter(p => p.estado === 'abierto').length} periodo(s) abierto(s)
            </p>
          </div>
        </div>
        <NuevoPeriodoDialog />
      </div>

      {error ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-destructive">Error: {error.message}</p>
          </CardContent>
        </Card>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <CalendarDays className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No hay periodos contables. Crea el primero.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{items.length} periodo(s)</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ano</TableHead>
                    <TableHead>Mes</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Cerrado por</TableHead>
                    <TableHead>Cerrado el</TableHead>
                    <TableHead>Notas</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((p) => {
                    const cerradoPorRaw = p.cerrado_por as unknown
                    const cerradoPor = (Array.isArray(cerradoPorRaw) ? cerradoPorRaw[0] : cerradoPorRaw) as { nombre: string; apellido: string } | null

                    return (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium">{p.anio}</TableCell>
                        <TableCell>{mesLabel(p.mes)}</TableCell>
                        <TableCell>
                          <Badge variant={p.estado === 'abierto' ? 'default' : 'secondary'}>
                            {p.estado === 'abierto' ? 'Abierto' : 'Cerrado'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {cerradoPor ? `${cerradoPor.apellido}, ${cerradoPor.nombre}` : '-'}
                        </TableCell>
                        <TableCell>
                          {p.cerrado_at
                            ? new Date(p.cerrado_at).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })
                            : '-'}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {p.notas || '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          <PeriodoActions periodo={p} />
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
