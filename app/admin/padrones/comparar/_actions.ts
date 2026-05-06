'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

const TENANT_ID = '62e25f3c-7c86-42f1-9b43-cdbab28dacde'

/**
 * Vincular un batch de personas a un padrón.
 */
export async function vincularBatchAPadron(padronId: string, personaIds: string[]) {
  if (!padronId || personaIds.length === 0) {
    return { ok: false, message: 'Padrón y personas son obligatorios', added: 0 }
  }

  const supabase = await createClient()
  let added = 0
  let skipped = 0

  for (const personaId of personaIds) {
    // Check if already linked
    const { data: existing } = await supabase
      .from('personas_padrones')
      .select('id, activo')
      .eq('padron_id', padronId)
      .eq('persona_id', personaId)
      .maybeSingle()

    if (existing && existing.activo) {
      skipped++
      continue
    }

    if (existing && !existing.activo) {
      await supabase
        .from('personas_padrones')
        .update({ activo: true, fecha_alta: new Date().toISOString().split('T')[0] })
        .eq('id', existing.id)
      added++
    } else {
      await supabase.from('personas_padrones').insert({
        tenant_id: TENANT_ID,
        padron_id: padronId,
        persona_id: personaId,
        fecha_alta: new Date().toISOString().split('T')[0],
        origen_alta: 'manual',
        activo: true,
      })
      added++
    }
  }

  revalidatePath('/admin/padrones')
  revalidatePath(`/admin/padrones/${padronId}`)
  revalidatePath('/admin/padrones/comparar')

  return {
    ok: true,
    message: `${added} persona${added !== 1 ? 's' : ''} vinculada${added !== 1 ? 's' : ''} al padrón${skipped > 0 ? ` (${skipped} ya estaban)` : ''}`,
    added,
  }
}

/**
 * Desvincular un batch de personas de un padrón (soft delete).
 */
export async function desvincularBatchDePadron(padronId: string, personaIds: string[]) {
  if (!padronId || personaIds.length === 0) {
    return { ok: false, message: 'Padrón y personas son obligatorios', removed: 0 }
  }

  const supabase = await createClient()

  const { error } = await supabase
    .from('personas_padrones')
    .update({ activo: false, fecha_baja: new Date().toISOString().split('T')[0] })
    .eq('padron_id', padronId)
    .in('persona_id', personaIds)
    .eq('activo', true)

  if (error) return { ok: false, message: error.message, removed: 0 }

  revalidatePath('/admin/padrones')
  revalidatePath(`/admin/padrones/${padronId}`)
  revalidatePath('/admin/padrones/comparar')

  return {
    ok: true,
    message: `${personaIds.length} persona${personaIds.length !== 1 ? 's' : ''} desvinculada${personaIds.length !== 1 ? 's' : ''} del padrón`,
    removed: personaIds.length,
  }
}
