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
  precio: number | null
  activo: boolean
  activado: boolean
  fechaActivacion: string | null
}

interface ModulosPanelProps {
  modulos: Modulo[]
}

const CATEGORIA_LABELS: Record<string, string> = {
  tronco: 'Tronco',
  disciplina: 'Disciplinas Deportivas',
  vertical: 'Verticales',
  canal: 'Canales',
  integracion: 'Integraciones',
  premium: 'Premium',
  operaciones: 'Operaciones',
  financiero: 'Financiero',
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
    <div className="space-y-8">
      {categorias.map((cat) => {
        const catModulos = modulos.filter((m) => (m.categoria ?? 'General') === cat)
        const activosCount = catModulos.filter((m) => m.activado).length

        return (
          <div key={cat} className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                {CATEGORIA_LABELS[cat] ?? cat}
              </h3>
              <Badge variant="secondary" className="text-xs">
                {activosCount}/{catModulos.length} activos
              </Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {catModulos.map((modulo) => (
                <Card
                  key={modulo.slug}
                  className={`relative transition-colors ${modulo.activado ? 'ring-1 ring-primary/20' : 'opacity-75'}`}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between gap-2">
                      <CardTitle className="text-sm font-medium">{modulo.nombre}</CardTitle>
                      <Switch
                        checked={modulo.activado}
                        onCheckedChange={() => handleToggle(modulo.slug)}
                        disabled={isPending}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      {modulo.precio != null && modulo.precio > 0 && (
                        <Badge variant="outline" className="text-xs">
                          USD {modulo.precio}/mes
                        </Badge>
                      )}
                      {modulo.activado && (
                        <Badge variant="default" className="text-xs">
                          Activo
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-xs">
                      {modulo.descripcion ?? 'Sin descripcion'}
                    </CardDescription>
                    {modulo.fechaActivacion && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Desde {new Date(modulo.fechaActivacion).toLocaleDateString('es-AR')}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )
      })}

      {modulos.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground text-sm">No hay modulos disponibles en el catalogo.</p>
          <p className="text-xs text-muted-foreground mt-1">
            Los modulos se cargan desde la tabla catalogo_modulos.
          </p>
        </div>
      )}
    </div>
  )
}
