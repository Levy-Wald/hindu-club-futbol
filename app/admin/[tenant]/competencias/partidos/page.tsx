import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { TENANT_ID } from '@/lib/tenant'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Trophy } from 'lucide-react'

export default async function PartidosListPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const service = createServiceRoleClient()

  const { data: eventos } = await service
    .from('eventos')
    .select('id, titulo, fecha, hora_inicio, equipo_id, tipo')
    .eq('tenant_id', TENANT_ID)
    .in('tipo', ['partido', 'amistoso'])
    .order('fecha', { ascending: false })
    .limit(50)

  return (
    <div className="space-y-6">
      <h1 className="text-xl sm:text-2xl font-bold">Partidos</h1>

      {!eventos || eventos.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Trophy className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">No hay partidos registrados</p>
            <p className="text-sm text-muted-foreground mt-1">
              Los partidos se crean desde competencias o desde el planificador semanal.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {eventos.map((ev) => (
            <Link key={ev.id} href={`/admin/competencias/partidos/${ev.id}`}>
              <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <Trophy className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div>
                      <p className="font-medium text-sm">{ev.titulo}</p>
                      <p className="text-xs text-muted-foreground">
                        {ev.fecha || 'Sin fecha'}
                        {ev.hora_inicio ? ` - ${ev.hora_inicio}` : ''}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {ev.tipo === 'amistoso' ? 'Amistoso' : 'Oficial'}
                  </Badge>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
