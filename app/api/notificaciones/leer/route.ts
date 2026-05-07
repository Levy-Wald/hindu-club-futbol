import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

const TENANT_ID = '11111111-1111-1111-1111-111111111111'

interface LeerBody {
  mensaje_id?: string
  todos?: boolean
  persona_id?: string
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as LeerBody
  const supabase = await createClient()
  const ahora = new Date().toISOString()

  if (body.todos && body.persona_id) {
    const { error } = await supabase
      .from('com_mensajes')
      .update({ leido_at: ahora })
      .eq('tenant_id', TENANT_ID)
      .eq('destinatario_persona_id', body.persona_id)
      .is('leido_at', null)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  }

  if (body.mensaje_id) {
    const { error } = await supabase
      .from('com_mensajes')
      .update({ leido_at: ahora })
      .eq('id', body.mensaje_id)
      .eq('tenant_id', TENANT_ID)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  }

  return NextResponse.json(
    { error: 'Debe enviar mensaje_id o { todos: true, persona_id }' },
    { status: 400 }
  )
}
