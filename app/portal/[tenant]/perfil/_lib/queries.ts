// F3 — Portal Cliente / Mi perfil + dependientes (familia). Vista read-only MVP.
import { createClient } from '@/lib/supabase/server'

export interface PerfilSocio {
  id: string
  nombre: string
  apellido: string
  numero_documento: string | null
  email_principal: string | null
  telefono_principal: string | null
  foto_perfil_url: string | null
  fecha_nacimiento: string | null
}

export interface Vinculo {
  id: string
  tipo: string
  persona: { id: string; nombre: string; apellido: string } | null
}

export async function fetchMiPerfil(personaId: string): Promise<{ perfil: PerfilSocio | null; familia: Vinculo[] }> {
  const supabase = await createClient()

  const { data: perfil } = await supabase
    .from('personas')
    .select('id, nombre, apellido, numero_documento, email_principal, telefono_principal, foto_perfil_url, fecha_nacimiento')
    .eq('id', personaId)
    .is('deleted_at', null)
    .maybeSingle()

  const [origenRes, destinoRes] = await Promise.all([
    supabase
      .from('personas_vinculos')
      .select('id, tipo_vinculo_slug, destino:personas!personas_vinculos_persona_destino_id_fkey(id, nombre, apellido)')
      .eq('persona_origen_id', personaId)
      .eq('activo', true),
    supabase
      .from('personas_vinculos')
      .select('id, tipo_vinculo_slug, origen:personas!personas_vinculos_persona_origen_id_fkey(id, nombre, apellido)')
      .eq('persona_destino_id', personaId)
      .eq('activo', true),
  ])

  const familia: Vinculo[] = [
    ...(origenRes.data ?? []).map((v) => ({
      id: v.id,
      tipo: v.tipo_vinculo_slug,
      persona: (v.destino as unknown as Vinculo['persona']) ?? null,
    })),
    ...(destinoRes.data ?? []).map((v) => ({
      id: v.id,
      tipo: v.tipo_vinculo_slug,
      persona: (v.origen as unknown as Vinculo['persona']) ?? null,
    })),
  ]

  return { perfil: perfil ?? null, familia }
}
