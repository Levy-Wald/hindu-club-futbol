'use client'

import { createContext, useContext, type ReactNode } from 'react'

interface TenantContextValue {
  tenantId: string
}

const TenantContext = createContext<TenantContextValue>({ tenantId: '' })

export function TenantProvider({ tenantId, children }: { tenantId: string; children: ReactNode }) {
  return (
    <TenantContext.Provider value={{ tenantId }}>
      {children}
    </TenantContext.Provider>
  )
}

export function useTenant() {
  const ctx = useContext(TenantContext)
  if (!ctx.tenantId) {
    throw new Error('useTenant must be used within a TenantProvider')
  }
  return ctx
}
