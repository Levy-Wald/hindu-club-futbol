'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { TENANT_ID } from '@/lib/tenant'

// F3 — Portal Cliente. El socio edita SU PROPIA ficha (self-scoped por user_id,
// RLS permite la fila propia; no requiere capabilities de admin).
//
// Regla de negocio (smoke Yair): los datos de IDENTIDAD/CONTACTO sensibles
// (nombre, apellido, DNI, fecha de nacimiento, mail y teléfono principales)
// solo se pueden CARGAR si están vacíos. Si ya están cargados, no se editan
// directo: hay que "solicitar cambio" (queda para que un admin lo apruebe).
// El resto de los campos (dirección, datos deportivos, profesión) son de
// edición libre del socio.

function formatResult(ok: boolean, message: string) {
  return { ok, message }
}

// Campos candado: editables solo si están vacíos en la BD.
const CAMPOS_CANDADO = [
  'nombre',
  'apellido',
  'numero_documento',
  'fecha_nacimiento',
  'email_principal',
  'telefono_principal',
] as const

// Campos de edición libre (texto).
const CAMPOS_LIBRES_TEXTO = [
  'genero',
  'nacionalidad',
  'estado_civil',
  'email_secundario',
  'telefono_secundario',
  'whatsapp',
  'direccion_calle',
  'direccion_numero',
  'direccion_piso',
  'direccion_depto',
  'direccion_barrio',
  'direccion_ciudad',
  'direccion_provincia',
  'direccion_codigo_postal',
  'direccion_pais',
  'pie_dominante',
  'lateralidad',
  'profesion_ocupacion',
  'empresa_actual',
  'cargo_actual',
] as const

// Campos numéricos de edición libre.
const CAMPOS_LIBRES_NUM = ['altura_cm', 'peso_kg'] as const

export async function actualizarMiFicha(input: Record<string, string>) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return formatResult(false, 'No autenticado')

  // Traemos la fila propia con los valores actuales de los campos candado
  // para decidir server-side si se permiten (solo si están vacíos).
  const { data: persona } = await supabase
    .from('personas')
    .select('id, nombre, apellido, numero_documento, fecha_nacimiento, email_principal, telefono_principal')
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .maybeSingle()

  if (!persona) return formatResult(false, 'No encontramos tu ficha')

  const clean: Record<string, unknown> = {}

  // Texto libre
  for (const campo of CAMPOS_LIBRES_TEXTO) {
    if (campo in input) {
      const v = (input[campo] ?? '').trim()
      clean[campo] = v || null
    }
  }

  // Numéricos
  for (const campo of CAMPOS_LIBRES_NUM) {
    if (campo in input) {
      const raw = (input[campo] ?? '').trim().replace(',', '.')
      const n = raw === '' ? null : Number(raw)
      clean[campo] = n != null && !Number.isNaN(n) ? n : null
    }
  }

  // Candado: solo se aplican si el valor actual está vacío.
  const ignorados: string[] = []
  for (const campo of CAMPOS_CANDADO) {
    if (!(campo in input)) continue
    const v = (input[campo] ?? '').trim()
    if (!v) continue
    const actual = (persona as Record<string, unknown>)[campo]
    const estaVacio = actual == null || String(actual).trim() === ''
    if (estaVacio) {
      clean[campo] = v
    } else {
      ignorados.push(campo)
    }
  }

  if (Object.keys(clean).length === 0) {
    return formatResult(false, 'No hay cambios para guardar')
  }

  const { error } = await supabase
    .from('personas')
    .update(clean)
    .eq('id', persona.id as string)

  if (error) return formatResult(false, error.message)

  revalidatePath('/portal', 'layout')

  if (ignorados.length > 0) {
    return formatResult(true, 'Datos guardados. Los campos de identidad ya cargados no se modifican: usá "Solicitar cambio".')
  }
  return formatResult(true, 'Datos guardados')
}

export async function solicitarCambioMiDato(campo: string, valorActual: string, valorNuevo: string) {
  if (!valorNuevo.trim()) return formatResult(false, 'Ingresá el nuevo valor')

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return formatResult(false, 'No autenticado')

  const { data: persona } = await supabase
    .from('personas')
    .select('id')
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .maybeSingle()

  if (!persona) return formatResult(false, 'No encontramos tu ficha')

  const { error } = await supabase
    .from('solicitudes')
    .insert({
      tenant_id: TENANT_ID,
      tipo: 'cambio_datos',
      solicitante_id: persona.id,
      datos: { campo, valor_actual: valorActual, valor_nuevo: valorNuevo.trim() },
    })

  if (error) return formatResult(false, error.message)

  revalidatePath('/portal', 'layout')
  return formatResult(true, 'Solicitud enviada. Un administrador la va a revisar.')
}
