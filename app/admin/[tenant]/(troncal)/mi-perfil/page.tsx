import { redirect } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { PersonaAvatar } from '../personas/_components/persona-avatar'
import { PersonaEditor } from '../personas/[id]/_components/persona-editor'
import { fetchCatalogoAtributos, fetchCatalogoVinculos, fetchPadrones, fetchEstadosPadron, fetchTiposSocio, fetchCategoriasEquipo } from '../personas/_lib/queries'
import { fetchMiPersonaCompleta } from './_lib/queries'
import { fetchMiEquipo } from '../mi-equipo/_lib/queries'
import { TarjetaJugadorMiPerfil } from './_components/tarjeta-mi-perfil'
import { createClient } from '@/lib/supabase/server'
import { TENANT_ID } from '@/lib/tenant'

export default async function MiPerfilPage() {
  const persona = await fetchMiPersonaCompleta()

  if (!persona) {
    redirect('/login')
  }

  const [catalogoAtributos, catalogoVinculos, padrones, estadosPadron, tiposSocio, categoriasEquipo, miEquipo, tenantBranding] = await Promise.all([
    fetchCatalogoAtributos(),
    fetchCatalogoVinculos(),
    fetchPadrones(),
    fetchEstadosPadron(),
    fetchTiposSocio(),
    fetchCategoriasEquipo(),
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
      {/* HEADER */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 -mx-4 px-4 sm:px-6 py-3 border-b -mt-4">
        <div className="flex items-center gap-2 sm:gap-3">
          <PersonaAvatar nombre={persona.nombre} apellido={persona.apellido} className="h-9 w-9 shrink-0" />
          <div className="min-w-0 flex-1">
            <h1 className="text-sm sm:text-base font-bold truncate">
              Mi perfil
            </h1>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="truncate">{persona.apellido}, {persona.nombre}</span>
              <Badge variant="default" className="text-[10px] h-4 shrink-0">
                {persona.estado}
              </Badge>
            </div>
          </div>
          {miEquipo ? (
            <TarjetaJugadorMiPerfil
              persona={persona}
              asignaciones={miEquipo.asignaciones as never[]}
              tenant={tenantBranding ? {
                logo_url: tenantBranding.logo_url,
                nombre_display: tenantBranding.nombre_display,
                color_primario: tenantBranding.color_primario,
                color_secundario: tenantBranding.color_secundario,
              } : undefined}
            />
          ) : null}
        </div>
      </div>

      <PersonaEditor
        persona={persona}
        catalogoAtributos={catalogoAtributos}
        catalogoVinculos={catalogoVinculos}
        padronesDisponibles={padrones}
        estadosPadron={estadosPadron}
        tiposSocio={tiposSocio}
        categoriasEquipo={categoriasEquipo}
        modo="mi-perfil"
      />
    </div>
  )
}
