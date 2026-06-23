import { listarMisNotificaciones } from '@/modules/notificaciones/lib/actions'
import { NotifList } from './_components/notif-list'

export default async function PortalNotificacionesPage() {
  const { rows } = await listarMisNotificaciones({ estado: 'todas', pageSize: 50 })

  const initial = (rows as Array<Record<string, unknown>>).map((r) => ({
    id: r.id as string,
    titulo: (r.titulo as string) ?? '',
    mensaje: (r.mensaje as string | null) ?? null,
    prioridad: (r.prioridad as string | null) ?? null,
    leida_at: (r.leida_at as string | null) ?? null,
    created_at: r.created_at as string,
  }))

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-bold">Notificaciones</h1>
      <NotifList initial={initial} />
    </div>
  )
}
