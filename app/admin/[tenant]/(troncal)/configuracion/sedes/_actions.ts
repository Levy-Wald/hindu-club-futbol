'use server'

import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { TENANT_ID } from '@/lib/tenant'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const sedeSchema = z.object({
  nombre: z.string().min(1, 'Nombre requerido').max(200),
  slug: z.string().min(1).max(100),
  direccion_calle: z.string().max(200).optional(),
  direccion_numero: z.string().max(20).optional(),
  direccion_ciudad: z.string().max(100).optional(),
})

async function getAuthPersona() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: persona } = await supabase
    .from('personas')
    .select('id, tenant_id')
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .maybeSingle()
  return persona
}

export async function crearSedeAction(input: {
  nombre: string
  slug: string
  direccion_calle?: string
  direccion_numero?: string
  direccion_ciudad?: string
}): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const persona = await getAuthPersona()
  if (!persona) return { ok: false, error: 'No autenticado' }

  const parsed = sedeSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message }

  const tenant_id = persona.tenant_id ?? TENANT_ID
  const supabase = createServiceRoleClient()

  const direccion: Record<string, string> = {}
  if (parsed.data.direccion_calle) direccion.calle = parsed.data.direccion_calle
  if (parsed.data.direccion_numero) direccion.numero = parsed.data.direccion_numero
  if (parsed.data.direccion_ciudad) direccion.ciudad = parsed.data.direccion_ciudad

  const { data, error } = await supabase
    .from('sedes')
    .insert({
      tenant_id,
      nombre: parsed.data.nombre,
      slug: parsed.data.slug,
      direccion: Object.keys(direccion).length > 0 ? direccion : null,
    })
    .select('id')
    .single()

  if (error || !data) return { ok: false, error: error?.message ?? 'Error creando sede' }

  revalidatePath('/admin/configuracion/sedes')
  return { ok: true, id: data.id }
}

export async function editarSedeAction(input: {
  id: string
  nombre: string
  slug: string
  direccion_calle?: string
  direccion_numero?: string
  direccion_ciudad?: string
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const persona = await getAuthPersona()
  if (!persona) return { ok: false, error: 'No autenticado' }

  const parsed = sedeSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message }

  const tenant_id = persona.tenant_id ?? TENANT_ID
  const supabase = createServiceRoleClient()

  const direccion: Record<string, string> = {}
  if (parsed.data.direccion_calle) direccion.calle = parsed.data.direccion_calle
  if (parsed.data.direccion_numero) direccion.numero = parsed.data.direccion_numero
  if (parsed.data.direccion_ciudad) direccion.ciudad = parsed.data.direccion_ciudad

  const { error } = await supabase
    .from('sedes')
    .update({
      nombre: parsed.data.nombre,
      slug: parsed.data.slug,
      direccion: Object.keys(direccion).length > 0 ? direccion : null,
    })
    .eq('id', input.id)
    .eq('tenant_id', tenant_id)

  if (error) return { ok: false, error: error.message }

  revalidatePath('/admin/configuracion/sedes')
  return { ok: true }
}
