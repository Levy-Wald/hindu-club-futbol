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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
import { DownloadTemplateButton } from '@/components/ui/download-template-button'
import { FileText, MoreHorizontal, Pencil, XCircle, Trash2 } from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { eliminarContrato, rescindirContrato } from '@/modules/rrhh/lib/actions'
import { toast } from 'sonner'
import type { ExportData } from '@/lib/export/formats'

function formatMoney(amount: number | null, currency = 'ARS') {
  if (amount == null) return '-'
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency }).format(amount)
}

function formatFecha(iso: string | null): string {
  if (!iso) return 'Indefinido'
  return new Date(iso).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })
}

function modalidadLabel(m: string): string {
  const map: Record<string, string> = {
    relacion_dependencia: 'Rel. dependencia', monotributo: 'Monotributo',
    honorarios: 'Honorarios', informal: 'Informal', pasantia: 'Pasantia', voluntariado: 'Voluntariado',
  }
  return map[m] ?? m
}

function estadoLabel(e: string): string {
  const map: Record<string, string> = { vigente: 'Vigente', vencido: 'Vencido', rescindido: 'Rescindido', suspendido: 'Suspendido' }
  return map[e] ?? e
}

function estadoBadgeClass(e: string): string {
  const map: Record<string, string> = {
    vigente: 'bg-success-100 text-success-800 dark:bg-success-900/30 dark:text-success-400',
    vencido: 'bg-warning-100 text-warning-800 dark:bg-warning-900/30 dark:text-warning-400',
    rescindido: 'bg-error-100 text-error-800 dark:bg-error-900/30 dark:text-error-400',
    suspendido: 'bg-neutral-100 text-neutral-800 dark:bg-neutral-900/30 dark:text-neutral-400',
  }
  return map[e] ?? ''
}

function frecuenciaLabel(f: string): string {
  const map: Record<string, string> = {
    mensual: 'Mensual', quincenal: 'Quincenal', semanal: 'Semanal', por_hora: 'Por hora', por_evento: 'Por evento',
  }
  return map[f] ?? f
}

interface Contrato {
  id: string
  persona_id: string
  modalidad: string
  frecuencia: string
  monto: number
  moneda: string
  estado: string
  fecha_inicio: string
  fecha_fin: string | null
  persona: unknown
  datos_laborales?: unknown
}

interface ContratosTableProps {
  contratos: Contrato[]
}

const IMPORT_HEADERS = ['persona_documento', 'modalidad', 'fecha_inicio', 'fecha_fin', 'monto', 'moneda', 'frecuencia']
const IMPORT_SAMPLE = ['12345678', 'relacion_dependencia', '2026-01-01', '2026-12-31', '150000', 'ARS', 'mensual']

