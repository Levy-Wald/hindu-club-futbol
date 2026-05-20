import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { TENANT_ID } from '@/lib/tenant'
import { obtenerPermisosComunicaciones } from '@/modules/comunicaciones/lib/plantillas/permisos'
import { EnvioMasivoWizard } from '@/modules/comunicaciones/ui/envio-masivo-wizard'

export default async function NuevoEnvioMasivoPage() {
  const permisos = await obtenerPermisosComunicaciones()
  if (!permisos.puede_enviar_masivo) redirect('/admin/comunicaciones')

  const supabase = await createClient()

  const [plantillasRes, equiposRes] = await Promise.all([
    supabase
      .from('com_plantillas')
      .select('slug, nombre, tipo')
      .eq('tenant_id', TENANT_ID)
      .eq('activa', true)
      .is('deleted_at', null)
      .order('nombre'),
    supabase
      .from('equipos')
      .select('id, nombre')
      .eq('tenant_id', TENANT_ID)
      .eq('activo', true)
      .is('deleted_at', null)
      .order('nombre'),
  ])

  return (
    <EnvioMasivoWizard
      plantillas={plantillasRes.data ?? []}
      equipos={equiposRes.data ?? []}
    />
  )
}
