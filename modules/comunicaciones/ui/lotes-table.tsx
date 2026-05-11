'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import Link from 'next/link'
import { Send, Plus, ExternalLink } from 'lucide-react'
import type { LoteResumen } from '@/modules/comunicaciones/lib/queries'

const SEGMENTO_LABELS: Record<string, string> = {
  todos_activos: 'Todos los activos',
  equipo: 'Equipo',
  desconocido: '—',
}

const CANAL_LABELS: Record<string, string> = {
  email: 'Email',
  inapp: 'In-App',
}

function formatFecha(fecha: string) {
  return new Date(fecha).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

interface LotesTableProps {
  lotes: LoteResumen[]
  puede_enviar_masivo: boolean
}

export function LotesTable({ lotes, puede_enviar_masivo }: LotesTableProps) {
  return (
    <div className="space-y-4" data-testid="lotes-section">
      {/* Toolbar */}
      <div className="flex items-center justify-end">
        {puede_enviar_masivo && (
          <Button render={<Link href="/admin/comunicaciones/envios-masivos/nuevo" />} data-testid="btn-nuevo-envio-masivo">
            <Plus className="h-4 w-4" />
            Nuevo envio masivo
          </Button>
        )}
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {lotes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Send className="h-10 w-10 text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">
                No hay envios masivos registrados.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Plantilla</TableHead>
                    <TableHead>Canal</TableHead>
                    <TableHead>Segmento</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Enviados</TableHead>
                    <TableHead>Fallados</TableHead>
                    <TableHead className="w-[60px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lotes.map((lote) => (
                    <TableRow key={lote.lote_id} data-testid="lote-row">
                      <TableCell className="text-muted-foreground whitespace-nowrap">
                        {formatFecha(lote.primer_envio)}
                      </TableCell>
                      <TableCell className="font-medium">
                        {lote.plantilla_slug}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {CANAL_LABELS[lote.canal] ?? lote.canal}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {SEGMENTO_LABELS[lote.segmento_tipo] ?? lote.segmento_tipo}
                      </TableCell>
                      <TableCell className="font-medium">
                        {lote.total}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="border-success-500 text-success-700 bg-success-50">
                          {lote.enviados}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {lote.fallados > 0 ? (
                          <Badge variant="destructive">{lote.fallados}</Badge>
                        ) : (
                          <span className="text-muted-foreground">0</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          render={<Link href={`/admin/comunicaciones/envios-masivos/${lote.lote_id}`} />}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
