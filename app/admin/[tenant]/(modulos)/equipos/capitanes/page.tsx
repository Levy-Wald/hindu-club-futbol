import Link from 'next/link'
import { fetchCapitanesPorEquipo } from '@/modules/equipos/lib/queries'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ArrowLeft, Mail, Phone, Shield, ShieldAlert, UserX } from 'lucide-react'

export default async function CapitanesPage() {
  const equipos = await fetchCapitanesPorEquipo()

  const conCapitanes = equipos.filter((e) => e.capitanes.length > 0)
  const sinCapitanes = equipos.filter((e) => e.capitanes.length === 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/admin/equipos">
          <Button variant="ghost" size="icon" className="shrink-0">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Capitanes</h1>
          <p className="text-sm text-muted-foreground">
            {conCapitanes.length} equipos con capitanes asignados
            {sinCapitanes.length > 0 && ` / ${sinCapitanes.length} sin capitanes`}
          </p>
        </div>
      </div>

      {/* Equipos con capitanes */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {conCapitanes.map((equipo) => (
          <Card key={equipo.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                {equipo.escudo_url ? (
                  <img
                    src={equipo.escudo_url}
                    alt={equipo.nombre}
                    className="h-8 w-8 rounded object-contain"
                  />
                ) : (
                  <div
                    className="h-8 w-8 rounded flex items-center justify-center text-xs font-bold text-white"
                    style={{ backgroundColor: equipo.color_principal ?? '#6b7280' }}
                  >
                    {equipo.nombre.charAt(0)}
                  </div>
                )}
                <div className="min-w-0">
                  <CardTitle className="text-base">
                    <Link
                      href={`/admin/equipos/${equipo.id}`}
                      className="hover:underline"
                    >
                      {equipo.nombre}
                    </Link>
                  </CardTitle>
                  <p className="text-xs text-muted-foreground capitalize">
                    {equipo.disciplina_slug.replace(/_/g, ' ')}
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {equipo.capitanes
                .sort((a, b) =>
                  a.rol_equipo_slug === 'capitan' ? -1 : b.rol_equipo_slug === 'capitan' ? 1 : 0
                )
                .map((cap) => (
                  <div
                    key={cap.persona_id}
                    className="flex items-start gap-3 rounded-md border p-3"
                  >
                    <Avatar className="h-10 w-10 shrink-0">
                      {cap.foto_perfil_url ? (
                        <AvatarImage src={cap.foto_perfil_url} />
                      ) : null}
                      <AvatarFallback className="text-xs">
                        {cap.nombre.charAt(0)}
                        {cap.apellido.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Link
                          href={`/admin/personas/${cap.persona_id}`}
                          className="font-medium text-sm hover:underline truncate"
                        >
                          {cap.apellido}, {cap.nombre}
                        </Link>
                        <Badge
                          variant={
                            cap.rol_equipo_slug === 'capitan'
                              ? 'default'
                              : 'secondary'
                          }
                          className="shrink-0"
                        >
                          {cap.rol_equipo_slug === 'capitan' ? (
                            <Shield className="h-3 w-3 mr-1" />
                          ) : (
                            <ShieldAlert className="h-3 w-3 mr-1" />
                          )}
                          {cap.rol_equipo_slug === 'capitan'
                            ? 'Capitan'
                            : 'Sub-capitan'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        {cap.whatsapp && (
                          <a
                            href={`https://wa.me/${cap.whatsapp.replace(/\D/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 hover:text-foreground"
                          >
                            <Phone className="h-3 w-3" />
                            {cap.whatsapp}
                          </a>
                        )}
                        {cap.email_principal && (
                          <a
                            href={`mailto:${cap.email_principal}`}
                            className="flex items-center gap-1 hover:text-foreground truncate"
                          >
                            <Mail className="h-3 w-3 shrink-0" />
                            <span className="truncate">{cap.email_principal}</span>
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Equipos sin capitanes */}
      {sinCapitanes.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-muted-foreground">
            Sin capitan asignado
          </h2>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {sinCapitanes.map((equipo) => (
              <Card key={equipo.id} className="border-dashed">
                <CardContent className="flex items-center gap-3 py-4">
                  <div
                    className="h-8 w-8 rounded flex items-center justify-center text-xs font-bold text-white shrink-0"
                    style={{
                      backgroundColor: equipo.color_principal ?? '#6b7280',
                    }}
                  >
                    {equipo.nombre.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/admin/equipos/${equipo.id}`}
                      className="font-medium text-sm hover:underline"
                    >
                      {equipo.nombre}
                    </Link>
                    <p className="text-xs text-muted-foreground capitalize">
                      {equipo.disciplina_slug.replace(/_/g, ' ')}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <UserX className="h-4 w-4" />
                    <span className="hidden sm:inline">Sin capitan asignado</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
