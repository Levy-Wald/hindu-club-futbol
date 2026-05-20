import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Building2, Users, ArrowRight } from 'lucide-react'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { DEFAULT_TENANT_ID } from '@/lib/tenant'

export default async function SCLDashboard() {
  const supabase = createServiceRoleClient()

  const { count: tenantCount } = await supabase
    .from('tenants')
    .select('*', { count: 'exact', head: true })

  const { count: personasCount } = await supabase
    .from('personas')
    .select('*', { count: 'exact', head: true })
    .is('deleted_at', null)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Panel Admin SCL</h1>
        <p className="text-sm text-muted-foreground">
          Vista global de la plataforma ClubCore
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Tenants
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{tenantCount ?? 1}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4" />
              Personas totales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{personasCount ?? 0}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Acceso rapido</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Link href={`/admin/${DEFAULT_TENANT_ID}`}>
            <Button variant="outline" className="w-full justify-between">
              Entrar como Hindu Club
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/admin/scl/tenants">
            <Button variant="outline" className="w-full justify-between">
              Ver todos los tenants
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
