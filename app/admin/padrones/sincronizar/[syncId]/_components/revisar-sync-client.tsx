'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, UserPlus, UserMinus, RefreshCw, CheckCircle2, XCircle, AlertTriangle,
  RotateCcw, Loader2, ChevronDown, ChevronRight,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { aplicarSync, rollbackSync } from '../../_actions'

interface SyncRecord {
  id: string
  padron_id: string
  archivo_origen: string
  estado: string
  total_filas_archivo: number
  altas_count: number
  bajas_count: number
  cambios_count: number
  sin_cambios_count: number
  rechazados_count: number
  fecha_sync: string
  error_mensaje: string | null
}

interface DiffRecord {
  id: string
  sync_id: string
  persona_id: string | null
  tipo_cambio: string
  dni_archivo: string | null
  nombre_archivo: string | null
  numero_socio_archivo: string | null
  categoria_archivo: string | null
  actividad_archivo: string | null
  datos_antes: Record<string, unknown> | null
  datos_despues: Record<string, unknown> | null
  motivo_rechazo: string | null
  aplicado: boolean
  notas: string | null
}

interface Props {
  sync: SyncRecord
  diffs: DiffRecord[]
}

export function RevisarSyncClient({ sync, diffs }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const altas = useMemo(() => diffs.filter((d) => d.tipo_cambio === 'alta'), [diffs])
  const bajas = useMemo(() => diffs.filter((d) => d.tipo_cambio === 'baja'), [diffs])
  const cambios = useMemo(() => diffs.filter((d) => d.tipo_cambio === 'modificacion'), [diffs])
  const rechazados = useMemo(() => diffs.filter((d) => d.tipo_cambio === 'rechazado'), [diffs])
  const sinCambios = useMemo(() => diffs.filter((d) => d.tipo_cambio === 'sin_cambios'), [diffs])

  const puedeAplicar = sync.estado === 'preview' || sync.estado === 'revisado'
  const puedeRollback = sync.estado === 'aplicado'

  async function handleAplicar() {
    if (!confirm(`Aplicar esta sincronización? Se van a crear ${sync.altas_count} personas, dar de baja ${sync.bajas_count} y modificar ${sync.cambios_count}.`)) return

    setLoading(true)
    const result = await aplicarSync(sync.id)
    setLoading(false)

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success(`Sync aplicada: ${result.aplicados} cambios aplicados`)
      router.refresh()
    }
  }

  async function handleRollback() {
    if (!confirm('Revertir TODOS los cambios de esta sincronización?')) return

    setLoading(true)
    const result = await rollbackSync(sync.id)
    setLoading(false)

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success(`Rollback completado: ${result.revertidos} cambios revertidos`)
      router.refresh()
    }
  }

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin/padrones/sincronizar">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-semibold">{sync.archivo_origen}</h1>
            <p className="text-sm text-muted-foreground">
              {new Date(sync.fecha_sync).toLocaleDateString('es-AR')} — {sync.total_filas_archivo} filas
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <EstadoBadge estado={sync.estado} />
          {puedeAplicar && (
            <Button onClick={handleAplicar} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
              Aplicar sync
            </Button>
          )}
          {puedeRollback && (
            <Button variant="destructive" onClick={handleRollback} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RotateCcw className="h-4 w-4 mr-2" />}
              Rollback
            </Button>
          )}
        </div>
      </div>

      {sync.error_mensaje && (
        <div className="flex items-center gap-2 p-3 rounded-md border border-destructive/50 bg-destructive/5 text-sm">
          <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
          {sync.error_mensaje}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <StatCard label="Altas" count={sync.altas_count} icon={<UserPlus className="h-4 w-4" />} color="text-green-600" />
        <StatCard label="Bajas" count={sync.bajas_count} icon={<UserMinus className="h-4 w-4" />} color="text-red-600" />
        <StatCard label="Cambios" count={sync.cambios_count} icon={<RefreshCw className="h-4 w-4" />} color="text-yellow-600" />
        <StatCard label="Sin cambios" count={sync.sin_cambios_count} icon={<CheckCircle2 className="h-4 w-4" />} color="text-muted-foreground" />
        <StatCard label="Rechazados" count={sync.rechazados_count} icon={<XCircle className="h-4 w-4" />} color="text-orange-600" />
      </div>

      {/* Tabs */}
      <Tabs defaultValue={altas.length > 0 ? 'altas' : cambios.length > 0 ? 'cambios' : 'sin_cambios'}>
        <TabsList>
          <TabsTrigger value="altas">Altas ({altas.length})</TabsTrigger>
          <TabsTrigger value="bajas">Bajas ({bajas.length})</TabsTrigger>
          <TabsTrigger value="cambios">Cambios ({cambios.length})</TabsTrigger>
          <TabsTrigger value="rechazados">Rechazados ({rechazados.length})</TabsTrigger>
          <TabsTrigger value="sin_cambios">Sin cambios ({sinCambios.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="altas">
          <DiffTable diffs={altas} tipo="alta" />
        </TabsContent>
        <TabsContent value="bajas">
          <DiffTable diffs={bajas} tipo="baja" />
        </TabsContent>
        <TabsContent value="cambios">
          <DiffTable diffs={cambios} tipo="modificacion" />
        </TabsContent>
        <TabsContent value="rechazados">
          <DiffTable diffs={rechazados} tipo="rechazado" />
        </TabsContent>
        <TabsContent value="sin_cambios">
          <DiffTable diffs={sinCambios} tipo="sin_cambios" />
        </TabsContent>
      </Tabs>
    </>
  )
}

function StatCard({ label, count, icon, color }: { label: string; count: number; icon: React.ReactNode; color: string }) {
  return (
    <Card>
      <CardContent className="pt-4 pb-3 px-4">
        <div className={`flex items-center gap-1.5 ${color}`}>
          {icon}
          <span className="text-2xl font-bold">{count}</span>
        </div>
        <p className="text-xs text-muted-foreground mt-1">{label}</p>
      </CardContent>
    </Card>
  )
}

function EstadoBadge({ estado }: { estado: string }) {
  switch (estado) {
    case 'preview': return <Badge variant="secondary">Preview — revisar antes de aplicar</Badge>
    case 'aplicado': return <Badge variant="default">Aplicado</Badge>
    case 'rollback': return <Badge variant="destructive">Rollback</Badge>
    case 'fallado': return <Badge variant="destructive">Fallado</Badge>
    default: return <Badge variant="outline">{estado}</Badge>
  }
}

function DiffTable({ diffs, tipo }: { diffs: DiffRecord[]; tipo: string }) {
  if (diffs.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          No hay registros en esta categoría
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="p-0">
        <div className="max-h-[500px] overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>DNI</TableHead>
                <TableHead>Nro. Socio</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead>Actividad</TableHead>
                {tipo === 'modificacion' && <TableHead>Cambios</TableHead>}
                {tipo === 'rechazado' && <TableHead>Motivo</TableHead>}
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {diffs.map((d) => (
                <TableRow key={d.id}>
                  <TableCell className="font-medium text-sm">
                    {d.persona_id ? (
                      <Link href={`/admin/personas/${d.persona_id}`} className="hover:underline">
                        {d.nombre_archivo}
                      </Link>
                    ) : (
                      d.nombre_archivo
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{d.dni_archivo ?? '-'}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{d.numero_socio_archivo ?? '-'}</TableCell>
                  <TableCell className="text-xs">{d.categoria_archivo ?? '-'}</TableCell>
                  <TableCell className="text-xs">{d.actividad_archivo ?? '-'}</TableCell>
                  {tipo === 'modificacion' && (
                    <TableCell>
                      <DiffDetail antes={d.datos_antes} despues={d.datos_despues} />
                    </TableCell>
                  )}
                  {tipo === 'rechazado' && (
                    <TableCell className="text-xs text-destructive">{d.motivo_rechazo}</TableCell>
                  )}
                  <TableCell>
                    {d.aplicado ? (
                      <Badge variant="default" className="text-[10px]">Aplicado</Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px]">Pendiente</Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}

function DiffDetail({ antes, despues }: { antes: Record<string, unknown> | null; despues: Record<string, unknown> | null }) {
  if (!despues) return <span className="text-xs text-muted-foreground">-</span>

  const campos = Object.keys(despues)
  return (
    <div className="space-y-0.5">
      {campos.map((campo) => (
        <div key={campo} className="text-[11px]">
          <span className="font-medium">{campo}:</span>{' '}
          <span className="text-red-500 line-through">{String(antes?.[campo] ?? '∅')}</span>{' → '}
          <span className="text-green-600">{String(despues[campo])}</span>
        </div>
      ))}
    </div>
  )
}
