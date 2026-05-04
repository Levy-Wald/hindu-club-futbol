import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft } from 'lucide-react'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function HistorialPage({ params }: PageProps) {
  const { id } = await params

  const supabase = await createClient()

  const { data: persona, error: personaError } = await supabase
    .from('personas')
    .select('id, nombre, apellido')
    .eq('id', id)
    .single()

  if (personaError || !persona) notFound()

  const { data: logs, error: logsError } = await supabase
    .from('audit_log')
    .select('id, accion, tabla, cambios, created_at, actor_user_id')
    .eq('registro_id', id)
    .order('created_at', { ascending: false })
    .limit(50)

  if (logsError) throw logsError

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/admin/personas/${id}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Historial</h1>
          <p className="text-sm text-muted-foreground">
            {persona.apellido}, {persona.nombre}
          </p>
        </div>
      </div>

      {(!logs || logs.length === 0) ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Sin registros en el historial de auditoría.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {logs.map((log) => (
            <Card key={log.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Badge variant={log.accion === 'INSERT' ? 'default' : log.accion === 'DELETE' ? 'destructive' : 'secondary'}>
                      {log.accion}
                    </Badge>
                    <span className="text-muted-foreground">{log.tabla}</span>
                  </CardTitle>
                  <span className="text-xs text-muted-foreground">
                    {new Date(log.created_at).toLocaleString('es-AR')}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <pre className="text-xs bg-muted p-2 rounded overflow-x-auto max-h-40">
                  {JSON.stringify(log.cambios, null, 2)}
                </pre>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
