'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

// F3 — Portal Cliente. El socio edita SOLO sus datos de contacto (no identidad:
// nombre/DNI no son self-editables). Self-scoped por user_id.
function formatResult(ok: boolean, message: string) {
  return { ok, message }
}

export async function editarMiContacto(input: {
  email_principal?: string
  telefono_principal?: string
  whatsapp?: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return formatResult(false, 'No autenticado')

  const { data: persona } = await supabase
    .from('personas')
    .select('id')
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .maybeSingle()
  if (!persona) return formatResult(false, 'Persona no encontrada')

  const clean = {
    email_principal: input.email_principal?.trim() || null,
    telefono_principal: input.telefono_principal?.trim() || null,
    whatsapp: input.whatsapp?.trim() || null,
  }

  const { error } = await supabase.from('personas').update(clean).eq('id', persona.id)
  if (error) return formatResult(false, error.message)

  revalidatePath('/portal', 'layout')
  return formatResult(true, 'Datos de contacto actualizados')
}
