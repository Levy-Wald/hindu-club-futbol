import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Mail, Phone, IdCard, Cake, Users } from 'lucide-react'
import { getCurrentPersonaId } from '@/lib/permissions/capabilities'
import { fetchMiPerfil } from './_lib/queries'

function tipoLabel(slug: string): string {
  return slug.replace(/_/g, ' ')
}

export default async function PortalPerfilPage() {
  const personaId = await getCurrentPersonaId()
  const { perfil, familia } = personaId
    ? await fetchMiPerfil(personaId)
    : { perfil: null, familia: [] }

  if (!perfil) {
    return (
      <div className="space-y-4">
        <h1 className="text-lg font-bold">Mi perfil</h1>
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            No encontramos tu perfil asociado a este usuario.
          </CardContent>
        </Card>
      </div>
    )
  }

  const iniciales = `${perfil.nombre?.[0] ?? ''}${perfil.apellido?.[0] ?? ''}`.toUpperCase()
  const datos = [
    { icon: IdCard, label: 'Documento', value: perfil.numero_documento },
    { icon: Mail, label: 'Email', value: perfil.email_principal },
    { icon: Phone, label: 'Teléfono', value: perfil.telefono_principal },
    {
      icon: Cake,
      label: 'Nacimiento',
      value: perfil.fecha_nacimiento ? new Date(perfil.fecha_nacimiento).toLocaleDateString('es-AR') : null,
    },
  ].filter((d) => d.value)

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-bold">Mi perfil</h1>

      {/* Identidad */}
      <Card>
        <CardContent className="p-4 flex items-center gap-3">
          <Avatar className="h-14 w-14">
            {perfil.foto_perfil_url && <AvatarImage src={perfil.foto_perfil_url} alt="" />}
            <AvatarFallback>{iniciales || '?'}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="text-lg font-bold truncate">{perfil.nombre} {perfil.apellido}</p>
            {perfil.numero_documento && <p className="text-sm text-muted-foreground">DNI {perfil.numero_documento}</p>}
          </div>
        </CardContent>
      </Card>

      {/* Datos de contacto */}
      {datos.length > 0 && (
        <Card>
          <CardContent className="p-0 divide-y">
            {datos.map((d) => {
              const Icon = d.icon
              return (
                <div key={d.label} className="flex items-center gap-3 p-3">
                  <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-sm text-muted-foreground flex-1">{d.label}</span>
                  <span className="text-sm font-medium text-right truncate">{d.value}</span>
                </div>
              )
            })}
          </CardContent>
        </Card>
      )}

      {/* Familia / dependientes */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground px-1 flex items-center gap-1">
          <Users className="h-4 w-4" /> Mi familia
        </p>
        {familia.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              No tenés vínculos familiares cargados.
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0 divide-y">
              {familia.map((v) => (
                <div key={v.id} className="flex items-center gap-3 p-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {v.persona ? `${v.persona.nombre} ${v.persona.apellido}` : '—'}
                    </p>
                  </div>
                  <Badge variant="outline" className="capitalize shrink-0">{tipoLabel(v.tipo)}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>

      <p className="text-xs text-muted-foreground px-1">
        La edición de datos desde el portal llega en una próxima actualización.
      </p>
    </div>
  )
}
