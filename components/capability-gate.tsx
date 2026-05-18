'use client'

import { useCapabilities, useUserAttributes, can, canAny } from '@/lib/permissions/capabilities-context'
import { isAdmin } from '@/lib/navigation/filter'
import type { ReactNode } from 'react'

export function CapabilityGate({
  capability,
  anyOf,
  children,
}: {
  capability?: string
  anyOf?: string[]
  children: ReactNode
}) {
  const caps = useCapabilities()
  const attrs = useUserAttributes()
  if (isAdmin(attrs)) return <>{children}</>
  if (capability && !can(caps, capability)) return null
  if (anyOf && !canAny(caps, anyOf)) return null
  return <>{children}</>
}
