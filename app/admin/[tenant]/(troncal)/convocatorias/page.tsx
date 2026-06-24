import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { fetchPartidos } from './_lib/queries'

export default async function ConvocatoriasPage() {
  const partidos = await fetchPartidos()

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold">Planificador de partido</h1>
        <p className="text-sm text-muted-foreground">Armá la convocatoria de cada partido desde el plantel del equipo.</p>
      </div>

      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Partido</TableHead>
              <TableHead>Equipo</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead className="text-right">Convocados</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {partidos.length === 0 ? (
              <TableRow>
                <TableCell colSpan={99} className="text-center text-muted-foreground py-8">
                  No hay partidos con equipo asignado.
                </TableCell>
              </TableRow>
            ) : (
              partidos.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>
                    <Link href={`/admin/convocatorias/${p.id}`} className="font-medium hover:underline">
                      {p.titulo ?? 'Partido'}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{p.equipo_nombre ?? '—'}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {p.fecha_inicio ? new Date(p.fecha_inicio + 'T00:00:00').toLocaleDateString('es-AR') : '—'}
                    {p.hora_inicio ? ` · ${p.hora_inicio.slice(0, 5)}` : ''}
                  </TableCell>
                  <TableCell className="text-right">
                    {p.convocados_count > 0
                      ? <Badge variant="default">{p.convocados_count}</Badge>
                      : <span className="text-muted-foreground text-sm">sin armar</span>}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
