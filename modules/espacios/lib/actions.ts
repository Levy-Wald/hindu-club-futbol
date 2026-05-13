'use server'

import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { TENANT_ID } from '@/lib/tenant'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { canAdminEspacios } from './permisos'
import type { TipoEspacioSlug } from './tipos'

const espacioSchema = z.object({
  sede_id: z.string().uuid(),
  nombre: z.string().min(1).max(200),
  tipo_slug: z.string().min(1),
  descripcion: z.string().max(500).optional(),
  capacidad_personas: z.number().int().positive().optional(),
  dimensiones_m2: z.number().positive().optional(),
})

async function getPersona() {
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

export async function crearEspacioAction(input: {
  sede_id: string
  nombre: string
  tipo_slug: TipoEspacioSlug
  descripcion?: string
  capacidad_personas?: number
  dimensiones_m2?: number
}): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const persona = await getPersona()
  if (!persona) return { ok: false, error: 'No autenticado' }

  const puede = await canAdminEspacios(persona.id)
  if (!puede) return { ok: false, error: 'Sin permiso' }

  const parsed = espacioSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message }

  const tenant_id = persona.tenant_id ?? TENANT_ID
  const supabase = createServiceRoleClient()

  const { data, error } = await supabase
    .from('espacios')
    .insert({
      tenant_id,
      sede_id: parsed.data.sede_id,
      nombre: parsed.data.nombre,
      tipo_slug: parsed.data.tipo_slug,
      descripcion: parsed.data.descripcion ?? null,
      capacidad_personas: parsed.data.capacidad_personas ?? null,
      dimensiones_m2: parsed.data.dimensiones_m2 ?? null,
    })
    .select('id')
    .single()

  if (error || !data) return { ok: false, error: error?.message ?? 'Error creando espacio' }

  revalidatePath('/admin/configuracion')
  return { ok: true, id: data.id }
}

export async function editarEspacioAction(input: {
  id: string
  sede_id: string
  nombre: string
  tipo_slug: TipoEspacioSlug
  descripcion?: string
  capacidad_personas?: number
  dimensiones_m2?: number
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const persona = await getPersona()
  if (!persona) return { ok: false, error: 'No autenticado' }

  const puede = await canAdminEspacios(persona.id)
  if (!puede) return { ok: false, error: 'Sin permiso' }

  const parsed = espacioSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message }

  const tenant_id = persona.tenant_id ?? TENANT_ID
  const supabase = createServiceRoleClient()

  const { error } = await supabase
    .from('espacios')
    .update({
      sede_id: parsed.data.sede_id,
      nombre: parsed.data.nombre,
      tipo_slug: parsed.data.tipo_slug,
      descripcion: parsed.data.descripcion ?? null,
      capacidad_personas: parsed.data.capacidad_personas ?? null,
      dimensiones_m2: parsed.data.dimensiones_m2 ?? null,
    })
    .eq('id', input.id)
    .eq('tenant_id', tenant_id)

  if (error) return { ok: false, error: error.message }

  revalidatePath('/admin/configuracion')
  return { ok: true }
}

export async function eliminarEspacioAction(input: {
  id: string
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const persona = await getPersona()
  if (!persona) return { ok: false, error: 'No autenticado' }

  const puede = await canAdminEspacios(persona.id)
  if (!puede) return { ok: false, error: 'Sin permiso' }

  const tenant_id = persona.tenant_id ?? TENANT_ID
  const supabase = createServiceRoleClient()

  const { error } = await supabase
    .from('espacios')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', input.id)
    .eq('tenant_id', tenant_id)

  if (error) return { ok: false, error: error.message }

  revalidatePath('/admin/configuracion')
  return { ok: true }
}
