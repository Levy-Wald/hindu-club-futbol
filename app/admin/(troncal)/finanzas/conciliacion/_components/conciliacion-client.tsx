'use client'

import { useState, useCallback, useTransition } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'
import { ArrowLeftRight, Upload, Wand2, DollarSign, AlertTriangle, CheckCircle2, X, Link2, Plus, Ban, FileWarning } from 'lucide-react'
import { toast } from 'sonner'
import {
  importarExtracto,
  autoMatchearExtracto,
  conciliarManual,
  crearMovimientoDesdeFila,
  marcarDiscrepancia,
  ignorarFila,
  desconciliar,
  fetchFilasConciliacion,
  fetchMovimientosSinConciliar,
  fetchResumenConciliacion,
} from '@/modules/finanzas/lib/conciliacion'
import type { ResultadoImport } from '@/modules/finanzas/lib/conciliacion'
import { cn } from '@/lib/utils'

interface Caja {
  id: string
  nombre: string
  tipo: string
  moneda: string
  saldo_actual: number
}

interface Cuenta {
  id: string
  codigo: string
  nombre: string
  tipo: string
}

interface FilaRow {
  id: string
  fecha_operacion: string
  descripcion: string
  referencia_bancaria: string | null
  monto: number
  saldo_banco: number | null
  estado: string
  movimiento_caja_id: string | null
  notas_conciliacion: string | null
  conciliado_at: string | null
  import_batch_id: string
  movimiento: { id: string; numero: number | null; tipo: string; monto_neto: number; fecha: string; descripcion: string | null } | null
}

interface MovSinConciliar {
  id: string
  numero: number | null
  tipo: string
  monto_neto: number
  fecha: string
  descripcion: string | null
}

interface Resumen {
  caja: Caja
  saldoBanco: number | null
  fechaUltimoSaldo: string | null
  sinConciliarSistema: number
  sinMatchBanco: number
}

function formatMoney(v: number): string {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(v)
}

function formatFecha(iso: string | null): string {
  if (!iso) return '-'
  return new Date(iso + 'T12:00:00').toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })
}

const estadoBadge: Record<string, string> = {
  pendiente: 'bg-warning-100 text-warning-800',
  conciliado: 'bg-success-100 text-success-800',
  discrepancia: 'bg-error-100 text-error-800',
  ignorado: 'bg-neutral-100 text-neutral-600',
}

