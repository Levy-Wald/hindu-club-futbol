'use client'

import { useState, useEffect } from 'react'
import { TrayectoriaTimeline } from './trayectoria-timeline'
import type { TrayectoriaClub, Logro } from '../lib/tipos'
import { Loader2 } from 'lucide-react'

interface SeccionTrayectoriaProps {
  personaId: string
}

export function SeccionTrayectoria({ personaId }: SeccionTrayectoriaProps) {
  const [trayectoria, setTrayectoria] = useState<TrayectoriaClub[]>([])
  const [logros, setLogros] = useState<Logro[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/historial-deportivo/${personaId}`)
        if (res.ok) {
          const data = await res.json()
          setTrayectoria(data.trayectoria)
          setLogros(data.logros)
        }
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [personaId])

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <TrayectoriaTimeline
      personaId={personaId}
      trayectoriaInicial={trayectoria}
      logrosInicial={logros}
    />
  )
}
