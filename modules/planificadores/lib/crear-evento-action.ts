'use server'

import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { TENANT_ID } from '@/lib/tenant'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const eventoSchema = z.object({
  titulo: z.string().min(1, 'Titulo requerido').max(200),
  tipo_evento_slug: z.string().min(1, 'Tipo requerido'),
  fecha_inicio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha invalida'),
  fecha_fin: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha fin invalida').optional(),
  hora_inicio: z.string().regex(/^\d{2}:\d{2}$/, 'Hora inicio invalida'),
  hora_fin: z.string().regex(/^\d{2}:\d{2}$/, 'Hora fin invalida'),
  sede_id: z.string().uuid().optional(),
  espacio_id: z.string().uuid().optional(),
  equipo_id: z.string().uuid().optional(),
  descripcion: z.string().max(500).optional(),
})

export async function crearEventoPlanificadorAction(input: {
  titulo: string
  tipo_evento_slug: string
  fecha_inicio: string
  fecha_fin?: string
  hora_inicio: string
  hora_fin: string
  sede_id?: string
  espacio_id?: string
  equipo_id?: string
  descripcion?: string
}): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'No autenticado' }

  const parsed = eventoSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message }

  const { data: persona } = await supabase
    .from('personas')
    .select('id, tenant_id')
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .maybeSingle()
  if (!persona) return { ok: false, error: 'Persona no encontrada' }

  const tenant_id = persona.tenant_id ?? TENANT_ID

  const fechaDate = new Date(parsed.data.fecha_inicio + 'T00:00:00')
  const jsDay = fechaDate.getDay()
  const diaSemana = jsDay === 0 ? 7 : jsDay

  const service = createServiceRoleClient()
  const { data, error } = await service
    .from('eventos')
    .insert({
      tenant_id,
      titulo: parsed.data.titulo,
      tipo_evento_slug: parsed.data.tipo_evento_slug,
      fecha_inicio: parsed.data.fecha_inicio,
      fecha_fin: parsed.data.fecha_fin ?? parsed.data.fecha_inicio,
      hora_inicio: parsed.data.hora_inicio + ':00',
      hora_fin: parsed.data.hora_fin + ':00',
      dia_semana: diaSemana,
      sede_id: parsed.data.sede_id || null,
      espacio_id: parsed.data.espacio_id || null,
      equipo_id: parsed.data.equipo_id || null,
      descripcion: parsed.data.descripcion?.trim() || null,
      modulo_origen: 'planificadores',
      responsables_persona_id: [persona.id],
    })
    .select('id')
    .single()

  if (error || !data) return { ok: false, error: error?.message ?? 'Error creando evento' }

  revalidatePath('/admin/planificadores')
  revalidatePath('/admin/operaciones')
  return { ok: true, id: data.id }
}
