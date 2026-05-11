'use client'

import { useState, useEffect, useTransition } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { Bell, Loader2, Archive, CheckCheck, ExternalLink } from 'lucide-react'
import {
  listarMisNotificaciones,
  marcarComoLeida,
  marcarTodasComoLeidas,
  archivarNotificacion,
  archivarTodasLeidas,
} from '../_actions'

type Estado = 'no_leidas' | 'todas' | 'archivadas'

interface Notif {
  id: string
  tipo_slug: string
  titulo: string
  mensaje: string
  link_accion: string | null
  prioridad: string
  leida_at: string | null
  archivada_at: string | null
  created_at: string
  catalogo_tipos_notificacion: {
    nombre: string
    icono: string | null
    color: string | null
    categoria: string
  } | null
}

const PRIORIDAD_BADGE: Record<string, 'default' | 'secondary' | 'destructive'> = {
  baja: 'secondary',
  media: 'default',
  alta: 'destructive',
  critica: 'destructive',
}

function tiempoRelativo(fecha: string): string {
  const diff = Date.now() - new Date(fecha).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'ahora'
  if (mins < 60) return `hace ${mins} min`
  const horas = Math.floor(mins / 60)
  if (horas < 24) return `hace ${horas}h`
  const dias = Math.floor(horas / 24)
  if (dias < 7) return `hace ${dias}d`
  return new Date(fecha).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })
}

export function NotificacionesClient() {
  const [estado, setEstado] = useState<Estado>('no_leidas')
  const [prioridadFiltro, setPrioridadFiltro] = useState('')
  const [notifs, setNotifs] = useState<Notif[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [isPending, startTransition] = useTransition()

  const cargar = async () => {
    setLoading(true)
    try {
      const res = await listarMisNotificaciones({
        estado,
        prioridad: prioridadFiltro || undefined,
        page,
        pageSize: 50,
      })
      setNotifs(res.rows as unknown as Notif[])
      setTotal(res.total)
    } catch {
      toast.error('Error cargando notificaciones')
    }
    setLoading(false)
  }

  useEffect(() => { cargar() }, [estado, prioridadFiltro, page])

  const handleMarcarLeida = (id: string) => {
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, leida_at: new Date().toISOString() } : n))
    startTransition(async () => {
      const res = await marcarComoLeida(id)
      if (!res.ok) toast.error('Error')
    })
  }

  const handleArchivar = (id: string) => {
    setNotifs(prev => prev.filter(n => n.id !== id))
    startTransition(async () => {
      const res = await archivarNotificacion(id)
      if (!res.ok) toast.error('Error')
    })
  }

  const handleMarcarTodas = () => {
    startTransition(async () => {
      const res = await marcarTodasComoLeidas()
      if (res.ok) {
        toast.success(`${res.cant} marcadas como leidas`)
        cargar()
      }
    })
  }

  const handleArchivarLeidas = () => {
    startTransition(async () => {
      const res = await archivarTodasLeidas()
      if (res.ok) {
        toast.success(`${res.cant} archivadas`)
        cargar()
      }
    })
  }

  const noLeidas = notifs.filter(n => !n.leida_at).length
  const totalPages = Math.ceil(total / 50)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold sm:text-2xl">Notificaciones</h1>
          <p className="text-sm text-muted-foreground">
            {total} notificaciones {estado === 'no_leidas' ? 'sin leer' : estado === 'archivadas' ? 'archivadas' : 'en total'}
          </p>
        </div>
        <div className="flex gap-2">
          {estado !== 'archivadas' && noLeidas > 0 && (
            <Button variant="outline" size="sm" onClick={handleMarcarTodas} disabled={isPending}>
              <CheckCheck className="h-4 w-4 mr-1" /> Marcar todas leidas
            </Button>
          )}
          {estado === 'todas' && (
            <Button variant="outline" size="sm" onClick={handleArchivarLeidas} disabled={isPending}>
              <Archive className="h-4 w-4 mr-1" /> Archivar leidas
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Tabs value={estado} onValueChange={v => { setEstado(v as Estado); setPage(1) }}>
          <TabsList>
            <TabsTrigger value="no_leidas">No leidas</TabsTrigger>
            <TabsTrigger value="todas">Todas</TabsTrigger>
            <TabsTrigger value="archivadas">Archivadas</TabsTrigger>
          </TabsList>
        </Tabs>
        <Select value={prioridadFiltro} onValueChange={v => { setPrioridadFiltro(v ?? ''); setPage(1) }}>
          <SelectTrigger className="w-[150px]"><SelectValue placeholder="Prioridad" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todas</SelectItem>
            <SelectItem value="critica">Critica</SelectItem>
            <SelectItem value="alta">Alta</SelectItem>
            <SelectItem value="media">Media</SelectItem>
            <SelectItem value="baja">Baja</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>
      ) : notifs.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-12">
            <Bell className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">
              {estado === 'no_leidas'
                ? 'No tenes notificaciones sin leer'
                : estado === 'archivadas'
                ? 'No hay notificaciones archivadas'
                : 'No hay notificaciones'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {notifs.map(n => {
            const tipo = n.catalogo_tipos_notificacion as unknown as Notif['catalogo_tipos_notificacion']
            return (
              <Card
                key={n.id}
                className={`transition-colors hover:bg-muted/50 ${!n.leida_at ? 'border-l-2 border-l-primary bg-primary/5' : ''}`}
              >
                <CardContent className="flex items-start gap-3 p-4">
                  <div className={`mt-1 h-2 w-2 shrink-0 rounded-full ${
                    n.prioridad === 'critica' ? 'bg-destructive' :
                    n.prioridad === 'alta' ? 'bg-warning' :
                    !n.leida_at ? 'bg-primary' : 'bg-transparent'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={`text-sm ${!n.leida_at ? 'font-semibold' : 'font-medium'}`}>
                        {n.titulo}
                      </p>
                      {n.prioridad === 'critica' && <Badge variant="destructive" className="text-[10px]">Critica</Badge>}
                      {n.prioridad === 'alta' && <Badge variant="destructive" className="text-[10px]">Alta</Badge>}
                      {tipo && (
                        <span className="text-[10px] text-muted-foreground capitalize">{tipo.categoria}</span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">{n.mensaje}</p>
                    <p className="text-[11px] text-muted-foreground mt-1">{tiempoRelativo(n.created_at)}</p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    {n.link_accion && (
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => window.location.href = n.link_accion!}>
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    {!n.leida_at && (
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleMarcarLeida(n.id)} title="Marcar leida">
                        <CheckCheck className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    {!n.archivada_at && (
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleArchivar(n.id)} title="Archivar">
                        <Archive className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 pt-4">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Anterior</Button>
          <span className="text-sm text-muted-foreground py-1">Página {page} de {totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Siguiente</Button>
        </div>
      )}
    </div>
  )
}
