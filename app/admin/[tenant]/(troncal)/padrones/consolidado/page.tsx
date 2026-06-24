import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ArrowLeft, Users, Layers, Building2, Truck, GitMerge } from 'lucide-react'
import { fetchConsolidado } from './_lib/queries'

export default async function ConsolidadoPage() {
  const c = await fetchConsolidado()

  const kpis = [
    { label: 'Padrones', value: c.totalPadrones, icon: Layers },
    { label: 'Personas únicas', value: c.personasUnicas, icon: Users },
    { label: 'En 2+ padrones', value: c.personasEnVariosPadrones, icon: GitMerge },
    { label: 'Entidades', value: c.entidadesCount, icon: Building2 },
    { label: 'Proveedores', value: c.proveedoresCount, icon: Truck },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3">
        <Link href="/admin/padrones">
          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" aria-label="Volver">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Consolidador de padrones</h1>
          <p className="text-sm text-muted-foreground">Vista unificada de todos los padrones, entidades y proveedores del sistema.</p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {kpis.map((k) => {
          const Icon = k.icon
          return (
            <Card key={k.label}>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Icon className="h-4 w-4" />
                  <span className="text-xs">{k.label}</span>
                </div>
                <p className="mt-1 text-xl font-bold tabular-nums">{k.value.toLocaleString('es-AR')}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Padrones */}
      <Card>
        <CardHeader><CardTitle className="text-lg">Padrones</CardTitle></CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Padrón</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-right">Miembros</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {c.padrones.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={99} className="text-center text-muted-foreground py-6">Sin padrones.</TableCell>
                  </TableRow>
                ) : (
                  c.padrones.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>
                        <Link href={`/admin/padrones/${p.id}`} className="font-medium hover:underline">{p.nombre}</Link>
                      </TableCell>
                      <TableCell><Badge variant="outline" className="capitalize">{p.tipo ?? '—'}</Badge></TableCell>
                      <TableCell className="text-right tabular-nums">{p.miembros.toLocaleString('es-AR')}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          {c.personasEnVariosPadrones > 0 && (
            <p className="text-xs text-muted-foreground mt-3">
              <span className="font-medium">{c.personasEnVariosPadrones.toLocaleString('es-AR')}</span> personas figuran en más de un padrón
              (la suma de miembros es mayor que las personas únicas por ese solapamiento).
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
