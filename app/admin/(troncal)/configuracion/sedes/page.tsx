import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { TENANT_ID } from '@/lib/tenant'
import { Badge } from '@/components/ui/badge'
import { MapPin, ChevronRight } from 'lucide-react'
import { SedeFormDialog } from './_components/sede-form-dialog'

export default async function SedesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const service = createServiceRoleClient()

  const { data: sedes } = await service
    .from('sedes')
    .select('*')
    .eq('tenant_id', TENANT_ID)
    .is('deleted_at', null)
    .order('nombre')

  const sedeIds = (sedes ?? []).map(s => s.id)
  let espaciosCounts: Record<string, number> = {}

  if (sedeIds.length > 0) {
    const { data: counts } = await service
      .from('espacios')
      .select('sede_id')
      .eq('tenant_id', TENANT_ID)
      .is('deleted_at', null)
      .in('sede_id', sedeIds)

    espaciosCounts = (counts ?? []).reduce((acc, e) => {
      acc[e.sede_id] = (acc[e.sede_id] || 0) + 1
      return acc
    }, {} as Record<string, number>)
  }

  return (
    <div className="container mx-auto p-4 max-w-5xl" data-testid="pantalla-sedes">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Sedes</h1>
          <p className="text-sm text-muted-foreground">Lugares fisicos del tenant</p>
        </div>
        <SedeFormDialog mode="create" />
      </div>

      {(!sedes || sedes.length === 0) ? (
        <div className="text-center py-12 text-muted-foreground">
          <MapPin className="h-12 w-12 mx-auto mb-4 opacity-30" />
          <p>No hay sedes configuradas.</p>
          <p className="text-sm">Crea tu primera sede para empezar.</p>
        </div>
      ) : (
        <div className="border rounded-lg divide-y">
          {sedes.map((sede) => {
            const count = espaciosCounts[sede.id] || 0
            const direccion = sede.direccion as Record<string, string> | null
            const dirStr = direccion?.calle
              ? `${direccion.calle} ${direccion.numero ?? ''}, ${direccion.ciudad ?? ''}`
              : null

            return (
              <Link
                key={sede.id}
                href={`/admin/configuracion/sedes/${sede.id}`}
                className="flex items-center justify-between p-4 hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <MapPin className="h-5 w-5 text-muted-foreground shrink-0" />
                  <div className="min-w-0">
                    <span className="font-medium text-sm">{sede.nombre}</span>
                    {dirStr && (
                      <p className="text-xs text-muted-foreground truncate">{dirStr}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <Badge variant="secondary">{count} espacio{count !== 1 ? 's' : ''}</Badge>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
