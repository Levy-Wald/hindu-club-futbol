import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock supabase client
const mockRpc = vi.fn()
const mockGetUser = vi.fn()
const mockFrom = vi.fn()

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: mockGetUser },
    from: mockFrom,
    rpc: mockRpc,
  })),
}))

// Import after mock
const {
  getUserCapabilities,
  hasCapability,
  hasAnyCapability,
  requireCapability,
  requireAllCapabilities,
  getCurrentPersonaId,
} = await import('../../../lib/permissions/capabilities')

describe('capabilities helpers', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getUserCapabilities', () => {
    it('returns capabilities array from RPC', async () => {
      mockRpc.mockResolvedValue({ data: ['personas.read', 'finanzas.write'], error: null })
      const caps = await getUserCapabilities('persona-123')
      expect(caps).toEqual(['personas.read', 'finanzas.write'])
      expect(mockRpc).toHaveBeenCalledWith('get_user_capabilities', { p_persona_id: 'persona-123' })
    })

    it('returns empty array on error', async () => {
      mockRpc.mockResolvedValue({ data: null, error: { message: 'fail' } })
      const caps = await getUserCapabilities('persona-123')
      expect(caps).toEqual([])
    })

    it('returns empty array on null data', async () => {
      mockRpc.mockResolvedValue({ data: null, error: null })
      const caps = await getUserCapabilities('persona-123')
      expect(caps).toEqual([])
    })
  })

  describe('hasCapability', () => {
    it('returns true when RPC returns true', async () => {
      mockRpc.mockResolvedValue({ data: true, error: null })
      const result = await hasCapability('persona-123', 'finanzas.write')
      expect(result).toBe(true)
    })

    it('returns false when RPC returns false', async () => {
      mockRpc.mockResolvedValue({ data: false, error: null })
      const result = await hasCapability('persona-123', 'finanzas.write')
      expect(result).toBe(false)
    })

    it('returns false on RPC error', async () => {
      mockRpc.mockResolvedValue({ data: null, error: { message: 'fail' } })
      const result = await hasCapability('persona-123', 'finanzas.write')
      expect(result).toBe(false)
    })
  })

  describe('hasAnyCapability', () => {
    it('returns true when user has at least one capability', async () => {
      mockRpc.mockResolvedValue({ data: true, error: null })
      const result = await hasAnyCapability('persona-123', ['finanzas.write', 'setup.users'])
      expect(result).toBe(true)
    })

    it('returns false when user has none', async () => {
      mockRpc.mockResolvedValue({ data: false, error: null })
      const result = await hasAnyCapability('persona-123', ['retail.pos.operar'])
      expect(result).toBe(false)
    })
  })

  describe('requireCapability', () => {
    it('returns ok:false when no user session', async () => {
      mockGetUser.mockResolvedValue({ data: { user: null } })
      const result = await requireCapability('finanzas.write')
      expect(result.ok).toBe(false)
      if (!result.ok) expect(result.error).toBe('No autenticado')
    })

    it('returns ok:false when persona not found', async () => {
      mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
      const chain = { eq: vi.fn().mockReturnThis(), is: vi.fn().mockReturnThis(), maybeSingle: vi.fn().mockResolvedValue({ data: null }) }
      mockFrom.mockReturnValue({ select: vi.fn().mockReturnValue(chain) })
      const result = await requireCapability('finanzas.write')
      expect(result.ok).toBe(false)
    })

    it('returns ok:true with personaId when capability present', async () => {
      mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
      const chain = { eq: vi.fn().mockReturnThis(), is: vi.fn().mockReturnThis(), maybeSingle: vi.fn().mockResolvedValue({ data: { id: 'persona-abc' } }) }
      mockFrom.mockReturnValue({ select: vi.fn().mockReturnValue(chain) })
      mockRpc.mockResolvedValue({ data: true, error: null })

      const result = await requireCapability('finanzas.write')
      expect(result.ok).toBe(true)
      if (result.ok) expect(result.personaId).toBe('persona-abc')
    })

    it('returns ok:false when capability missing', async () => {
      mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
      const chain = { eq: vi.fn().mockReturnThis(), is: vi.fn().mockReturnThis(), maybeSingle: vi.fn().mockResolvedValue({ data: { id: 'persona-abc' } }) }
      mockFrom.mockReturnValue({ select: vi.fn().mockReturnValue(chain) })
      mockRpc.mockResolvedValue({ data: false, error: null })

      const result = await requireCapability('retail.pos.operar')
      expect(result.ok).toBe(false)
      if (!result.ok) expect(result.error).toContain('retail.pos.operar')
    })
  })

  describe('requireAllCapabilities', () => {
    it('returns ok:false if any capability is missing', async () => {
      mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
      const chain = { eq: vi.fn().mockReturnThis(), is: vi.fn().mockReturnThis(), maybeSingle: vi.fn().mockResolvedValue({ data: { id: 'persona-abc' } }) }
      mockFrom.mockReturnValue({ select: vi.fn().mockReturnValue(chain) })
      mockRpc
        .mockResolvedValueOnce({ data: true, error: null })  // first cap OK
        .mockResolvedValueOnce({ data: false, error: null })  // second cap fails

      const result = await requireAllCapabilities('personas.read', 'personas.admin')
      expect(result.ok).toBe(false)
    })

    it('returns ok:true when all capabilities present', async () => {
      mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
      const chain = { eq: vi.fn().mockReturnThis(), is: vi.fn().mockReturnThis(), maybeSingle: vi.fn().mockResolvedValue({ data: { id: 'persona-abc' } }) }
      mockFrom.mockReturnValue({ select: vi.fn().mockReturnValue(chain) })
      mockRpc.mockResolvedValue({ data: true, error: null })

      const result = await requireAllCapabilities('personas.read', 'personas.admin')
      expect(result.ok).toBe(true)
    })
  })
})
