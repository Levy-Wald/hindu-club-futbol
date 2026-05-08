/**
 * Procesador de sync: compara archivo parseado contra personas en DB.
 * Genera diffs sin aplicar cambios.
 */

import type { FilaPadronParseada } from './parsers'
import { normalizarDNI } from './parsers'

export interface PersonaExistente {
  id: string
  nombre: string
  apellido: string
  numero_documento: string | null
  fecha_nacimiento: string | null
  // Datos de personas_padrones para este padrón
  pp_id: string | null
  pp_numero_socio: string | null
  pp_categoria_club: string | null
  pp_actividad_club: string | null
  pp_fecha_ingreso_club: string | null
  pp_estado_club: string | null
  pp_notas_club: string | null
  pp_activo: boolean
}

export interface DiffItem {
  tipo_cambio: 'alta' | 'baja' | 'modificacion' | 'sin_cambios' | 'rechazado'
  persona_id: string | null
  dni_archivo: string
  nombre_archivo: string
  nombre_confianza: 'alta' | 'media' | 'baja' | null
  numero_socio_archivo: string
  categoria_archivo: string
  actividad_archivo: string
  datos_antes: Record<string, unknown> | null
  datos_despues: Record<string, unknown> | null
  motivo_rechazo: string | null
  fila_original: number
}

/**
 * Genera los diffs comparando filas parseadas vs personas en DB.
 */
export function generarDiffs(
  filasParseadas: FilaPadronParseada[],
  personasExistentes: PersonaExistente[]
): { diffs: DiffItem[]; stats: SyncStats } {
  const diffs: DiffItem[] = []

  // Indexar personas existentes por DNI normalizado
  const personasPorDNI = new Map<string, PersonaExistente>()
  for (const p of personasExistentes) {
    const dni = normalizarDNI(p.numero_documento)
    if (dni) personasPorDNI.set(dni, p)
  }

  // Track DNIs vistos en el archivo (para detectar bajas)
  const dnisVistos = new Set<string>()

  // Procesar cada fila del archivo
  for (const fila of filasParseadas) {
    if (!fila.valido) {
      diffs.push({
        tipo_cambio: 'rechazado',
        persona_id: null,
        dni_archivo: fila.dni,
        nombre_archivo: fila.nombre_original,
        nombre_confianza: fila.nombre_confianza,
        numero_socio_archivo: fila.numero_socio,
        categoria_archivo: fila.categoria_original,
        actividad_archivo: fila.actividad,
        datos_antes: null,
        datos_despues: null,
        motivo_rechazo: fila.motivo_rechazo,
        fila_original: fila.fila_original,
      })
      continue
    }

    dnisVistos.add(fila.dni)
    const personaExistente = personasPorDNI.get(fila.dni)

    if (!personaExistente) {
      // ALTA: persona no existe en DB
      diffs.push({
        tipo_cambio: 'alta',
        persona_id: null,
        dni_archivo: fila.dni,
        nombre_archivo: fila.nombre_original,
        nombre_confianza: fila.nombre_confianza,
        numero_socio_archivo: fila.numero_socio,
        categoria_archivo: fila.categoria_original,
        actividad_archivo: fila.actividad,
        datos_antes: null,
        datos_despues: {
          nombre: fila.nombre,
          apellido: fila.apellido,
          numero_documento: fila.dni,
          fecha_nacimiento: fila.fecha_nacimiento,
          numero_socio: fila.numero_socio,
          categoria_club: fila.categoria_original,
          actividad_club: fila.actividad,
          fecha_ingreso_club: fila.fecha_ingreso,
          notas_club: fila.notas,
        },
        motivo_rechazo: null,
        fila_original: fila.fila_original,
      })
    } else {
      // Persona existe — verificar cambios
      const cambios = detectarCambios(personaExistente, fila)

      if (cambios.hayCambios) {
        diffs.push({
          tipo_cambio: 'modificacion',
          persona_id: personaExistente.id,
          dni_archivo: fila.dni,
          nombre_archivo: fila.nombre_original,
          nombre_confianza: fila.nombre_confianza,
          numero_socio_archivo: fila.numero_socio,
          categoria_archivo: fila.categoria_original,
          actividad_archivo: fila.actividad,
          datos_antes: cambios.antes,
          datos_despues: cambios.despues,
          motivo_rechazo: null,
          fila_original: fila.fila_original,
        })
      } else {
        diffs.push({
          tipo_cambio: 'sin_cambios',
          persona_id: personaExistente.id,
          dni_archivo: fila.dni,
          nombre_archivo: fila.nombre_original,
          nombre_confianza: fila.nombre_confianza,
          numero_socio_archivo: fila.numero_socio,
          categoria_archivo: fila.categoria_original,
          actividad_archivo: fila.actividad,
          datos_antes: null,
          datos_despues: null,
          motivo_rechazo: null,
          fila_original: fila.fila_original,
        })
      }
    }
  }

  // Detectar BAJAS: personas que están en el padrón DB pero no en el archivo
  for (const persona of personasExistentes) {
    const dni = normalizarDNI(persona.numero_documento)
    if (!dni) continue
    if (dnisVistos.has(dni)) continue
    if (!persona.pp_activo) continue // Ya estaba de baja

    diffs.push({
      tipo_cambio: 'baja',
      persona_id: persona.id,
      dni_archivo: dni,
      nombre_archivo: `${persona.apellido} ${persona.nombre}`,
      nombre_confianza: null,
      numero_socio_archivo: persona.pp_numero_socio ?? '',
      categoria_archivo: persona.pp_categoria_club ?? '',
      actividad_archivo: persona.pp_actividad_club ?? '',
      datos_antes: {
        nombre: persona.nombre,
        apellido: persona.apellido,
        numero_socio: persona.pp_numero_socio,
        categoria_club: persona.pp_categoria_club,
        actividad_club: persona.pp_actividad_club,
        estado_club: persona.pp_estado_club,
      },
      datos_despues: {
        estado_club: 'baja',
      },
      motivo_rechazo: null,
      fila_original: -1,
    })
  }

  // Stats
  const stats: SyncStats = {
    total_filas: filasParseadas.length,
    altas: diffs.filter((d) => d.tipo_cambio === 'alta').length,
    bajas: diffs.filter((d) => d.tipo_cambio === 'baja').length,
    cambios: diffs.filter((d) => d.tipo_cambio === 'modificacion').length,
    sin_cambios: diffs.filter((d) => d.tipo_cambio === 'sin_cambios').length,
    rechazados: diffs.filter((d) => d.tipo_cambio === 'rechazado').length,
  }

  return { diffs, stats }
}

