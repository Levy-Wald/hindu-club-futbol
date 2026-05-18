'use client'

import { useCapabilities, can, canAny } from '@/lib/permissions/capabilities-context'
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
  if (capability && !can(caps, capability)) return null
  if (anyOf && !canAny(caps, anyOf)) return null
  return <>{children}</>
}
