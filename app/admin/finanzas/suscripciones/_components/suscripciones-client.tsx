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
  Users,
  DollarSign,
} from 'lucide-react'
import Link from 'next/link'
import {
  fetchSuscripciones,
  fetchSuscripcionesStats,
  fetchPlanesActivos,
  cancelarSuscripcion,
  suspenderSuscripcion,
  reactivarSuscripcion,
} from '../_actions'

interface Suscripcion {
  id: string
  estado: string
  fecha_alta: string
  fecha_baja: string | null
  monto_pactado: number | null
  origen: string
  persona: { id: string; nombre: string; apellido: string; numero_documento: string | null; email_principal: string | null } | null
  plan: { id: string; nombre: string; monto: number; periodicidad: string; moneda: string } | null
}

interface Stats {
  activas: number
  suspendidas: number
  canceladas: number
  vencidas: number
  total: number
}

interface Plan {
  id: string
  nombre: string
}

const ESTADO_BADGE: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
  activa: { variant: 'default', label: 'Activa' },
  suspendida: { variant: 'secondary', label: 'Suspendida' },
  cancelada: { variant: 'destructive', label: 'Cancelada' },
  vencida: { variant: 'outline', label: 'Vencida' },
}

export function SuscripcionesClient() {
  const [suscripciones, setSuscripciones] = useState<Suscripcion[]>([])
  const [stats, setStats] = useState<Stats>({ activas: 0, suspendidas: 0, canceladas: 0, vencidas: 0, total: 0 })
  const [planes, setPlanes] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [filtroPlan, setFiltroPlan] = useState<string>('')
  const [filtroEstado, setFiltroEstado] = useState<string>('')
  const [isPending, startTransition] = useTransition()

  async function loadData() {
    const [subs, st, pl] = await Promise.all([
      fetchSuscripciones({
        plan_id: filtroPlan || undefined,
        estado: filtroEstado || undefined,
      }),
      fetchSuscripcionesStats(),
      fetchPlanesActivos(),
    ])
    setSuscripciones(subs as Suscripcion[])
    setStats(st)
    setPlanes(pl)
    setLoading(false)
  }

  useEffect(() => {
    setLoading(true)
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtroPlan, filtroEstado])

  function handleAction(action: 'cancelar' | 'suspender' | 'reactivar', id: string) {
    startTransition(async () => {
      let result
      if (action === 'cancelar') {
        const motivo = prompt('Motivo de cancelación (opcional):')
        result = await cancelarSuscripcion(id, motivo ?? undefined)
      } else if (action === 'suspender') {
        result = await suspenderSuscripcion(id)
      } else {
        result = await reactivarSuscripcion(id)
      }
      if (result.success) {
        toast.success(action === 'cancelar' ? 'Cancelada' : action === 'suspender' ? 'Suspendida' : 'Reactivada')
        loadData()
      } else {
        toast.error(result.error ?? 'Error')
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Suscripciones</h1>
        <p className="text-muted-foreground text-sm">Personas suscriptas a planes de cuotas recurrentes</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Activas" value={stats.activas} color="text-success-600 dark:text-success-400" />
        <StatCard icon={Pause} label="Suspendidas" value={stats.suspendidas} color="text-warning-600 dark:text-warning-400" />
        <StatCard icon={XCircle} label="Canceladas" value={stats.canceladas} color="text-error-600 dark:text-error-400" />
        <StatCard icon={DollarSign} label="Total" value={stats.total} color="text-brand-600 dark:text-brand-400" />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Select value={filtroPlan} onValueChange={(v) => setFiltroPlan(v ?? '')}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Todos los planes" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todos los planes</SelectItem>
            {planes.map((p) => (
              <SelectItem key={p.id} value={p.id}>{p.nombre}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filtroEstado} onValueChange={(v) => setFiltroEstado(v ?? '')}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Todos los estados" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todos los estados</SelectItem>
            <SelectItem value="activa">Activa</SelectItem>
            <SelectItem value="suspendida">Suspendida</SelectItem>
            <SelectItem value="cancelada">Cancelada</SelectItem>
            <SelectItem value="vencida">Vencida</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : suscripciones.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <CreditCard className="mx-auto h-8 w-8 mb-2 opacity-50" />
            <p>No se encontraron suscripciones</p>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Persona</TableHead>
                <TableHead className="hidden sm:table-cell">Plan</TableHead>
                <TableHead className="text-right">Monto</TableHead>
                <TableHead className="hidden md:table-cell">Alta</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {suscripciones.map((s) => {
                const persona = Array.isArray(s.persona) ? s.persona[0] : s.persona
                const plan = Array.isArray(s.plan) ? s.plan[0] : s.plan
                const badge = ESTADO_BADGE[s.estado] ?? { variant: 'outline' as const, label: s.estado }
                const monto = s.monto_pactado ?? plan?.monto ?? 0

                return (
                  <TableRow key={s.id}>
                    <TableCell>
                      {persona ? (
                        <div>
                          <Link
                            href={`/admin/personas/${persona.id}`}
                            className="font-medium text-sm hover:underline"
                          >
                            {persona.apellido}, {persona.nombre}
                          </Link>
                          {persona.numero_documento && (
                            <p className="text-xs text-muted-foreground">DNI {persona.numero_documento}</p>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-sm">
                      {plan?.nombre ?? '—'}
                    </TableCell>
                    <TableCell className="text-right text-sm font-mono">
                      {monto > 0
                        ? `$${monto.toLocaleString('es-AR')}`
                        : <span className="text-muted-foreground">—</span>
                      }
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
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => handleAction('cancelar', s.id)}
                              >
                                <XCircle className="mr-2 h-4 w-4" /> Cancelar
                              </DropdownMenuItem>
                            </>
                          )}
                          {s.estado === 'suspendida' && (
                            <>
                              <DropdownMenuItem onClick={() => handleAction('reactivar', s.id)}>
                                <Play className="mr-2 h-4 w-4" /> Reactivar
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => handleAction('cancelar', s.id)}
                              >
                                <XCircle className="mr-2 h-4 w-4" /> Cancelar
                              </DropdownMenuItem>
                            </>
                          )}
                          {(s.estado === 'cancelada' || s.estado === 'vencida') && (
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
    </div>
  )
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: number
  color: string
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <Icon className={`h-5 w-5 ${color}`} />
        <div>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  )
}
