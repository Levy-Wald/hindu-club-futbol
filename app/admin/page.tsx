import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Users, Shield, ClipboardList, Building2, Plus, ArrowRight } from 'lucide-react'
import Link from 'next/link'

const TENANT_ID = '11111111-1111-1111-1111-111111111111'

export default async function AdminDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Stats queries
  const [personasRes, equiposRes, padronesRes, entidadesRes, recentRes] = await Promise.all([
    supabase
      .from('personas')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', TENANT_ID)
      .is('deleted_at', null),
    supabase
      .from('equipos')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', TENANT_ID)
      .eq('activo', true),
    supabase
      .from('padrones')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', TENANT_ID)
      .eq('activo', true),
    supabase
      .from('entidades')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', TENANT_ID)
      .eq('activo', true),
    supabase
      .from('personas')
      .select('nombre, apellido, created_at')
      .eq('tenant_id', TENANT_ID)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  const stats = [
    { label: 'Personas activas', count: personasRes.count ?? 0, icon: Users },
    { label: 'Equipos activos', count: equiposRes.count ?? 0, icon: Shield },
    { label: 'Padrones', count: padronesRes.count ?? 0, icon: ClipboardList },
    { label: 'Entidades', count: entidadesRes.count ?? 0, icon: Building2 },
  ]

  const recentPersonas = recentRes.data ?? []

  const nombre = user?.email?.split('@')[0] || 'usuario'
  const hoy = new Date().toLocaleDateString('es-AR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Bienvenido, {nombre}</CardTitle>
          <p className="text-sm text-muted-foreground capitalize">{hoy}</p>
        </CardHeader>
      </Card>

      {/* Quick stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => {
          const Icon = s.icon
          return (
            <Card key={s.label}>
              <CardContent className="flex items-center gap-3 p-4">
                <div className="rounded-md bg-primary/10 p-2">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{s.count}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Quick actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Acciones rapidas</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Link
            href="/admin/personas"
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Nueva persona
          </Link>
          <Link
            href="/admin/equipos"
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Nuevo equipo
          </Link>
          <Link
            href="/admin/padrones"
            className="inline-flex items-center gap-2 rounded-md border px-4 py-2 text-sm font-medium hover:bg-accent transition-colors"
          >
            <ArrowRight className="h-4 w-4" />
            Ver padrones
          </Link>
        </CardContent>
      </Card>

      {/* Recent activity */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Actividad reciente</CardTitle>
        </CardHeader>
        <CardContent>
          {recentPersonas.length === 0 ? (
            <p className="text-sm text-muted-foreground">No hay personas registradas aun.</p>
          ) : (
            <ul className="space-y-3">
              {recentPersonas.map((p, i) => (
                <li key={i} className="flex items-center justify-between text-sm">
                  <span className="font-medium">
                    {p.nombre} {p.apellido}
                  </span>
                  <Badge variant="secondary" className="text-xs font-normal">
                    {new Date(p.created_at).toLocaleDateString('es-AR', {
                      day: '2-digit',
                      month: 'short',
                    })}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
