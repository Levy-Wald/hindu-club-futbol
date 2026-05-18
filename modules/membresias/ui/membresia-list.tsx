'use client'

import { useState, useEffect, useTransition } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'
import {
  CreditCard,
  Loader2,
  MoreHorizontal,
  Pause,
  Play,
  XCircle,
  Plus,
  Users,
  DollarSign,
  TrendingUp,
  UserMinus,
} from 'lucide-react'
import Link from 'next/link'
import {
  fetchMembresiasCompletas,
  fetchMembresiasStats,
  fetchEquiposActivos,
} from '../lib/queries'
import { fetchPlanesActivos } from '@/modules/finanzas/lib/suscripciones'
import { darBajaMembresia, suspenderMembresia, reactivarMembresia } from '../lib/actions'
import { TIPOS_SUSCRIPCION } from '../lib/schema'
import { AltaWizard } from './alta-wizard'

const ESTADO_BADGE: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
  activa: { variant: 'default', label: 'Activa' },
  suspendida: { variant: 'secondary', label: 'Suspendida' },
  cancelada: { variant: 'destructive', label: 'Cancelada' },
  vencida: { variant: 'outline', label: 'Vencida' },
}

export function MembresiaList() {
  const [membresias, setMembresias] = useState<any[]>([])
  const [stats, setStats] = useState({ activas: 0, suspendidas: 0, canceladas: 0, total: 0, ingresoMensual: 0, altasUltimoMes: 0 })
  const [planes, setPlanes] = useState<any[]>([])
  const [equipos, setEquipos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filtroTipo, setFiltroTipo] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('')
  const [filtroEquipo, setFiltroEquipo] = useState('')
  const [wizardOpen, setWizardOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  async function loadData() {
    const [subs, st, pl, eq] = await Promise.all([
      fetchMembresiasCompletas({
        tipo: filtroTipo || undefined,
        estado: filtroEstado || undefined,
        equipo_id: filtroEquipo || undefined,
      }),
      fetchMembresiasStats(),
      fetchPlanesActivos(),
      fetchEquiposActivos(),
    ])
    setMembresias(subs)
    setStats(st)
    setPlanes(pl)
    setEquipos(eq)
    setLoading(false)
  }

  useEffect(() => {
    setLoading(true)
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtroTipo, filtroEstado, filtroEquipo])

  function handleAction(action: 'baja' | 'suspender' | 'reactivar', id: string) {
    startTransition(async () => {
      let result
      if (action === 'baja') {
        const motivo = prompt('Motivo de baja (opcional):')
        result = await darBajaMembresia(id, motivo ?? undefined)
      } else if (action === 'suspender') {
        result = await suspenderMembresia(id)
      } else {
        result = await reactivarMembresia(id)
      }
      if (result.ok) {
        toast.success(action === 'baja' ? 'Baja registrada' : action === 'suspender' ? 'Suspendida' : 'Reactivada')
        loadData()
      } else {
        toast.error(result.error ?? 'Error')
      }
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Membresías</h1>
          <p className="text-sm text-muted-foreground">Socios, abonos y suscripciones del club</p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/membresias/dashboard">
            <Button variant="outline" size="sm">Dashboard</Button>
          </Link>
          <Button size="sm" onClick={() => setWizardOpen(true)}>
            <Plus className="h-4 w-4 mr-1" /> Nueva alta
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Activas" value={stats.activas} />
        <StatCard icon={DollarSign} label="Ingreso mensual" value={`$${stats.ingresoMensual.toLocaleString('es-AR')}`} />
        <StatCard icon={TrendingUp} label="Altas (30d)" value={stats.altasUltimoMes} />
        <StatCard icon={UserMinus} label="Canceladas" value={stats.canceladas} />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Select value={filtroTipo} onValueChange={v => setFiltroTipo(!v || v === 'todos' ? '' : v)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Todos los tipos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los tipos</SelectItem>
            {TIPOS_SUSCRIPCION.map(t => (
              <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filtroEstado} onValueChange={v => setFiltroEstado(!v || v === 'todos' ? '' : v)}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Todos los estados" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los estados</SelectItem>
            <SelectItem value="activa">Activa</SelectItem>
            <SelectItem value="suspendida">Suspendida</SelectItem>
            <SelectItem value="cancelada">Cancelada</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filtroEquipo} onValueChange={v => setFiltroEquipo(!v || v === 'todos' ? '' : v)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Todos los equipos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los equipos</SelectItem>
            {equipos.map((e: any) => (
              <SelectItem key={e.id} value={e.id}>{e.nombre}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : membresias.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <CreditCard className="mx-auto h-8 w-8 mb-2 opacity-50" />
            <p>No se encontraron membresías</p>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Persona</TableHead>
                <TableHead className="hidden sm:table-cell">Plan</TableHead>
                <TableHead className="hidden md:table-cell">Tipo</TableHead>
                <TableHead className="hidden lg:table-cell">Equipo</TableHead>
                <TableHead className="text-right">Monto</TableHead>
                <TableHead className="hidden md:table-cell">Alta</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {membresias.map((s: any) => {
                const persona = Array.isArray(s.persona) ? s.persona[0] : s.persona
                const plan = Array.isArray(s.plan) ? s.plan[0] : s.plan
                const equipo = Array.isArray(s.equipo) ? s.equipo[0] : s.equipo
                const badge = ESTADO_BADGE[s.estado] ?? { variant: 'outline' as const, label: s.estado }
                const monto = s.monto_pactado ?? plan?.monto ?? 0

                return (
                  <TableRow key={s.id}>
                    <TableCell>
                      {persona ? (
                        <Link href={`/admin/personas/${persona.id}`} className="font-medium text-sm hover:underline">
                          {persona.apellido}, {persona.nombre}
                        </Link>
                      ) : '—'}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-sm">{plan?.nombre ?? '—'}</TableCell>
                    <TableCell className="hidden md:table-cell text-sm capitalize">{s.tipo}</TableCell>
                    <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">{equipo?.nombre ?? '—'}</TableCell>
                    <TableCell className="text-right text-sm font-mono">
                      {monto > 0 ? `$${monto.toLocaleString('es-AR')}` : '—'}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                      {new Date(s.fecha_alta + 'T00:00:00').toLocaleDateString('es-AR')}
                    </TableCell>
                    <TableCell>
                      <Badge variant={badge.variant}>{badge.label}</Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="h-8 w-8" disabled={isPending} />}>
                          <MoreHorizontal className="h-4 w-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {persona && (
                            <DropdownMenuItem render={<Link href={`/admin/personas/${persona.id}`} />}>
                              Ver persona
                            </DropdownMenuItem>
                          )}
                          {s.estado === 'activa' && (
                            <>
                              <DropdownMenuItem onClick={() => handleAction('suspender', s.id)}>
                                <Pause className="mr-2 h-4 w-4" /> Suspender
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-destructive" onClick={() => handleAction('baja', s.id)}>
                                <XCircle className="mr-2 h-4 w-4" /> Dar de baja
                              </DropdownMenuItem>
                            </>
                          )}
                          {s.estado === 'suspendida' && (
                            <>
                              <DropdownMenuItem onClick={() => handleAction('reactivar', s.id)}>
                                <Play className="mr-2 h-4 w-4" /> Reactivar
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-destructive" onClick={() => handleAction('baja', s.id)}>
                                <XCircle className="mr-2 h-4 w-4" /> Dar de baja
                              </DropdownMenuItem>
                            </>
                          )}
                          {s.estado === 'cancelada' && (
                            <DropdownMenuItem onClick={() => handleAction('reactivar', s.id)}>
                              <Play className="mr-2 h-4 w-4" /> Reactivar
                            </DropdownMenuItem>
                          )}
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

      <AltaWizard
        open={wizardOpen}
        onClose={() => setWizardOpen(false)}
        planes={planes}
        equipos={equipos}
        onSuccess={loadData}
      />
    </div>
  )
}

function StatCard({ icon: Icon, label, value }: {
  icon: React.ComponentType<{ className?: string }>; label: string; value: number | string
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <Icon className="h-5 w-5 text-muted-foreground" />
        <div>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  )
}
