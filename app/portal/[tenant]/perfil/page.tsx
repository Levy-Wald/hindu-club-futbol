import { Card, CardContent } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/server'
import { TENANT_ID } from '@/lib/tenant'
import { fetchMiPersonaCompleta } from '@/app/admin/[tenant]/(troncal)/mi-perfil/_lib/queries'
import { fetchMiEquipo } from '@/app/admin/[tenant]/(troncal)/mi-equipo/_lib/queries'
import { TarjetaJugadorMiPerfil } from '@/app/admin/[tenant]/(troncal)/mi-perfil/_components/tarjeta-mi-perfil'
import { MiFicha } from './_components/mi-ficha'

export default async function PortalPerfilPage() {
  const persona = await fetchMiPersonaCompleta()

  if (!persona) {
    return (
      <div className="space-y-4">
        <h1 className="text-lg font-bold">Mi perfil</h1>
        <Card><CardContent className="py-12 text-center text-sm text-muted-foreground">
          No encontramos tu perfil asociado a este usuario.
        </CardContent></Card>
      </div>
    )
  }

  const [miEquipo, branding] = await Promise.all([
    fetchMiEquipo(),
    (async () => {
      const supabase = await createClient()
      const { data } = await supabase
        .from('tenant_config_publica')
        .select('logo_url, nombre_display, color_primario, color_secundario')
        .eq('tenant_id', TENANT_ID)
        .maybeSingle()
      return data
    })(),
  ])

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-bold">Mi perfil</h1>

      {miEquipo ? (
        <div className="flex justify-center">
          <TarjetaJugadorMiPerfil
            persona={persona}
            asignaciones={miEquipo.asignaciones as never[]}
            tenant={branding ? {
              logo_url: branding.logo_url,
              nombre_display: branding.nombre_display,
              color_primario: branding.color_primario,
              color_secundario: branding.color_secundario,
            } : undefined}
          />
        </div>
      ) : null}

      <p className="text-xs text-muted-foreground px-1">
        Completá los campos vacíos y guardá. Los datos de identidad ya cargados
        (nombre, DNI, etc.) se cambian con <b>“Solicitar cambio”</b>.
      </p>

      <MiFicha persona={persona as Record<string, unknown>} />
    </div>
  )
}
