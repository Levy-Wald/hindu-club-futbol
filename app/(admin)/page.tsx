import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface ConteoTabla {
  nombre: string
  conteo: number
}

export default async function AdminDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Conteos de tablas seeded
  const conteos: ConteoTabla[] = []

  const tablas = [
    'tenants',
    'personas',
    'catalogo_atributos',
    'catalogo_vinculos',
    'catalogo_roles_equipo',
    'catalogo_modulos',
    'tenant_modulos',
    'entidades',
    'sedes',
    'padrones',
  ] as const

  for (const tabla of tablas) {
    const { count } = await supabase
      .from(tabla)
      .select('*', { count: 'exact', head: true })
    conteos.push({ nombre: tabla, conteo: count ?? 0 })
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>
            Hola {user?.email?.split('@')[0] || 'usuario'}
          </CardTitle>
          <CardDescription>
            Sprint 1 completo. Próximo: ABM Personas (Sprint 2).
          </CardDescription>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Estado de la base de datos</CardTitle>
          <CardDescription>
            Tablas creadas y conteo de filas del seed inicial
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {conteos.map((t) => (
              <div
                key={t.nombre}
                className="flex items-center justify-between rounded-md border p-3"
              >
                <span className="text-sm font-medium">{t.nombre}</span>
                <Badge variant={t.conteo > 0 ? 'default' : 'secondary'}>
                  {t.conteo}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
