import { describe, it, expect } from 'vitest'
import {
  EventoCreateSchema,
  EventoUpdateSchema,
  InvitadoInputSchema,
  ResponderInvitacionSchema,
} from '../../../modules/eventos/lib/types'

const UUID1 = 'a0000000-0000-4000-8000-000000000001'
const UUID2 = 'a0000000-0000-4000-8000-000000000002'
const UUID3 = 'a0000000-0000-4000-8000-000000000003'

// ── EventoCreateSchema ──

describe('EventoCreateSchema', () => {
  const base = {
    titulo: 'Entrenamiento Sub-20',
    tipo_evento_slug: 'entrenamiento',
    fecha_inicio: '2026-06-01',
    fecha_fin: '2026-06-01',
    responsables_persona_id: [UUID1],
  }

  it('validates basic evento', () => {
    expect(EventoCreateSchema.safeParse(base).success).toBe(true)
  })

  it('rejects short titulo', () => {
    expect(EventoCreateSchema.safeParse({ ...base, titulo: 'ab' }).success).toBe(false)
  })

  it('rejects empty titulo', () => {
    expect(EventoCreateSchema.safeParse({ ...base, titulo: '' }).success).toBe(false)
  })

  it('rejects titulo over 255 chars', () => {
    expect(EventoCreateSchema.safeParse({ ...base, titulo: 'x'.repeat(256) }).success).toBe(false)
  })

  it('accepts titulo exactly 3 chars', () => {
    expect(EventoCreateSchema.safeParse({ ...base, titulo: 'abc' }).success).toBe(true)
  })

  it('rejects invalid date format', () => {
    expect(EventoCreateSchema.safeParse({ ...base, fecha_inicio: '01-06-2026' }).success).toBe(false)
  })

  it('rejects fecha_fin < fecha_inicio', () => {
    expect(EventoCreateSchema.safeParse({ ...base, fecha_fin: '2026-05-31' }).success).toBe(false)
  })

  it('accepts fecha_fin == fecha_inicio', () => {
    expect(EventoCreateSchema.safeParse(base).success).toBe(true)
  })

  it('accepts fecha_fin > fecha_inicio', () => {
    expect(EventoCreateSchema.safeParse({ ...base, fecha_fin: '2026-06-02' }).success).toBe(true)
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
    expect(EventoCreateSchema.safeParse({ ...base, dias_semana: [true, false] }).success).toBe(false)
  })

  it('rejects dias_semana with 8 elements', () => {
    expect(EventoCreateSchema.safeParse({
      ...base,
      dias_semana: [true, false, true, false, true, false, false, true],
    }).success).toBe(false)
  })

  it('accepts valid hora_inicio format HH:MM', () => {
    expect(EventoCreateSchema.safeParse({ ...base, hora_inicio: '18:00' }).success).toBe(true)
  })

  it('accepts hora with seconds HH:MM:SS', () => {
    expect(EventoCreateSchema.safeParse({ ...base, hora_inicio: '18:00:00' }).success).toBe(true)
  })

  it('rejects invalid hora format', () => {
    expect(EventoCreateSchema.safeParse({ ...base, hora_inicio: '6pm' }).success).toBe(false)
  })

  it('rejects hora with single digit', () => {
    expect(EventoCreateSchema.safeParse({ ...base, hora_inicio: '6:00' }).success).toBe(false)
  })

  it('requires at least one responsable', () => {
    expect(EventoCreateSchema.safeParse({ ...base, responsables_persona_id: [] }).success).toBe(false)
  })

  it('accepts multiple responsables', () => {
    expect(EventoCreateSchema.safeParse({
      ...base,
      responsables_persona_id: [UUID1, UUID2],
    }).success).toBe(true)
  })

  it('rejects invalid UUID in responsables', () => {
    expect(EventoCreateSchema.safeParse({
      ...base,
      responsables_persona_id: ['not-a-uuid'],
    }).success).toBe(false)
  })

  it('accepts all periodicidad values', () => {
    for (const p of ['sin_repeticion', 'diario', 'dias_semana', 'quincenal', 'mensual', 'anual', 'nunca']) {
      expect(EventoCreateSchema.safeParse({ ...base, periodicidad: p }).success).toBe(true)
    }
  })

  it('rejects invalid periodicidad', () => {
    expect(EventoCreateSchema.safeParse({ ...base, periodicidad: 'bimestral' }).success).toBe(false)
  })

  it('defaults periodicidad to nunca', () => {
    const result = EventoCreateSchema.safeParse(base)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.periodicidad).toBe('nunca')
    }
  })

  it('defaults modulo_origen to manual', () => {
    const result = EventoCreateSchema.safeParse(base)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.modulo_origen).toBe('manual')
    }
  })

  it('accepts all optional fields together', () => {
    const full = {
      ...base,
      hora_inicio: '18:00',
      hora_fin: '20:00',
      descripcion: 'Descripcion del evento',
      equipo_id: UUID2,
      sede_id: UUID3,
      color: '#FF0000',
      periodicidad: 'diario',
      fecha_fin_recurrencia: '2026-12-31',
      lugar_encuentro: 'Cancha 1',
      contacto: 'info@club.com',
      etiquetas: ['futbol', 'sub20'],
      espacio_virtual_tipo: 'zoom' as const,
      espacio_virtual_link: 'https://zoom.us/j/123',
    }
    expect(EventoCreateSchema.safeParse(full).success).toBe(true)
  })

  it('rejects descripcion over 2000 chars', () => {
    expect(EventoCreateSchema.safeParse({
      ...base,
      descripcion: 'x'.repeat(2001),
    }).success).toBe(false)
  })

  it('accepts valid espacio_virtual_tipo values', () => {
    for (const tipo of ['zoom', 'meet', 'teams', 'discord', 'custom']) {
      expect(EventoCreateSchema.safeParse({
        ...base,
        espacio_virtual_tipo: tipo,
      }).success).toBe(true)
    }
  })

  it('rejects invalid espacio_virtual_tipo', () => {
    expect(EventoCreateSchema.safeParse({
      ...base,
      espacio_virtual_tipo: 'skype',
    }).success).toBe(false)
  })

  it('rejects missing required fields', () => {
    expect(EventoCreateSchema.safeParse({}).success).toBe(false)
    expect(EventoCreateSchema.safeParse({ titulo: 'Test' }).success).toBe(false)
  })

  it('rejects fecha_fin_recurrencia with invalid format', () => {
    expect(EventoCreateSchema.safeParse({
      ...base,
      fecha_fin_recurrencia: '31/12/2026',
    }).success).toBe(false)
  })
})

