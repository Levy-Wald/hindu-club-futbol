import { describe, it, expect } from 'vitest'
import { can, canAny } from '../../../lib/permissions/capabilities-context'

describe('can', () => {
  it('returns true when capability present', () => {
    expect(can(['personas.read', 'finanzas.read'], 'personas.read')).toBe(true)
  })

  it('returns false when capability absent', () => {
    expect(can(['personas.read'], 'finanzas.write')).toBe(false)
  })

  it('returns false for empty array', () => {
    expect(can([], 'personas.read')).toBe(false)
  })
})

describe('canAny', () => {
  it('returns true when at least one matches', () => {
    expect(canAny(['personas.read'], ['finanzas.read', 'personas.read'])).toBe(true)
  })

  it('returns false when none match', () => {
    expect(canAny(['personas.read'], ['finanzas.read', 'setup.tenant'])).toBe(false)
  })

  it('returns false for empty caps', () => {
    expect(canAny([], ['personas.read'])).toBe(false)
  })
})
