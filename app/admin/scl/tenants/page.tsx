import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowRight } from 'lucide-react'
import { createServiceRoleClient } from '@/lib/supabase/service-role'

export default async function TenantsPage() {
  const supabase = createServiceRoleClient()

  const { data: tenants } = await supabase
    .from('tenants')
    .select('id, nombre, slug, plan_slug, activo, created_at')
    .order('created_at', { ascending: true })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Tenants</h1>
          <p className="text-sm text-muted-foreground">
            {tenants?.length ?? 0} tenant(s) registrados
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {(tenants ?? []).map((t) => (
          <Card key={t.id}>
            <CardContent className="flex items-center justify-between py-4">
              <div className="space-y-1">
                <p className="font-medium">{t.nombre ?? t.slug ?? t.id}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="font-mono">{t.id}</span>
                  {t.plan_slug && <Badge variant="outline">{t.plan_slug}</Badge>}
                  <Badge variant={t.activo !== false ? 'default' : 'secondary'}>
                    {t.activo !== false ? 'activo' : 'inactivo'}
                  </Badge>
                </div>
              </div>
              <Link href={`/admin/${t.id}`}>
                <Button variant="ghost" size="sm">
                  Entrar
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        ))}

        {(!tenants || tenants.length === 0) && (
          <p className="text-center text-muted-foreground py-8">
            No hay tenants registrados
          </p>
        )}
      </div>
    </div>
  )
}
