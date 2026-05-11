import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Shield, Star, Users } from 'lucide-react'

interface Persona {
  id: string
  nombre: string
  apellido: string
  numero_documento: string | null
  email_principal: string | null
}

interface Miembro {
  id: string
  persona_id: string
  rol_equipo_slug: string
  dorsal: number | null
  posicion: string | null
  fecha_inicio: string | null
  activo: boolean
  personas: Persona | null
}

interface Rol {
  slug: string
  nombre: string
  categoria: string
}

interface EquipoComposicionProps {
  miembros: Miembro[]
  roles: Rol[]
}

export function EquipoComposicion({ miembros, roles }: EquipoComposicionProps) {
  const dt = miembros.find((m) => m.rol_equipo_slug === 'dt')
  const capitan = miembros.find((m) => m.rol_equipo_slug === 'capitan')
  const subcapitan = miembros.find((m) => m.rol_equipo_slug === 'subcapitan')
  const delegados = miembros.filter((m) => m.rol_equipo_slug === 'delegado')
  const cuerpoTecnico = miembros.filter((m) => {
    const rol = roles.find((r) => r.slug === m.rol_equipo_slug)
    return rol?.categoria === 'staff' && m.rol_equipo_slug !== 'delegado'
  })

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
        Composición del equipo
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* DT */}
        <RolCard
          icon={<Shield className="h-4 w-4" />}
          label="Director Técnico"
          persona={dt?.personas ?? null}
          personaId={dt?.persona_id}
          empty="Sin DT asignado"
        />

        {/* Capitán */}
        <RolCard
          icon={<Star className="h-4 w-4" />}
          label="Capitán"
          persona={capitan?.personas ?? null}
          personaId={capitan?.persona_id}
          empty="Sin capitán asignado"
        />

        {/* Subcapitán */}
        <RolCard
          icon={<Star className="h-4 w-4 opacity-50" />}
          label="Subcapitán"
          persona={subcapitan?.personas ?? null}
          personaId={subcapitan?.persona_id}
          empty="Sin subcapitán"
        />

        {/* Delegados */}
        <div className="rounded-lg border p-3 space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>Delegados</span>
            <Badge variant="secondary" className="ml-auto text-xs">{delegados.length}</Badge>
          </div>
          {delegados.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin delegados</p>
          ) : (
            <div className="space-y-1">
              {delegados.map((d) => (
                <PersonaLink key={d.id} persona={d.personas} personaId={d.persona_id} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Cuerpo Técnico */}
      {cuerpoTecnico.length > 0 && (
        <div className="rounded-lg border p-3 space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Shield className="h-4 w-4" />
            <span>Cuerpo Técnico</span>
            <Badge variant="secondary" className="ml-auto text-xs">{cuerpoTecnico.length}</Badge>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {cuerpoTecnico.map((m) => {
              const rol = roles.find((r) => r.slug === m.rol_equipo_slug)
              return (
                <div key={m.id} className="flex items-center gap-2 text-sm">
                  <Badge variant="outline" className="text-xs shrink-0">{rol?.nombre ?? m.rol_equipo_slug}</Badge>
                  <PersonaLink persona={m.personas} personaId={m.persona_id} />
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

function RolCard({
  icon,
  label,
  persona,
  personaId,
  empty,
}: {
  icon: React.ReactNode
  label: string
  persona: Persona | null
  personaId?: string
  empty: string
}) {
  return (
    <div className="rounded-lg border p-3 space-y-1">
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        {icon}
        <span>{label}</span>
      </div>
      {persona ? (
        <div>
          <Link
            href={`/admin/personas/${personaId}`}
            className="text-sm font-medium hover:underline"
          >
            {persona.apellido}, {persona.nombre}
          </Link>
          {persona.email_principal && (
            <p className="text-xs text-muted-foreground">{persona.email_principal}</p>
          )}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">{empty}</p>
      )}
    </div>
  )
}

function PersonaLink({ persona, personaId }: { persona: Persona | null; personaId: string }) {
  if (!persona) return <span className="text-sm text-muted-foreground">{personaId}</span>
  return (
    <Link
      href={`/admin/personas/${persona.id}`}
      className="text-sm hover:underline truncate"
    >
      {persona.apellido}, {persona.nombre}
    </Link>
  )
}
