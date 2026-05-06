'use server'

import { createClient } from '@/lib/supabase/server'

export async function crearPreInscripcion(input: {
  tenant_id: string
  nombre: string
  apellido: string
  fecha_nacimiento?: string
  numero_documento?: string
  sexo?: string
  email?: string
  telefono?: string
  es_menor: boolean
  tutor_nombre?: string
  tutor_apellido?: string
  tutor_documento?: string
  tutor_vinculo?: string
  tutor_telefono?: string
  tutor_email?: string
  disciplina_slug?: string
  categoria_preferida?: string
  experiencia_previa?: string
  mensaje?: string
  acepta_terminos: boolean
  acepta_comunicaciones?: boolean
}) {
  const supabase = await createClient()

  if (!input.nombre?.trim() || !input.apellido?.trim()) {
    return { ok: false, message: 'Nombre y apellido son obligatorios' }
  }
  if (!input.acepta_terminos) {
    return { ok: false, message: 'Debes aceptar los terminos y condiciones' }
  }

  const { error } = await supabase.from('pre_inscripciones').insert({
    tenant_id: input.tenant_id,
    nombre: input.nombre.trim(),
    apellido: input.apellido.trim(),
    fecha_nacimiento: input.fecha_nacimiento || null,
    numero_documento: input.numero_documento?.trim() || null,
    sexo: input.sexo || null,
    email: input.es_menor ? input.tutor_email : input.email,
    telefono: input.es_menor ? input.tutor_telefono : input.telefono,
    es_menor: input.es_menor,
    tutor_nombre: input.tutor_nombre?.trim() || null,
    tutor_apellido: input.tutor_apellido?.trim() || null,
    tutor_documento: input.tutor_documento?.trim() || null,
    tutor_vinculo: input.tutor_vinculo || null,
    tutor_telefono: input.tutor_telefono?.trim() || null,
    tutor_email: input.tutor_email?.trim() || null,
    disciplina_slug: input.disciplina_slug || null,
    categoria_preferida: input.categoria_preferida || null,
    experiencia_previa: input.experiencia_previa?.trim() || null,
    mensaje: input.mensaje?.trim() || null,
    acepta_terminos: input.acepta_terminos,
    acepta_comunicaciones: input.acepta_comunicaciones ?? false,
    estado: 'pendiente',
    origen: 'web',
  })

  if (error) {
    return {
      ok: false,
      message: 'Error al enviar la inscripcion. Intenta de nuevo.',
    }
  }

  return {
    ok: true,
    message: 'Inscripcion enviada! Nos ponemos en contacto pronto.',
  }
}
