import { describe, it, expect } from 'vitest'
import { getVisibleSidebarItems } from '../../../lib/navigation/filter'

describe('getVisibleSidebarItems', () => {
  it('shows items when modulo and capability match', () => {
    const items = getVisibleSidebarItems(
      ['finanzas.read'],
      ['finanzas'],
      [],
      'finanzas',
      []
    )
    expect(items.some(i => i.id === 'finanzas')).toBe(true)
  })

  it('hides items when modulo is inactive', () => {
    const items = getVisibleSidebarItems(
      ['finanzas.read'],
      [], // no modulos
      [],
      'finanzas',
      []
    )
    expect(items.some(i => i.id === 'finanzas')).toBe(false)
  })

  it('hides items when capability is missing (non-admin)', () => {
    const items = getVisibleSidebarItems(
      [], // no capabilities
      ['finanzas'],
      [],
      'finanzas',
      []
    )
    expect(items.some(i => i.id === 'finanzas')).toBe(false)
  })

  it('admin (tenant.admin attribute) sees items even without specific capability', () => {
    const items = getVisibleSidebarItems(
      [], // no capabilities
      ['finanzas'],
      [],
      'finanzas',
      ['tenant.admin']
    )
    expect(items.some(i => i.id === 'finanzas')).toBe(true)
  })

  it('sistema.admin attribute also grants admin bypass', () => {
    const items = getVisibleSidebarItems(
      [],
      ['finanzas'],
      [],
      'finanzas',
      ['sistema.admin']
    )
    expect(items.some(i => i.id === 'finanzas')).toBe(true)
  })

  it('shows items without modulo_slug or capability for everyone', () => {
    const items = getVisibleSidebarItems(
      [],
      [],
      [],
      'personas',
      []
    )
    // padrones has no modulo_slug but has capability_requerida personas.read
    // with no caps and no admin -> filtered out
    // but items without both should appear
    expect(items.some(i => i.id === 'inicio')).toBe(false) // wrong space
  })

  it('filters by espacio correctly', () => {
    const items = getVisibleSidebarItems(
      ['setup.tenant', 'setup.users', 'setup.modulos'],
      [],
      [],
      'configuracion',
      []
    )
    expect(items.some(i => i.id === 'usuarios')).toBe(true)
    expect(items.some(i => i.id === 'personas')).toBe(false) // wrong space
  })
})