// ── EventoUpdateSchema ──

describe('EventoUpdateSchema', () => {
  it('accepts empty object (all optional)', () => {
    expect(EventoUpdateSchema.safeParse({}).success).toBe(true)
  })

  it('accepts partial update with titulo', () => {
    expect(EventoUpdateSchema.safeParse({ titulo: 'Nuevo titulo' }).success).toBe(true)
  })

  it('rejects titulo under 3 chars', () => {
    expect(EventoUpdateSchema.safeParse({ titulo: 'ab' }).success).toBe(false)
  })

  it('accepts nullable fields as null', () => {
    expect(EventoUpdateSchema.safeParse({
      descripcion: null,
      hora_inicio: null,
      equipo_id: null,
      color: null,
    }).success).toBe(true)
  })

  it('accepts valid estado values', () => {
    for (const e of ['programado', 'en_curso', 'completado', 'cancelado', 'reprogramado']) {
      expect(EventoUpdateSchema.safeParse({ estado: e }).success).toBe(true)
    }
  })

  it('rejects invalid estado', () => {
    expect(EventoUpdateSchema.safeParse({ estado: 'borrador' }).success).toBe(false)
  })

  it('accepts dias_semana as null', () => {
    expect(EventoUpdateSchema.safeParse({ dias_semana: null }).success).toBe(true)
  })
})

// ── InvitadoInputSchema ──

describe('InvitadoInputSchema', () => {
  it('validates persona invitado', () => {
    expect(InvitadoInputSchema.safeParse({ tipo: 'persona', ref_id: UUID1 }).success).toBe(true)
  })

  it('validates equipo invitado', () => {
    expect(InvitadoInputSchema.safeParse({ tipo: 'equipo', ref_id: UUID2 }).success).toBe(true)
  })

  it('validates entidad invitado', () => {
    expect(InvitadoInputSchema.safeParse({ tipo: 'entidad', ref_id: UUID3 }).success).toBe(true)
  })

  it('validates email_externo invitado', () => {
    expect(InvitadoInputSchema.safeParse({ tipo: 'email_externo', email: 'test@example.com' }).success).toBe(true)
  })

  it('rejects email_externo without email', () => {
    expect(InvitadoInputSchema.safeParse({ tipo: 'email_externo' }).success).toBe(false)
  })

  it('rejects persona without ref_id', () => {
    expect(InvitadoInputSchema.safeParse({ tipo: 'persona' }).success).toBe(false)
  })

  it('rejects equipo without ref_id', () => {
    expect(InvitadoInputSchema.safeParse({ tipo: 'equipo' }).success).toBe(false)
  })

  it('rejects invalid email format', () => {
    expect(InvitadoInputSchema.safeParse({ tipo: 'email_externo', email: 'not-an-email' }).success).toBe(false)
  })

  it('rejects invalid ref_id format', () => {
    expect(InvitadoInputSchema.safeParse({ tipo: 'persona', ref_id: 'abc123' }).success).toBe(false)
  })

  it('rejects invalid tipo', () => {
    expect(InvitadoInputSchema.safeParse({ tipo: 'deporte', ref_id: UUID1 }).success).toBe(false)
  })

  it('accepts email_externo with ref_id (ref_id ignored by refine)', () => {
    const result = InvitadoInputSchema.safeParse({
      tipo: 'email_externo',
      email: 'test@example.com',
      ref_id: UUID1,
    })
    expect(result.success).toBe(true)
  })
})

// ── ResponderInvitacionSchema ──

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

  it('rejects pendiente as response', () => {
    expect(ResponderInvitacionSchema.safeParse({ estado: 'pendiente' }).success).toBe(false)
  })

  it('rejects null estado', () => {
    expect(ResponderInvitacionSchema.safeParse({ estado: null }).success).toBe(false)
  })
})
