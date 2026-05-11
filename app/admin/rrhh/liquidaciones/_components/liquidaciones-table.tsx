'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { SelectionBar } from '@/components/ui/selection-bar'
import { ExportFormatSelector } from '@/components/ui/export-format-selector'
import { Receipt, Trash2, Ban } from 'lucide-react'
import { eliminarLiquidacion, anularLiquidacion } from '@/app/admin/rrhh/_actions'
import { LiquidacionActions } from './liquidacion-actions'
import { toast } from 'sonner'
import type { ExportData } from '@/lib/export/formats'

function formatMoney(amount: number | null, currency = 'ARS') {
  if (amount == null) return '-'
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency }).format(amount)
}

function formatFecha(iso: string | null): string {
  if (!iso) return '-'
  return new Date(iso).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })
}

function estadoBadgeClass(e: string): string {
  const map: Record<string, string> = {
    borrador: 'bg-neutral-100 text-neutral-800 dark:bg-neutral-900/30 dark:text-neutral-400',
    aprobada: 'bg-info-100 text-info-800 dark:bg-info-900/30 dark:text-info-400',
    pagada: 'bg-success-100 text-success-800 dark:bg-success-900/30 dark:text-success-400',
    anulada: 'bg-error-100 text-error-800 dark:bg-error-900/30 dark:text-error-400',
  }
  return map[e] ?? ''
}

function estadoLabel(e: string): string {
  const map: Record<string, string> = { borrador: 'Borrador', aprobada: 'Aprobada', pagada: 'Pagada', anulada: 'Anulada' }
  return map[e] ?? e
}

interface Liquidacion {
  id: string
  periodo: string
  persona_id: string
  monto_bruto: number
  deducciones: number
  monto_neto: number
  moneda: string
  estado: string
  created_at: string
  movimiento_caja_id: string | null
  persona: unknown
  contrato: unknown
}

interface Caja {
  id: string
  nombre: string
  tipo: string
  moneda: string
  saldo_actual: number
}

interface LiquidacionesTableProps {
  liquidaciones: Liquidacion[]
  cajas: Caja[]
}

