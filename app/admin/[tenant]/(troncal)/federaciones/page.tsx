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
import { fetchFederaciones } from './_lib/queries'

export default async function FederacionesPage() {
  const federaciones = await fetchFederaciones()

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold">Federaciones</h1>
        <p className="text-sm text-muted-foreground">
          Federaciones y asociaciones, con los equipos del club afiliados a cada una.
        </p>
      </div>

      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Federación</TableHead>
              <TableHead>CUIT</TableHead>
              <TableHead className="text-right">Equipos</TableHead>
              <TableHead>Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {federaciones.length === 0 ? (
              <TableRow>
                <TableCell colSpan={99} className="text-center text-muted-foreground py-8">
                  No hay federaciones cargadas.
                </TableCell>
              </TableRow>
            ) : (
              federaciones.map((f) => (
                <TableRow key={f.id} className={!f.activo ? 'opacity-50' : ''}>
                  <TableCell>
                    <Link href={`/admin/federaciones/${f.id}`} className="font-medium hover:underline">
                      {f.nombre}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{f.cuit ?? '—'}</TableCell>
                  <TableCell className="text-right tabular-nums">{f.equipos_count}</TableCell>
                  <TableCell><Badge variant={f.activo ? 'default' : 'secondary'}>{f.activo ? 'activa' : 'inactiva'}</Badge></TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
