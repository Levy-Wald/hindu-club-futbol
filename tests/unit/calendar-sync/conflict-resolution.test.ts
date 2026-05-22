import { describe, it, expect } from 'vitest'
import { detectConflict } from '../../../lib/calendar-sync/conflict-resolution'

describe('detectConflict', () => {
  it('returns no conflict when Google event has no updated timestamp', () => {
    const result = detectConflict(
      { id: '1', updated_at: '2026-05-22T10:00:00Z' },
      { id: 'g1', summary: 'Test', start: {}, end: {} },
    )
    expect(result.isConflict).toBe(false)
    expect(result.winner).toBe('local')
  })

  it('returns no conflict when timestamps match', () => {
    const ts = '2026-05-22T10:00:00Z'
    const result = detectConflict(
      { id: '1', updated_at: ts },
      { id: 'g1', summary: 'Test', start: {}, end: {}, updated: ts },
    )
    expect(result.isConflict).toBe(false)
    expect(result.winner).toBe('local')
  })

  it('detects conflict — cloud wins when newer', () => {
    const result = detectConflict(
      { id: '1', updated_at: '2026-05-22T10:00:00Z' },
      { id: 'g1', summary: 'Test', start: {}, end: {}, updated: '2026-05-22T12:00:00Z' },
    )
    expect(result.isConflict).toBe(true)
    expect(result.winner).toBe('cloud')
  })

  it('detects conflict — local wins when newer', () => {
    const result = detectConflict(
      { id: '1', updated_at: '2026-05-22T14:00:00Z' },
      { id: 'g1', summary: 'Test', start: {}, end: {}, updated: '2026-05-22T12:00:00Z' },
    )
    expect(result.isConflict).toBe(true)
    expect(result.winner).toBe('local')
  })
})