export interface SyncStats {
  total_filas: number
  altas: number
  bajas: number
  cambios: number
  sin_cambios: number
  rechazados: number
}

// ============================================================
// Detectar cambios entre persona existente y fila nueva
// ============================================================
function detectarCambios(
  persona: PersonaExistente,
  fila: FilaPadronParseada
): { hayCambios: boolean; antes: Record<string, unknown>; despues: Record<string, unknown> } {
  const antes: Record<string, unknown> = {}
  const despues: Record<string, unknown> = {}

  function comparar(campo: string, valorDB: string | null | undefined, valorArchivo: string | null) {
    const a = (valorDB ?? '').trim()
    const b = (valorArchivo ?? '').trim()
    if (a !== b && b) {
      antes[campo] = valorDB ?? null
      despues[campo] = valorArchivo
    }
  }

  comparar('numero_socio', persona.pp_numero_socio, fila.numero_socio)
  comparar('categoria_club', persona.pp_categoria_club, fila.categoria_original)
  comparar('actividad_club', persona.pp_actividad_club, fila.actividad)
  comparar('notas_club', persona.pp_notas_club, fila.notas)

  // Fecha de nacimiento: comparar solo si la DB no lo tiene y el archivo sí
  if (!persona.fecha_nacimiento && fila.fecha_nacimiento) {
    antes['fecha_nacimiento'] = null
    despues['fecha_nacimiento'] = fila.fecha_nacimiento
  }

  // Reactivación: persona estaba de baja en el padrón pero aparece en el archivo
  if (!persona.pp_activo && persona.pp_id) {
    antes['estado_club'] = persona.pp_estado_club ?? 'baja'
    despues['estado_club'] = 'activo'
  }

  return {
    hayCambios: Object.keys(despues).length > 0,
    antes,
    despues,
  }
}
