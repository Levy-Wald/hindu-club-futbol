import Link from 'next/link'
import { rechazarInvitacionAction } from '@/modules/eventos/lib/actions'
import { redirect } from 'next/navigation'
import { createServiceRoleClient } from '@/lib/supabase/service-role'

export default async function RechazarInvitacionPage(props: {
  params: Promise<{ id: string; token: string }>
}) {
  const { id: eventoId, token } = await props.params

  const supabase = createServiceRoleClient()
  const { data: evento } = await supabase
    .from('eventos')
    .select('titulo, tenant_id')
    .eq('id', eventoId)
    .maybeSingle()

  const result = await rechazarInvitacionAction(token)

  if (result.ok) {
    redirect(`/admin/${evento?.tenant_id ?? 'hindu'}/calendario?evento_rechazado=${eventoId}`)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="max-w-md w-full mx-auto p-8">
        <div className="bg-white rounded-lg shadow-sm border p-6 text-center space-y-4">
          <h1 className="text-xl font-bold">Invitacion a evento</h1>
          {evento && (
            <p className="text-muted-foreground">{evento.titulo}</p>
          )}
          <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
            {result.error}
          </div>
          <Link href="/" className="text-sm text-primary hover:underline">
            Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  )
}
