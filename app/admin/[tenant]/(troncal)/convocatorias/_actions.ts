'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { TENANT_ID } from '@/lib/tenant'

function formatResult(ok: boolean, message: string) {
  return { ok, message }
}

// Guarda la convocatoria de un partido: reemplaza el set de convocados por el
// nuevo (los que tienen estado titular/suplente/convocado). Los marcados como
// "no convocado" (estado null) quedan fuera.
export async function guardarConvocatoria(
  eventoId: string,
  convocados: Array<{ persona_id: string; estado: 'titular' | 'suplente' | 'convocado' | null }>,
) {
  const supabase = await createClient()

  const citados = convocados.filter((c) => c.estado !== null)

  const { error: delErr } = await supabase.from('evento_convocados').delete().eq('evento_id', eventoId)
  if (delErr) return formatResult(false, delErr.message)

  if (citados.length > 0) {
    const { error: insErr } = await supabase.from('evento_convocados').insert(
      citados.map((c) => ({
        tenant_id: TENANT_ID,
        evento_id: eventoId,
        persona_id: c.persona_id,
        estado: c.estado as 'titular' | 'suplente' | 'convocado',
      })),
    )
    if (insErr) return formatResult(false, insErr.message)
  }

  revalidatePath('/admin/convocatorias')
  revalidatePath(`/admin/convocatorias/${eventoId}`)
  return formatResult(true, `Convocatoria guardada (${citados.length} citados)`)
}
