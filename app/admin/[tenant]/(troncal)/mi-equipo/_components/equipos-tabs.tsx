'use client'

import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Trophy } from 'lucide-react'
import type { ReactNode } from 'react'

interface EquiposTabsProps {
  equipos: { id: string; nombre: string }[]
  children: ReactNode[]
}

export function EquiposTabs({ equipos, children }: EquiposTabsProps) {
  return (
    <Tabs defaultValue={0}>
      <TabsList>
        {equipos.map((eq, i) => (
          <TabsTrigger key={eq.id} value={i}>
            <Trophy className="h-3.5 w-3.5" />
            {eq.nombre}
          </TabsTrigger>
        ))}
      </TabsList>
      {equipos.map((eq, i) => (
        <TabsContent key={eq.id} value={i}>
          {children[i]}
        </TabsContent>
      ))}
    </Tabs>
  )
}
