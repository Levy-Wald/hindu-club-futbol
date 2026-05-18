import { describe, it, expect } from 'vitest'
import { shouldShowWidget } from '../../../lib/dashboard/types'
import type { WidgetDef } from '../../../lib/dashboard/types'

const make = (condition: WidgetDef['condition']): WidgetDef => ({
  id: 'test',
  title: 'Test',
  priority: 1,
  condition,
  size: 'sm',
})

describe('shouldShowWidget', () => {
  it('always:true shows for any user', () => {
    expect(shouldShowWidget(make({ always: true }), [], [])).toBe(true)
  })

  it('hasAnyAttribute matches if user has one', () => {
    const w = make({ hasAnyAttribute: ['socio', 'jugador'] })
    expect(shouldShowWidget(w, ['jugador'], [])).toBe(true)
    expect(shouldShowWidget(w, ['staff'], [])).toBe(false)
  })

  it('hasAllAttributes requires all', () => {
    const w = make({ hasAllAttributes: ['socio', 'jugador'] })
    expect(shouldShowWidget(w, ['socio', 'jugador'], [])).toBe(true)
    expect(shouldShowWidget(w, ['socio'], [])).toBe(false)
  })

  it('hasAnyCapability matches capabilities', () => {
    const w = make({ hasAnyCapability: ['finanzas.read', 'cobranza.read'] })
    expect(shouldShowWidget(w, [], ['finanzas.read'])).toBe(true)
    expect(shouldShowWidget(w, [], ['personas.read'])).toBe(false)
  })

  it('returns false when no conditions match', () => {
    const w = make({ hasAnyAttribute: ['admin'] })
    expect(shouldShowWidget(w, [], [])).toBe(false)
  })
})
