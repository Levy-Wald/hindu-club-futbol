import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { FileText, Eye } from 'lucide-react'
import { NuevoConvenioDialog } from './_components/nuevo-convenio-dialog'

const TENANT_ID = '11111111-1111-1111-1111-111111111111'

function formatMoney(amount: number | null): string {
  if (amount == null) return '-'
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(amount)
}

function formatFecha(iso: string | null): string {
  if (!iso) return '-'
  return new Date(iso + 'T12:00:00').toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })
}

const estadoBadge: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  activo: { label: 'Activo', variant: 'default' },
  vigente: { label: 'Vigente', variant: 'default' },
  completado: { label: 'Completado', variant: 'secondary' },
  cancelado: { label: 'Cancelado', variant: 'destructive' },
  en_mora: { label: 'En mora', variant: 'destructive' },
}

interface PageProps {
  searchParams: Promise<{ estado?: string }>
}

export default async function ConveniosPage({ searchParams }: PageProps) {
  const filters = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from('convenios_pago')
    .select('*, persona:personas!persona_id(id, nombre, apellido, numero_documento)')
    .eq('tenant_id', TENANT_ID)
    .order('created_at', { ascending: false })

  if (filters.estado) query = query.eq('estado', filters.estado)

  const { data: convenios, error } = await query
  const items = convenios ?? []

  // Fetch personas for the dialog
  const { data: personas } = await supabase
    .from('personas')
    .select('id, nombre, apellido, numero_documento')
    .eq('tenant_id', TENANT_ID)
    .order('apellido')
    .limit(2000)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileText className="h-6 w-6 text-muted-foreground" />
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">Convenios de Pago</h1>
            <p className="text-sm text-muted-foreground">{items.length} convenio(s)</p>
          </div>
        </div>
        <NuevoConvenioDialog personas={personas ?? []} />
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
            <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No hay convenios de pago registrados</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Persona</TableHead>
                    <TableHead className="text-right">Deuda original</TableHead>
                    <TableHead className="text-center">Cuotas</TableHead>
                    <TableHead className="text-right">Monto/cuota</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Inicio</TableHead>
                    <TableHead>Prox. venc.</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map(c => {
                    const personaRaw = c.persona as unknown
                    const persona = (Array.isArray(personaRaw) ? personaRaw[0] : personaRaw) as { nombre: string; apellido: string; numero_documento: string | null } | null
                    const badge = estadoBadge[c.estado] ?? { label: c.estado, variant: 'outline' as const }

                    return (
                      <TableRow key={c.id}>
                        <TableCell>
                          <div>
                            <span className="font-medium">{persona ? `${persona.apellido}, ${persona.nombre}` : '-'}</span>
                            {persona?.numero_documento && (
                              <span className="text-xs text-muted-foreground ml-1">({persona.numero_documento})</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-mono">{formatMoney(c.deuda_original)}</TableCell>
                        <TableCell className="text-center">{c.cuotas_pagadas}/{c.cantidad_cuotas}</TableCell>
                        <TableCell className="text-right font-mono">{formatMoney(c.monto_cuota)}</TableCell>
                        <TableCell><Badge variant={badge.variant}>{badge.label}</Badge></TableCell>
                        <TableCell>{formatFecha(c.fecha_inicio)}</TableCell>
                        <TableCell>{formatFecha(c.proximo_vencimiento)}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="outline" size="sm" render={<Link href={`/admin/finanzas/convenios/${c.id}`} />}>
                            <Eye className="h-3.5 w-3.5 mr-1" />
                            Ver
                          </Button>
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
