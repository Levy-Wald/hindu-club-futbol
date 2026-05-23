import { describe, it, expect } from 'vitest'
import {
  EventoCreateSchema,
  InvitadoInputSchema,
  ResponderInvitacionSchema,
} from '../../../modules/eventos/lib/types'

describe('EventoCreateSchema', () => {
  const base = {
    titulo: 'Entrenamiento Sub-20',
    tipo_evento_slug: 'entrenamiento',
    fecha_inicio: '2026-06-01',
    fecha_fin: '2026-06-01',
    responsables_persona_id: ['a0000000-0000-4000-8000-000000000001'],
  }

  it('validates basic evento', () => {
    const result = EventoCreateSchema.safeParse(base)
    expect(result.success).toBe(true)
  })

  it('rejects short titulo', () => {
    const result = EventoCreateSchema.safeParse({ ...base, titulo: 'ab' })
    expect(result.success).toBe(false)
  })

  it('rejects invalid date format', () => {
    const result = EventoCreateSchema.safeParse({ ...base, fecha_inicio: '01-06-2026' })
    expect(result.success).toBe(false)
  })

  it('rejects fecha_fin < fecha_inicio', () => {
    const result = EventoCreateSchema.safeParse({ ...base, fecha_fin: '2026-05-31' })
    expect(result.success).toBe(false)
  })

  it('accepts periodicidad dias_semana with dias_semana array', () => {
    const result = EventoCreateSchema.safeParse({
      ...base,
      periodicidad: 'dias_semana',
      dias_semana: [true, false, true, false, true, false, false],
    })
    expect(result.success).toBe(true)
  })

  it('rejects dias_semana with wrong length', () => {
    const result = EventoCreateSchema.safeParse({
      ...base,
      dias_semana: [true, false],
    })
    expect(result.success).toBe(false)
  })

  it('accepts valid hora_inicio format', () => {
    const result = EventoCreateSchema.safeParse({ ...base, hora_inicio: '18:00' })
    expect(result.success).toBe(true)
  })

  it('accepts hora with seconds', () => {
    const result = EventoCreateSchema.safeParse({ ...base, hora_inicio: '18:00:00' })
    expect(result.success).toBe(true)
  })

  it('rejects invalid hora format', () => {
    const result = EventoCreateSchema.safeParse({ ...base, hora_inicio: '6pm' })
    expect(result.success).toBe(false)
  })

  it('requires at least one responsable', () => {
    const result = EventoCreateSchema.safeParse({ ...base, responsables_persona_id: [] })
    expect(result.success).toBe(false)
  })

  it('accepts all periodicidad values', () => {
    for (const p of ['sin_repeticion', 'diario', 'dias_semana', 'quincenal', 'mensual', 'anual', 'nunca']) {
      const result = EventoCreateSchema.safeParse({ ...base, periodicidad: p })
      expect(result.success).toBe(true)
    }
  })
})

describe('InvitadoInputSchema', () => {
  it('validates persona invitado', () => {
    const result = InvitadoInputSchema.safeParse({
      tipo: 'persona',
      ref_id: 'a0000000-0000-4000-8000-000000000001',
    })
    expect(result.success).toBe(true)
  })

  it('validates equipo invitado', () => {
    const result = InvitadoInputSchema.safeParse({
      tipo: 'equipo',
      ref_id: 'a0000000-0000-4000-8000-000000000002',
    })
    expect(result.success).toBe(true)
  })

  it('validates email_externo invitado', () => {
    const result = InvitadoInputSchema.safeParse({
      tipo: 'email_externo',
      email: 'test@example.com',
    })
    expect(result.success).toBe(true)
  })

  it('rejects email_externo without email', () => {
    const result = InvitadoInputSchema.safeParse({ tipo: 'email_externo' })
    expect(result.success).toBe(false)
  })

  it('rejects persona without ref_id', () => {
    const result = InvitadoInputSchema.safeParse({ tipo: 'persona' })
    expect(result.success).toBe(false)
  })

  it('rejects invalid email format', () => {
    const result = InvitadoInputSchema.safeParse({
      tipo: 'email_externo',
      email: 'not-an-email',
    })
    expect(result.success).toBe(false)
  })

  it('validates entidad invitado', () => {
    const result = InvitadoInputSchema.safeParse({
      tipo: 'entidad',
      ref_id: 'a0000000-0000-4000-8000-000000000003',
    })
    expect(result.success).toBe(true)
  })
})

describe('ResponderInvitacionSchema', () => {
  it('accepts aceptado', () => {
    expect(ResponderInvitacionSchema.safeParse({ estado: 'aceptado' }).success).toBe(true)
  })

  it('accepts rechazado', () => {
    expect(ResponderInvitacionSchema.safeParse({ estado: 'rechazado' }).success).toBe(true)
  })

  it('accepts tentativa', () => {
    expect(ResponderInvitacionSchema.safeParse({ estado: 'tentativa' }).success).toBe(true)
  })

  it('rejects invalid estado', () => {
    expect(ResponderInvitacionSchema.safeParse({ estado: 'invalido' }).success).toBe(false)
  })

  it('rejects empty input', () => {
    expect(ResponderInvitacionSchema.safeParse({}).success).toBe(false)
  })
})
