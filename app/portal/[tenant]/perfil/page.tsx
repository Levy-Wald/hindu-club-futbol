import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Users2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { TENANT_ID } from '@/lib/tenant'
import { fetchMiPersonaCompleta } from '@/app/admin/[tenant]/(troncal)/mi-perfil/_lib/queries'
import { fetchMiEquipo } from '@/app/admin/[tenant]/(troncal)/mi-equipo/_lib/queries'
import { TarjetaJugadorMiPerfil } from '@/app/admin/[tenant]/(troncal)/mi-perfil/_components/tarjeta-mi-perfil'
import { MiFicha } from './_components/mi-ficha'

function capitalizar(s: string): string {
  return s.replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase())
}

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

      <MiFamilia persona={persona as Record<string, unknown>} />

      <OtrosDatos persona={persona as Record<string, unknown>} />
    </div>
  )
}

// Vínculos familiares (origen + destino) en una sola lista.
function MiFamilia({ persona }: { persona: Record<string, unknown> }) {
  const origen = (persona.personas_vinculos_origen as Array<{ tipo_vinculo_slug: string; activo: boolean; destino: { nombre: string; apellido: string } | null }> | null) ?? []
  const destino = (persona.personas_vinculos_destino as Array<{ tipo_vinculo_slug: string; activo: boolean; origen: { nombre: string; apellido: string } | null }> | null) ?? []

  const familia = [
    ...origen.filter((v) => v.activo !== false && v.destino).map((v) => ({
      tipo: v.tipo_vinculo_slug, nombre: `${v.destino!.nombre} ${v.destino!.apellido}`,
    })),
    ...destino.filter((v) => v.activo !== false && v.origen).map((v) => ({
      tipo: v.tipo_vinculo_slug, nombre: `${v.origen!.nombre} ${v.origen!.apellido}`,
    })),
  ]

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <p className="text-sm font-semibold flex items-center gap-2">
          <Users2 className="h-4 w-4 text-primary" /> Mi familia
        </p>
        {familia.length === 0 ? (
          <p className="text-sm text-muted-foreground">No tenés vínculos familiares cargados.</p>
        ) : (
          <div className="divide-y -my-1">
            {familia.map((f, i) => (
              <div key={i} className="flex items-center justify-between gap-2 py-2">
                <span className="text-sm">{f.nombre}</span>
                <Badge variant="outline" className="capitalize text-[10px]">{capitalizar(f.tipo)}</Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Atributos dinámicos (obra social, alergias, etc.) en read-only para ver todo.
function OtrosDatos({ persona }: { persona: Record<string, unknown> }) {
  const atributos = ((persona.personas_atributos as Array<{ atributo_slug: string; valor: unknown; activo: boolean }> | null) ?? [])
    .filter((a) => a.activo !== false && a.valor != null && String(a.valor).trim() !== '')

  if (atributos.length === 0) return null

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <p className="text-sm font-semibold">Otros datos</p>
        <p className="text-xs text-muted-foreground -mt-2">
          Cargados por el club. Para corregirlos, pedí el cambio a administración.
        </p>
        <div className="grid grid-cols-2 gap-3">
          {atributos.map((a, i) => (
            <div key={i} className="min-w-0">
              <p className="text-xs text-muted-foreground capitalize">{capitalizar(a.atributo_slug)}</p>
              <p className="text-sm truncate">{String(a.valor)}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
