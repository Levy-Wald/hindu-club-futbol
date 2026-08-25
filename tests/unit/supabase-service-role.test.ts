import { describe, it, expect, beforeEach, afterAll } from 'vitest'
import {
  createServiceRoleClient,
  hasServiceRoleCredentials,
} from '../../lib/supabase/service-role'

const envOriginal = { ...process.env }

function setEnv(url?: string, key?: string) {
  if (url === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_URL
  else process.env.NEXT_PUBLIC_SUPABASE_URL = url
  if (key === undefined) delete process.env.SUPABASE_SERVICE_ROLE_KEY
  else process.env.SUPABASE_SERVICE_ROLE_KEY = key
}

beforeEach(() => setEnv('https://placeholder.supabase.co', 'service-role-de-prueba'))
afterAll(() => { process.env = envOriginal })

describe('hasServiceRoleCredentials', () => {
  it('con URL y key → true', () => {
    expect(hasServiceRoleCredentials()).toBe(true)
  })

  it('sin service-role key (el caso del build en CI) → false', () => {
    setEnv('https://placeholder.supabase.co', undefined)
    expect(hasServiceRoleCredentials()).toBe(false)
  })

  it('sin URL → false', () => {
    setEnv(undefined, 'service-role-de-prueba')
    expect(hasServiceRoleCredentials()).toBe(false)
  })

  it('key vacía cuenta como ausente', () => {
    setEnv('https://placeholder.supabase.co', '')
    expect(hasServiceRoleCredentials()).toBe(false)
  })
})

describe('createServiceRoleClient', () => {
  it('con credenciales completas construye el cliente', () => {
    expect(createServiceRoleClient()).toBeTruthy()
  })

  it('sin key falla nombrando la variable, no con "supabaseKey is required"', () => {
    setEnv('https://placeholder.supabase.co', undefined)
    expect(() => createServiceRoleClient()).toThrow(/SUPABASE_SERVICE_ROLE_KEY/)
  })

  it('sin URL falla nombrando la variable', () => {
    setEnv(undefined, 'service-role-de-prueba')
    expect(() => createServiceRoleClient()).toThrow(/NEXT_PUBLIC_SUPABASE_URL/)
  })
})
