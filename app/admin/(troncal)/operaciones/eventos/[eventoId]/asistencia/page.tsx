import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { TENANT_ID } from '@/lib/tenant'
import { obtenerInvitadosDeEvento, obtenerEventoParaAsistencia } from '@/modules/asistencias/lib/queries'
import { verificarPermisoTomarAsistencia } from '@/modules/asistencias/lib/permisos'
import { AsistenciaWrapper } from './asistencia-wrapper'

type Props = {
  params: Promise<{ eventoId: string }>
}

export default async function AsistenciaPage({ params }: Props) {
  const { eventoId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: persona } = await supabase
    .from('personas')
    .select('id, tenant_id')
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .maybeSingle()

  if (!persona) redirect('/admin')

  const tenant_id = persona.tenant_id ?? TENANT_ID

  // Verificar permiso
  const tienePermiso = await verificarPermisoTomarAsistencia(
    persona.id,
    tenant_id,
    eventoId
  )

  if (!tienePermiso) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-neutral-500 text-sm">No tenés permiso para tomar asistencia en este evento.</p>
      </div>
    )
  }

  // Cargar datos
  const [eventoInfo, invitados] = await Promise.all([
    obtenerEventoParaAsistencia(eventoId, tenant_id),
    obtenerInvitadosDeEvento(eventoId, tenant_id),
  ])

  return (
    <AsistenciaWrapper
      eventoId={eventoId}
      tenantId={tenant_id}
      initialData={invitados}
      eventoInfo={{
        titulo: eventoInfo.titulo,
        fecha: eventoInfo.fecha,
        tipo_evento_slug: eventoInfo.tipo_evento_slug,
        equipo_nombre: eventoInfo.equipo_nombre,
      }}
    />
  )
}