export function LiquidacionesTable({ liquidaciones, cajas }: LiquidacionesTableProps) {
  const router = useRouter()
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [isPending, startTransition] = useTransition()
  const [deleteConfirm, setDeleteConfirm] = useState<string[] | null>(null)
  const [anularConfirm, setAnularConfirm] = useState<string[] | null>(null)

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const allSelected = liquidaciones.length > 0 && selected.size === liquidaciones.length
  function selectAll() { setSelected(new Set(liquidaciones.map((l) => l.id))) }
  function clearSelection() { setSelected(new Set()) }

  function getPersona(raw: unknown) {
    return (Array.isArray(raw) ? raw[0] : raw) as { id: string; nombre: string; apellido: string } | null
  }

  function buildExportData(items: Liquidacion[]): ExportData | null {
    if (items.length === 0) return null
    return {
      headers: ['Periodo', 'Persona', 'Bruto', 'Deducciones', 'Neto', 'Moneda', 'Estado', 'Fecha'],
      rows: items.map((l) => {
        const p = getPersona(l.persona)
        return [
          l.periodo,
          p ? `${p.apellido}, ${p.nombre}` : '-',
          String(l.monto_bruto),
          String(l.deducciones),
          String(l.monto_neto),
          l.moneda,
          estadoLabel(l.estado),
          formatFecha(l.created_at),
        ]
      }),
      filename: `liquidaciones_${new Date().toISOString().split('T')[0]}`,
    }
  }

  function getExportData(): ExportData | null {
    return buildExportData(liquidaciones.filter((l) => selected.has(l.id)))
  }

  function getAllExportData(): ExportData | null {
    return buildExportData(liquidaciones)
  }

  function handleBulkDelete() {
    const ids = [...selected].filter((id) => {
      const l = liquidaciones.find((x) => x.id === id)
      return l?.estado === 'borrador'
    })
    if (ids.length === 0) {
      toast.error('Solo se pueden eliminar liquidaciones en estado borrador')
      return
    }
    setDeleteConfirm(ids)
  }

  function handleBulkAnular() {
    const ids = [...selected].filter((id) => {
      const l = liquidaciones.find((x) => x.id === id)
      return l?.estado !== 'anulada'
    })
    if (ids.length === 0) {
      toast.error('Ninguna de las seleccionadas se puede anular')
      return
    }
    setAnularConfirm(ids)
  }

  function confirmBulkDelete() {
    if (!deleteConfirm) return
    startTransition(async () => {
      let ok = 0
      for (const id of deleteConfirm) {
        const result = await eliminarLiquidacion(id)
        if (result.success) ok++
      }
      setDeleteConfirm(null)
      clearSelection()
      if (ok > 0) toast.success(`${ok} liquidaci${ok > 1 ? 'ones' : 'ón'} eliminada${ok > 1 ? 's' : ''}`)
      router.refresh()
    })
  }

  function confirmBulkAnular() {
    if (!anularConfirm) return
    startTransition(async () => {
      let ok = 0
      for (const id of anularConfirm) {
        const result = await anularLiquidacion(id)
        if (result.success) ok++
      }
      setAnularConfirm(null)
      clearSelection()
      if (ok > 0) toast.success(`${ok} liquidaci${ok > 1 ? 'ones' : 'ón'} anulada${ok > 1 ? 's' : ''}`)
      router.refresh()
    })
  }

  return (
    <>
      {/* Toolbar: export */}
      <div className="flex items-center gap-2 justify-end">
        <ExportFormatSelector getData={getAllExportData} disabled={liquidaciones.length === 0} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {liquidaciones.length} liquidaci{liquidaciones.length !== 1 ? 'ones' : 'ón'}
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
                    <TableHead className="w-10">
                      <Checkbox checked={allSelected} onCheckedChange={() => allSelected ? clearSelection() : selectAll()} />
                    </TableHead>
                    <TableHead>Periodo</TableHead>
                    <TableHead>Persona</TableHead>
                    <TableHead className="text-right">Bruto</TableHead>
                    <TableHead className="text-right">Deducciones</TableHead>
                    <TableHead className="text-right">Neto</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {liquidaciones.map((liq) => {
                    const persona = getPersona(liq.persona)
                    const esAnulada = liq.estado === 'anulada'

                    return (
                      <TableRow key={liq.id} className={`${esAnulada ? 'opacity-50' : ''} ${selected.has(liq.id) ? 'bg-muted/50' : ''}`}>
                        <TableCell>
                          <Checkbox checked={selected.has(liq.id)} onCheckedChange={() => toggleSelect(liq.id)} />
                        </TableCell>
                        <TableCell className={esAnulada ? 'line-through' : ''}>{liq.periodo}</TableCell>
                        <TableCell className={esAnulada ? 'line-through' : ''}>
                          {persona ? (
                            <Link href={`/admin/personas/${persona.id}`} className="text-primary hover:underline">
                              {persona.apellido}, {persona.nombre}
                            </Link>
                          ) : '-'}
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
                            liquidacion={{ id: liq.id, estado: liq.estado, movimiento_caja_id: liq.movimiento_caja_id }}
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

      {/* Selection bar */}
      <SelectionBar count={selected.size} total={liquidaciones.length} onSelectAll={selectAll} onClear={clearSelection} getData={getExportData} />

      {/* Bulk action buttons */}
      {selected.size > 0 && (
        <div className="fixed bottom-16 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2">
          <Button variant="destructive" size="sm" onClick={handleBulkDelete} disabled={isPending}>
            <Trash2 className="h-3.5 w-3.5 mr-1" /> Eliminar borradores ({selected.size})
          </Button>
          <Button variant="outline" size="sm" onClick={handleBulkAnular} disabled={isPending}>
            <Ban className="h-3.5 w-3.5 mr-1" /> Anular ({selected.size})
          </Button>
        </div>
      )}

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar {deleteConfirm?.length ?? 0} liquidaci{(deleteConfirm?.length ?? 0) > 1 ? 'ones' : 'ón'}?</AlertDialogTitle>
            <AlertDialogDescription>Solo se eliminarán las que estén en estado borrador.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmBulkDelete} disabled={isPending}>
              {isPending ? 'Eliminando...' : 'Confirmar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Anular confirmation */}
      <AlertDialog open={!!anularConfirm} onOpenChange={() => setAnularConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Anular {anularConfirm?.length ?? 0} liquidaci{(anularConfirm?.length ?? 0) > 1 ? 'ones' : 'ón'}?</AlertDialogTitle>
            <AlertDialogDescription>
              Las liquidaciones pagadas también anularán su movimiento de caja asociado. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmBulkAnular} disabled={isPending} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {isPending ? 'Anulando...' : 'Confirmar anulación'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
