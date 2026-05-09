import { createClient as createServiceClient } from '@supabase/supabase-js'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

const TENANT_ID = '11111111-1111-1111-1111-111111111111'

async function getConflicts() {
  const sc = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  const { data } = await sc
    .from('import_field_conflicts')
    .select(`
      id, tabla, campo, valor_existente, valor_nuevo, resuelto, resolucion,
      import_rows!row_id(
        numero_fila,
        import_runs!run_id(archivo_origen, pipeline_slug)
      ),
      personas!persona_id(nombre, apellido, numero_documento)
    `)
    .order('created_at', { ascending: false })
    .limit(100)

  return data ?? []
}

export default async function ConflictosPage() {
  const conflicts = await getConflicts()

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Link href="/admin/imports">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-xl font-bold">Conflictos de campos</h1>
      </div>

      {conflicts.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          No hay conflictos pendientes.
        </div>
      ) : (
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Persona</TableHead>
                <TableHead>Campo</TableHead>
                <TableHead>Valor actual</TableHead>
                <TableHead>Valor nuevo</TableHead>
                <TableHead>Archivo</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {conflicts.map((c) => {
                const persona = c.personas as unknown as { nombre: string; apellido: string; numero_documento: string } | null
                const row = c.import_rows as unknown as { numero_fila: number; import_runs: { archivo_origen: string } | null } | null
                return (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">
                      {persona ? `${persona.apellido}, ${persona.nombre}` : '-'}
                    </TableCell>
                    <TableCell>
                      <code className="text-xs bg-muted px-1 py-0.5 rounded">{c.campo}</code>
                    </TableCell>
                    <TableCell className="text-sm">
                      {JSON.parse(c.valor_existente ?? 'null')?.toString() ?? '-'}
                    </TableCell>
                    <TableCell className="text-sm">
                      {JSON.parse(c.valor_nuevo ?? 'null')?.toString() ?? '-'}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {(row as { import_runs?: { archivo_origen?: string } | null })?.import_runs?.archivo_origen ?? '-'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={c.resuelto ? 'default' : 'outline'}>
                        {c.resuelto ? c.resolucion ?? 'Resuelto' : 'Pendiente'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