export function ContratosTable({ contratos }: ContratosTableProps) {
  const router = useRouter()
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [isPending, startTransition] = useTransition()
  const [deleteConfirm, setDeleteConfirm] = useState<string[] | null>(null)
  const [rescindirOpen, setRescindirOpen] = useState(false)
  const [rescindirIds, setRescindirIds] = useState<string[]>([])
  const [motivo, setMotivo] = useState('')

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const allSelected = contratos.length > 0 && selected.size === contratos.length
  function selectAll() { setSelected(new Set(contratos.map((c) => c.id))) }
  function clearSelection() { setSelected(new Set()) }

  function getPersona(raw: unknown) {
    const p = (Array.isArray(raw) ? raw[0] : raw) as { id: string; nombre: string; apellido: string; numero_documento: string } | null
    return p
  }

  function getExportData(): ExportData | null {
    const items = contratos.filter((c) => selected.has(c.id))
    if (items.length === 0) return null
    return {
      headers: ['Persona', 'Documento', 'Modalidad', 'Frecuencia', 'Monto', 'Moneda', 'Estado', 'Fecha inicio', 'Fecha fin'],
      rows: items.map((c) => {
        const p = getPersona(c.persona)
        return [
          p ? `${p.apellido}, ${p.nombre}` : '-',
          p?.numero_documento ?? '-',
          modalidadLabel(c.modalidad),
          frecuenciaLabel(c.frecuencia),
          String(c.monto),
          c.moneda,
          estadoLabel(c.estado),
          formatFecha(c.fecha_inicio),
          formatFecha(c.fecha_fin),
        ]
      }),
      filename: `contratos_${new Date().toISOString().split('T')[0]}`,
    }
  }

  function getAllExportData(): ExportData | null {
    if (contratos.length === 0) return null
    return {
      headers: ['Persona', 'Documento', 'Modalidad', 'Frecuencia', 'Monto', 'Moneda', 'Estado', 'Fecha inicio', 'Fecha fin'],
      rows: contratos.map((c) => {
        const p = getPersona(c.persona)
        return [
          p ? `${p.apellido}, ${p.nombre}` : '-',
          p?.numero_documento ?? '-',
          modalidadLabel(c.modalidad),
          frecuenciaLabel(c.frecuencia),
          String(c.monto),
          c.moneda,
          estadoLabel(c.estado),
          formatFecha(c.fecha_inicio),
          formatFecha(c.fecha_fin),
        ]
      }),
      filename: `contratos_${new Date().toISOString().split('T')[0]}`,
    }
  }

  function handleBulkDelete() {
    const ids = [...selected]
    if (ids.length === 0) return
    setDeleteConfirm(ids)
  }

  function handleBulkRescindir() {
    const ids = [...selected].filter((id) => {
      const c = contratos.find((x) => x.id === id)
      return c?.estado === 'vigente'
    })
    if (ids.length === 0) {
      toast.error('Ninguno de los seleccionados está vigente')
      return
    }
    setRescindirIds(ids)
    setRescindirOpen(true)
  }

  function confirmBulkDelete() {
    if (!deleteConfirm) return
    startTransition(async () => {
      let ok = 0
      let fail = 0
      for (const id of deleteConfirm) {
        const result = await eliminarContrato(id)
        if (result.success) ok++
        else fail++
      }
      setDeleteConfirm(null)
      clearSelection()
      if (ok > 0) toast.success(`${ok} contrato${ok > 1 ? 's' : ''} eliminado${ok > 1 ? 's' : ''}`)
      if (fail > 0) toast.error(`${fail} no se pudo eliminar (tienen liquidaciones pagadas)`)
      router.refresh()
    })
  }

  function confirmBulkRescindir() {
    if (!motivo.trim()) {
      toast.error('El motivo de rescisión es obligatorio')
      return
    }
    startTransition(async () => {
      let ok = 0
      for (const id of rescindirIds) {
        const result = await rescindirContrato(id, motivo.trim())
        if (result.success) ok++
      }
      setRescindirOpen(false)
      setMotivo('')
      clearSelection()
      if (ok > 0) toast.success(`${ok} contrato${ok > 1 ? 's' : ''} rescindido${ok > 1 ? 's' : ''}`)
      router.refresh()
    })
  }

  return (
    <>
      {/* Toolbar: export + template */}
      <div className="flex items-center gap-2 justify-end">
        <DownloadTemplateButton
          headers={IMPORT_HEADERS}
          filename="modelo_contratos"
          sampleRow={IMPORT_SAMPLE}
        />
        <ExportFormatSelector getData={getAllExportData} disabled={contratos.length === 0} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {contratos.length} contrato{contratos.length !== 1 ? 's' : ''}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {contratos.length === 0 ? (
            <div className="py-12 text-center">
              <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No se encontraron contratos</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">
                      <Checkbox checked={allSelected} onCheckedChange={() => allSelected ? clearSelection() : selectAll()} />
                    </TableHead>
                    <TableHead>Persona</TableHead>
                    <TableHead>Modalidad</TableHead>
                    <TableHead>Frecuencia</TableHead>
                    <TableHead className="text-right">Monto</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Fecha inicio</TableHead>
                    <TableHead>Fecha fin</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contratos.map((contrato) => {
                    const persona = getPersona(contrato.persona)
                    return (
                      <TableRow key={contrato.id} className={selected.has(contrato.id) ? 'bg-muted/50' : ''}>
                        <TableCell>
                          <Checkbox checked={selected.has(contrato.id)} onCheckedChange={() => toggleSelect(contrato.id)} />
                        </TableCell>
                        <TableCell>
                          {persona ? (
                            <Link href={`/admin/personas/${persona.id}`} className="font-medium text-primary hover:underline">
                              {persona.apellido}, {persona.nombre}
                            </Link>
                          ) : '-'}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{modalidadLabel(contrato.modalidad)}</Badge>
                        </TableCell>
                        <TableCell>{frecuenciaLabel(contrato.frecuencia)}</TableCell>
                        <TableCell className="text-right font-medium whitespace-nowrap">
                          {formatMoney(contrato.monto, contrato.moneda)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={estadoBadgeClass(contrato.estado)}>
                            {estadoLabel(contrato.estado)}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatFecha(contrato.fecha_inicio)}</TableCell>
                        <TableCell>{formatFecha(contrato.fecha_fin)}</TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="h-8 w-8" />}>
                              <MoreHorizontal className="h-4 w-4" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => router.push(`/admin/rrhh/contratos/${contrato.id}`)}>
                                <Pencil className="h-4 w-4 mr-2" /> Editar
                              </DropdownMenuItem>
                              {contrato.estado === 'vigente' && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem className="text-destructive" onClick={() => { setRescindirIds([contrato.id]); setRescindirOpen(true) }}>
                                    <XCircle className="h-4 w-4 mr-2" /> Rescindir
                                  </DropdownMenuItem>
                                </>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-destructive" onClick={() => setDeleteConfirm([contrato.id])}>
                                <Trash2 className="h-4 w-4 mr-2" /> Eliminar
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
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
      <SelectionBar count={selected.size} total={contratos.length} onSelectAll={selectAll} onClear={clearSelection} getData={getExportData} />

      {/* Bulk action buttons when selected */}
      {selected.size > 0 && (
        <div className="fixed bottom-16 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2">
          <Button variant="destructive" size="sm" onClick={handleBulkDelete} disabled={isPending}>
            <Trash2 className="h-3.5 w-3.5 mr-1" /> Eliminar ({selected.size})
          </Button>
          <Button variant="outline" size="sm" onClick={handleBulkRescindir} disabled={isPending}>
            <XCircle className="h-3.5 w-3.5 mr-1" /> Rescindir vigentes
          </Button>
        </div>
      )}

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar {deleteConfirm?.length ?? 0} contrato{(deleteConfirm?.length ?? 0) > 1 ? 's' : ''}?</AlertDialogTitle>
            <AlertDialogDescription>
              Los contratos con liquidaciones pagadas no se podrán eliminar. Esta acción es soft-delete.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmBulkDelete} disabled={isPending}>
              {isPending ? 'Eliminando...' : 'Confirmar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Rescindir dialog */}
      <Dialog open={rescindirOpen} onOpenChange={setRescindirOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rescindir {rescindirIds.length} contrato{rescindirIds.length > 1 ? 's' : ''}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Label>Motivo de rescision</Label>
            <Textarea value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Ingrese el motivo..." rows={3} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRescindirOpen(false)} disabled={isPending}>Cancelar</Button>
            <Button variant="destructive" onClick={confirmBulkRescindir} disabled={isPending}>
              {isPending ? 'Rescindiendo...' : 'Confirmar rescision'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
