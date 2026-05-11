'use client'

import { useState, useEffect, type ReactNode } from 'react'
import { Loader2 } from 'lucide-react'

/**
 * Wrapper that delays rendering children until after client-side mount.
 * Use to wrap components with base-ui hydration issues (Select, Dialog, Checkbox).
 * Children are NOT server-rendered — they only render client-side.
 */
export function ClientOnly({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  if (!mounted) {
    return <>{fallback ?? <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>}</>
  }
  return <>{children}</>
}