export function ConciliacionClient({ cajas, cuentas }: { cajas: Caja[]; cuentas: Cuenta[] }) {
  const [cajaId, setCajaId] = useState('')
  const [tab, setTab] = useState<'pendientes' | 'conciliados' | 'otros'>('pendientes')
  const [filas, setFilas] = useState<FilaRow[]>([])
  const [resumen, setResumen] = useState<Resumen | null>(null)
  const [loading, setLoading] = useState(false)
  const [pending, startTransition] = useTransition()

  const cargarDatos = useCallback(async (cId: string, tabVal?: string) => {
    if (!cId) return
    setLoading(true)
    const t = tabVal ?? tab
    const estadoFilter = t === 'pendientes' ? 'pendientes' : t === 'conciliados' ? 'conciliado' : undefined
    const [filasData, resumenData] = await Promise.all([
      fetchFilasConciliacion(cId, estadoFilter),
      fetchResumenConciliacion(cId),
    ])
    // For "otros" tab, filter client-side
    if (t === 'otros') {
      setFilas((filasData as unknown as FilaRow[]).filter(f => f.estado === 'ignorado' || f.estado === 'discrepancia'))
    } else {
      setFilas(filasData as unknown as FilaRow[])
    }
    setResumen(resumenData)
    setLoading(false)
  }, [tab])

  function handleCajaChange(v: string | null) {
    const val = v ?? ''
    setCajaId(val)
    if (val) cargarDatos(val)
  }

  function handleTabChange(t: 'pendientes' | 'conciliados' | 'otros') {
    setTab(t)
    if (cajaId) cargarDatos(cajaId, t)
  }

  function handleAutoMatch() {
    if (!cajaId) return
    startTransition(async () => {
      const res = await autoMatchearExtracto(cajaId)
      if (res.success) {
        const d = res.data as { matcheados: number; sin_match: number; multiples_candidatos: number }
        toast.success(`Auto-match: ${d.matcheados} conciliados, ${d.sin_match} sin match, ${d.multiples_candidatos} con multiples candidatos`)
        cargarDatos(cajaId)
      } else {
        toast.error(res.error)
      }
    })
  }

  function handleConciliarManual(filaId: string, movId: string) {
    startTransition(async () => {
      const res = await conciliarManual(filaId, movId)
      if (res.success) {
        toast.success('Conciliado')
        cargarDatos(cajaId)
      } else {
        toast.error(res.error)
      }
    })
  }

  function handleIgnorar(filaId: string) {
    startTransition(async () => {
      const res = await ignorarFila(filaId)
      if (res.success) {
        toast.success('Fila ignorada')
        cargarDatos(cajaId)
      } else {
        toast.error(res.error)
      }
    })
  }

  function handleDesconciliar(filaId: string) {
    startTransition(async () => {
      const res = await desconciliar(filaId)
      if (res.success) {
        toast.success('Desconciliado')
        cargarDatos(cajaId)
      } else {
        toast.error(res.error)
      }
    })
  }

  const diferencia = resumen && resumen.saldoBanco != null
    ? Number(resumen.caja.saldo_actual) - resumen.saldoBanco
    : null

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <ArrowLeftRight className="h-6 w-6 text-muted-foreground" />
          <h1 className="text-xl sm:text-2xl font-bold">Conciliacion Bancaria</h1>
        </div>
        <div className="flex gap-2">
          {cajaId && (
            <>
              <ImportarExtractoModal cajaId={cajaId} onDone={() => cargarDatos(cajaId)} />
              <Button variant="outline" size="sm" onClick={handleAutoMatch} disabled={pending}>
                <Wand2 className="h-4 w-4 mr-1" /> Auto-matchear
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Caja selector */}
      <Card>
        <CardContent className="pt-4">
          <div className="space-y-2">
            <Label>Caja bancaria</Label>
            <Select value={cajaId} onValueChange={handleCajaChange}>
              <option value="">Seleccionar caja...</option>
              {cajas.map(c => (
                <option key={c.id} value={c.id}>{c.nombre} ({c.tipo} — {c.moneda})</option>
              ))}
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Resumen */}
      {resumen && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <DollarSign className="h-4 w-4" />
                <span className="text-xs">Saldo sistema</span>
              </div>
              <p className="text-lg font-bold font-mono">{formatMoney(Number(resumen.caja.saldo_actual))}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <DollarSign className="h-4 w-4" />
                <span className="text-xs">Saldo banco</span>
              </div>
              <p className="text-lg font-bold font-mono">
                {resumen.saldoBanco != null ? formatMoney(resumen.saldoBanco) : 'Sin datos'}
              </p>
              {resumen.fechaUltimoSaldo && <p className="text-[10px] text-muted-foreground">al {formatFecha(resumen.fechaUltimoSaldo)}</p>}
            </CardContent>
          </Card>
          <Card className={diferencia != null && Math.abs(diferencia) > 1 ? 'border-error-500' : diferencia != null ? 'border-success-500' : ''}>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                {diferencia != null && Math.abs(diferencia) <= 1
                  ? <CheckCircle2 className="h-4 w-4 text-success-600" />
                  : <AlertTriangle className="h-4 w-4 text-error-600" />}
                <span className="text-xs">Diferencia</span>
              </div>
              <p className={cn('text-lg font-bold font-mono', diferencia && Math.abs(diferencia) > 1 ? 'text-error-600' : 'text-success-600')}>
                {diferencia != null ? formatMoney(diferencia) : '-'}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <p className="text-xs text-muted-foreground mb-1">Sistema sin conciliar</p>
              <p className="text-lg font-bold">{resumen.sinConciliarSistema}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <p className="text-xs text-muted-foreground mb-1">Banco sin match</p>
              <p className="text-lg font-bold">{resumen.sinMatchBanco}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs */}
      {cajaId && (
        <div className="flex gap-1 border-b">
          {(['pendientes', 'conciliados', 'otros'] as const).map(t => (
            <button
              key={t}
              onClick={() => handleTabChange(t)}
              className={cn(
                'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
                tab === t ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
              )}
            >
              {t === 'pendientes' ? 'Pendientes' : t === 'conciliados' ? 'Conciliados' : 'Ignorados / Discrepancias'}
            </button>
          ))}
        </div>
      )}

      {loading && <p className="text-sm text-muted-foreground text-center py-4">Cargando...</p>}

      {/* Table */}
      {!loading && cajaId && filas.length > 0 && (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Descripcion</TableHead>
                    <TableHead className="text-right">Monto</TableHead>
                    <TableHead>Estado</TableHead>
                    {tab === 'conciliados' && <TableHead>Mov. sistema</TableHead>}
                    {tab === 'otros' && <TableHead>Notas</TableHead>}
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filas.map(f => (
                    <TableRow key={f.id}>
                      <TableCell>{formatFecha(f.fecha_operacion)}</TableCell>
                      <TableCell className="max-w-[250px] truncate">
                        {f.descripcion}
                        {f.referencia_bancaria && <span className="text-xs text-muted-foreground ml-1">({f.referencia_bancaria})</span>}
                      </TableCell>
                      <TableCell className={cn('text-right font-mono', Number(f.monto) > 0 ? 'text-success-600' : 'text-error-600')}>
                        {formatMoney(Number(f.monto))}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={estadoBadge[f.estado] ?? ''}>
                          {f.estado}
                        </Badge>
                      </TableCell>
                      {tab === 'conciliados' && (
                        <TableCell className="text-xs">
                          {f.movimiento ? `#${f.movimiento.numero ?? '-'} ${f.movimiento.tipo} ${formatMoney(Number(f.movimiento.monto_neto))}` : '-'}
                        </TableCell>
                      )}
                      {tab === 'otros' && (
                        <TableCell className="text-xs max-w-[150px] truncate">{f.notas_conciliacion ?? '-'}</TableCell>
                      )}
                      <TableCell>
                        <div className="flex gap-1">
                          {tab === 'pendientes' && (
                            <>
                              <BuscarMatchModal
                                filaId={f.id}
                                cajaId={cajaId}
                                onMatch={(movId) => handleConciliarManual(f.id, movId)}
                              />
                              <CrearMovimientoModal
                                filaId={f.id}
                                cajaId={cajaId}
                                fila={f}
                                cuentas={cuentas}
                                onDone={() => cargarDatos(cajaId)}
                              />
                              <DiscrepanciaModal
                                filaId={f.id}
                                onDone={() => cargarDatos(cajaId)}
                              />
                              <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => handleIgnorar(f.id)} disabled={pending}>
                                <Ban className="h-3 w-3" />
                              </Button>
                            </>
                          )}
                          {tab === 'conciliados' && (
                            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-error-600" onClick={() => handleDesconciliar(f.id)} disabled={pending}>
                              <X className="h-3 w-3 mr-1" /> Desconciliar
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {!loading && cajaId && filas.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-sm text-muted-foreground">
              {tab === 'pendientes' ? 'No hay filas pendientes de conciliar' :
               tab === 'conciliados' ? 'No hay filas conciliadas' :
               'No hay filas ignoradas o con discrepancia'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// =============================================================================
// Modal: Importar extracto
// =============================================================================

function ImportarExtractoModal({ cajaId, onDone }: { cajaId: string; onDone: () => void }) {
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const [resultado, setResultado] = useState<ResultadoImport | null>(null)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    form.set('caja_id', cajaId)

    startTransition(async () => {
      const res = await importarExtracto(form)
      if (res.success) {
        setResultado(res.data as ResultadoImport)
        toast.success('Extracto importado')
      } else {
        toast.error(res.error)
      }
    })
  }

  function handleClose() {
    setOpen(false)
    setResultado(null)
    if (resultado) onDone()
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); else setOpen(true) }}>
      <DialogTrigger render={
        <Button size="sm">
          <Upload className="h-4 w-4 mr-1" /> Importar extracto
        </Button> as React.ReactElement
      } />
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Importar extracto bancario</DialogTitle>
        </DialogHeader>
        {!resultado ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Formato</Label>
              <Select name="formato" defaultValue="generico">
                <option value="generico">Generico (CSV)</option>
                <option value="mercadopago">MercadoPago</option>
                <option value="galicia" disabled>Galicia (pronto)</option>
                <option value="santander" disabled>Santander (pronto)</option>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Archivo (.csv, .xlsx)</Label>
              <Input type="file" name="archivo" accept=".csv,.xlsx,.xls" required />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={handleClose}>Cancelar</Button>
              <Button type="submit" disabled={pending}>
                {pending ? 'Importando...' : 'Importar'}
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-success-600">{resultado.filas_importadas}</p>
                <p className="text-xs text-muted-foreground">Importadas</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-warning-600">{resultado.filas_duplicadas}</p>
                <p className="text-xs text-muted-foreground">Duplicadas</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-error-600">{resultado.filas_con_error}</p>
                <p className="text-xs text-muted-foreground">Con error</p>
              </div>
            </div>
            {resultado.errores.length > 0 && (
              <div className="bg-error-50 dark:bg-error-900/20 rounded p-3 text-xs max-h-32 overflow-y-auto">
                {resultado.errores.map((e, i) => (
                  <p key={i}>Fila {e.fila}: {e.mensaje}</p>
                ))}
              </div>
            )}
            <Button className="w-full" onClick={handleClose}>Ver pendientes</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

// =============================================================================
// Modal: Buscar match
// =============================================================================

function BuscarMatchModal({ filaId, cajaId, onMatch }: { filaId: string; cajaId: string; onMatch: (movId: string) => void }) {
  const [open, setOpen] = useState(false)
  const [movs, setMovs] = useState<MovSinConciliar[]>([])
  const [loading, setLoading] = useState(false)

  async function handleOpen() {
    setOpen(true)
    setLoading(true)
    const data = await fetchMovimientosSinConciliar(cajaId)
    setMovs(data)
    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={handleOpen}>
        <Link2 className="h-3 w-3" />
      </Button>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Buscar movimiento</DialogTitle>
        </DialogHeader>
        {loading ? (
          <p className="text-sm text-muted-foreground py-4">Cargando...</p>
        ) : movs.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4">No hay movimientos sin conciliar en esta caja</p>
        ) : (
          <div className="max-h-64 overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                  <TableHead>Desc.</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {movs.map(m => (
                  <TableRow key={m.id}>
                    <TableCell className="font-mono text-xs">{m.numero ?? '-'}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={m.tipo === 'ingreso' ? 'bg-success-100 text-success-800' : 'bg-error-100 text-error-800'}>
                        {m.tipo}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs">{formatFecha(m.fecha)}</TableCell>
                    <TableCell className="text-right font-mono text-sm">{formatMoney(Number(m.monto_neto))}</TableCell>
                    <TableCell className="text-xs max-w-[100px] truncate">{m.descripcion ?? '-'}</TableCell>
                    <TableCell>
                      <Button size="sm" variant="outline" className="h-6 text-xs" onClick={() => { onMatch(m.id); setOpen(false) }}>
                        Conciliar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

// =============================================================================
// Modal: Crear movimiento desde fila
// =============================================================================

function CrearMovimientoModal({
  filaId, cajaId, fila, cuentas, onDone,
}: {
  filaId: string; cajaId: string; fila: FilaRow; cuentas: Cuenta[]; onDone: () => void
}) {
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()

  const montoFila = Number(fila.monto)
  const tipoDerivado = montoFila > 0 ? 'ingreso' : 'egreso'

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    form.set('fila_id', filaId)
    form.set('caja_id', cajaId)

    startTransition(async () => {
      const res = await crearMovimientoDesdeFila(form)
      if (res.success) {
        toast.success('Movimiento creado y conciliado')
        setOpen(false)
        onDone()
      } else {
        toast.error(res.error)
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => setOpen(true)}>
        <Plus className="h-3 w-3" />
      </Button>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Crear movimiento desde fila bancaria</DialogTitle>
        </DialogHeader>
        <div className="bg-muted/50 rounded p-3 text-sm mb-2">
          <p><strong>Fecha:</strong> {formatFecha(fila.fecha_operacion)}</p>
          <p><strong>Monto:</strong> {formatMoney(montoFila)}</p>
          <p><strong>Tipo derivado:</strong> {tipoDerivado}</p>
          <p><strong>Desc:</strong> {fila.descripcion}</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-2">
            <Label>Descripcion</Label>
            <Input name="descripcion" defaultValue={fila.descripcion} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Cuenta debe</Label>
              <Select name="cuenta_debe_id" defaultValue="">
                <option value="">Sin asignar</option>
                {cuentas.map(c => (
                  <option key={c.id} value={c.id}>{c.codigo} — {c.nombre}</option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Cuenta haber</Label>
              <Select name="cuenta_haber_id" defaultValue="">
                <option value="">Sin asignar</option>
                {cuentas.map(c => (
                  <option key={c.id} value={c.id}>{c.codigo} — {c.nombre}</option>
                ))}
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button type="submit" disabled={pending}>
              {pending ? 'Creando...' : 'Crear y conciliar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// =============================================================================
// Modal: Discrepancia
// =============================================================================

function DiscrepanciaModal({ filaId, onDone }: { filaId: string; onDone: () => void }) {
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const [notas, setNotas] = useState('')

  function handleSubmit() {
    if (!notas.trim()) { toast.error('Debe ingresar notas'); return }
    startTransition(async () => {
      const res = await marcarDiscrepancia(filaId, notas)
      if (res.success) {
        toast.success('Marcada como discrepancia')
        setOpen(false)
        setNotas('')
        onDone()
      } else {
        toast.error(res.error)
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => setOpen(true)}>
        <FileWarning className="h-3 w-3" />
      </Button>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Marcar discrepancia</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-2">
            <Label>Notas</Label>
            <textarea
              className="w-full rounded-md border bg-transparent px-3 py-2 text-sm min-h-[80px]"
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder="Describir la discrepancia..."
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={handleSubmit} disabled={pending}>
              {pending ? 'Guardando...' : 'Confirmar'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
