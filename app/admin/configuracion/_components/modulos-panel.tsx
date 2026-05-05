'use client'

import { useTransition } from 'react'
import { toast } from 'sonner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { toggleModulo } from '../_actions'

interface Modulo {
  slug: string
  nombre: string
  descripcion: string | null
  categoria: string | null
  version: string | null
  activo: boolean
  activado: boolean
  fechaActivacion: string | null
}

interface ModulosPanelProps {
  modulos: Modulo[]
}

export function ModulosPanel({ modulos }: ModulosPanelProps) {
  const [isPending, startTransition] = useTransition()

  function handleToggle(slug: string) {
    startTransition(async () => {
      const result = await toggleModulo(slug)
      if (result.ok) {
        toast.success(result.message)
      } else {
        toast.error(result.message)
      }
    })
  }

  const categorias = [...new Set(modulos.map((m) => m.categoria ?? 'General'))]

  return (
    <div className="space-y-6">
      {categorias.map((cat) => (
        <div key={cat} className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            {cat}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {modulos
              .filter((m) => (m.categoria ?? 'General') === cat)
              .map((modulo) => (
                <Card key={modulo.slug} className="relative">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between gap-2">
                      <CardTitle className="text-base">{modulo.nombre}</CardTitle>
                      <Switch
                        checked={modulo.activado}
                        onCheckedChange={() => handleToggle(modulo.slug)}
                        disabled={isPending}
                      />
                    </div>
                    {modulo.version && (
                      <Badge variant="outline" className="w-fit text-xs">
                        v{modulo.version}
                      </Badge>
                    )}
                  </CardHeader>
                  <CardContent>
                    <CardDescription>
                      {modulo.descripcion ?? 'Sin descripcion'}
                    </CardDescription>
                    {modulo.fechaActivacion && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Activado: {new Date(modulo.fechaActivacion).toLocaleDateString('es-AR')}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
          </div>
        </div>
      ))}

      {modulos.length === 0 && (
        <p className="text-muted-foreground text-sm">No hay modulos disponibles.</p>
      )}
    </div>
  )
}
