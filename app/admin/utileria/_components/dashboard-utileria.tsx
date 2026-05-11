'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import {
  Loader2, Package, ClipboardList, AlertTriangle, DollarSign,
  Plus, CheckCircle, Truck, RotateCcw, ArrowRight,
} from 'lucide-react'
import type { PermisosUtileria } from '@/lib/permisos/utileria'
import { obtenerDashboardMiga } from '../_actions'

type DashData = Awaited<ReturnType<typeof obtenerDashboardMiga>>

export function DashboardUtileria({ permisos }: { permisos: PermisosUtileria }) {
  const [data, setData] = useState<DashData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (permisos.es_staff_utileria) {
      obtenerDashboardMiga()
        .then(setData)
        .catch(() => toast.error('Error cargando dashboard'))
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [permisos.es_staff_utileria])

  if (!permisos.es_staff_utileria) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Utileria</h1>
        <p className="text-muted-foreground">Vista de responsable de equipo</p>
        <div className="flex gap-2">
          <Button render={<Link href="/admin/utileria/solicitudes" />}>Mis Solicitudes</Button>
          <Button variant="outline" render={<Link href="/admin/utileria/kits" />}>Kits</Button>
        </div>
      </div>
    )
  }

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin" /></div>
  }

  if (!data) return null

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Utileria — Dashboard</h1>
          <p className="text-sm text-muted-foreground">Panel del vestuarista</p>
        </div>
        <div className="flex gap-2">
          <Button render={<Link href="/admin/utileria/inventario" />}><Plus className="h-4 w-4 mr-1" /> Inventario</Button>
          <Button variant="outline" render={<Link href="/admin/utileria/solicitudes" />}>Solicitudes</Button>
          <Button variant="outline" render={<Link href="/admin/utileria/cargos" />}>Cargos</Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Package className="h-8 w-8 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">{data.stats.totalItems}</p>
                <p className="text-sm text-muted-foreground">Items en inventario</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <ClipboardList className="h-8 w-8 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">{data.stats.solicitudesAbiertas}</p>
                <p className="text-sm text-muted-foreground">Solicitudes abiertas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <DollarSign className="h-8 w-8 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">{data.stats.cargosPendientes}</p>
                <p className="text-sm text-muted-foreground">Cargos pendientes</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Pendientes de preparar */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <ClipboardList className="h-4 w-4" /> Pendientes de preparar ({data.pendientes.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.pendientes.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">Sin solicitudes pendientes</p>
            ) : (
              <div className="space-y-2">
                {data.pendientes.map((s: Record<string, unknown>) => {
                  const equipo = s.equipos as Record<string, unknown> | Record<string, unknown>[] | null
                  const equipoNombre = Array.isArray(equipo) ? (equipo[0] as Record<string, unknown>)?.nombre : (equipo as Record<string, unknown>)?.nombre
                  return (
                    <Link key={s.id as string} href={`/admin/utileria/solicitudes`}
                      className="flex items-center justify-between p-2 rounded hover:bg-muted/50">
                      <div>
                        <p className="text-sm font-medium">{s.descripcion_evento as string}</p>
                        <p className="text-xs text-muted-foreground">{equipoNombre as string} — {new Date(s.fecha_evento as string).toLocaleDateString('es-AR')}</p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </Link>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Preparadas esperando retiro */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Truck className="h-4 w-4" /> Esperando retiro ({data.preparadas.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.preparadas.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">Nada esperando retiro</p>
            ) : (
              <div className="space-y-2">
                {data.preparadas.map((s: Record<string, unknown>) => {
                  const equipo = s.equipos as Record<string, unknown> | Record<string, unknown>[] | null
                  const equipoNombre = Array.isArray(equipo) ? (equipo[0] as Record<string, unknown>)?.nombre : (equipo as Record<string, unknown>)?.nombre
                  return (
                    <div key={s.id as string} className="flex items-center justify-between p-2 rounded hover:bg-muted/50">
                      <div>
                        <p className="text-sm font-medium">{s.descripcion_evento as string}</p>
                        <p className="text-xs text-muted-foreground">{equipoNombre as string}</p>
                      </div>
                      <Badge variant="secondary">Preparada</Badge>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Devoluciones vencidas */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-4 w-4" /> Devoluciones vencidas ({data.vencidas.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.vencidas.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">Sin devoluciones vencidas</p>
            ) : (
              <div className="space-y-2">
                {data.vencidas.map((s: Record<string, unknown>) => {
                  const equipo = s.equipos as Record<string, unknown> | Record<string, unknown>[] | null
                  const equipoNombre = Array.isArray(equipo) ? (equipo[0] as Record<string, unknown>)?.nombre : (equipo as Record<string, unknown>)?.nombre
                  return (
                    <div key={s.id as string} className="flex items-center justify-between p-2 rounded hover:bg-muted/50">
                      <div>
                        <p className="text-sm font-medium">{s.descripcion_evento as string}</p>
                        <p className="text-xs text-muted-foreground">{equipoNombre as string} — Venció {new Date(s.fecha_devolucion_esperada as string).toLocaleDateString('es-AR')}</p>
                      </div>
                      <Badge variant="destructive">Vencida</Badge>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stock bajo */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Package className="h-4 w-4" /> Stock bajo ({data.stockBajo.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.stockBajo.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">Stock OK</p>
            ) : (
              <div className="space-y-2">
                {data.stockBajo.map((item: Record<string, unknown>) => (
                  <div key={item.id as string} className="flex items-center justify-between p-2">
                    <span className="text-sm">{item.nombre as string}</span>
                    <Badge variant={item.cantidad_disponible === 0 ? 'destructive' : 'secondary'}>
                      {item.cantidad_disponible as number}/{item.cantidad_total as number}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
