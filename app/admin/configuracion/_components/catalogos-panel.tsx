'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { crearItemCatalogo, toggleItemCatalogo } from '../_actions'

interface CatalogoItem {
  slug: string
  nombre: string
  id?: number
  descripcion?: string | null
  categoria?: string | null
  activo: boolean
}

interface CatalogosPanelProps {
  atributos: CatalogoItem[]
  estadosPadron: CatalogoItem[]
  tiposSocio: CatalogoItem[]
  rolesEquipo: CatalogoItem[]
}

function CatalogoList({
  items,
  tabla,
  usesSlugAsPK,
  showCategoria = false,
}: {
  items: CatalogoItem[]
  tabla: string
  usesSlugAsPK: boolean
  showCategoria?: boolean
}) {
  const [isPending, startTransition] = useTransition()
  const [slug, setSlug] = useState('')
  const [nombre, setNombre] = useState('')
  const [categoria, setCategoria] = useState('')

  function handleToggle(item: CatalogoItem) {
    const id = usesSlugAsPK ? item.slug : String(item.id)
    startTransition(async () => {
      const result = await toggleItemCatalogo(tabla, id)
      if (result.ok) {
        toast.success(result.message)
      } else {
        toast.error(result.message)
      }
    })
  }

  function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!slug.trim() || !nombre.trim()) {
      toast.error('Slug y nombre son requeridos')
      return
    }
    startTransition(async () => {
      const result = await crearItemCatalogo(tabla, {
        slug: slug.trim(),
        nombre: nombre.trim(),
        categoria: categoria.trim() || undefined,
      })
      if (result.ok) {
        toast.success(result.message)
        setSlug('')
        setNombre('')
        setCategoria('')
      } else {
        toast.error(result.message)
      }
    })
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleCreate} className="flex flex-col sm:flex-row gap-2 p-3 border rounded-lg bg-muted/30">
        <Input
          placeholder="Slug"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          className="flex-1"
        />
        <Input
          placeholder="Nombre"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          className="flex-1"
        />
        {showCategoria && (
          <Input
            placeholder="Categoria"
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
            className="flex-1"
          />
        )}
        <Button type="submit" disabled={isPending} size="sm">
          Agregar
        </Button>
      </form>

      <div className="divide-y rounded-lg border">
        {items.length === 0 && (
          <p className="text-sm text-muted-foreground p-4">No hay items.</p>
        )}
        {items.map((item) => (
          <div
            key={item.slug + (item.id ?? '')}
            className="flex items-center justify-between gap-3 px-4 py-3"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{item.nombre}</p>
                <p className="text-xs text-muted-foreground truncate">{item.slug}</p>
              </div>
              {item.categoria && (
                <Badge variant="secondary" className="text-xs shrink-0">
                  {item.categoria}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Badge variant={item.activo ? 'default' : 'outline'} className="text-xs">
                {item.activo ? 'Activo' : 'Inactivo'}
              </Badge>
              <Switch
                checked={item.activo}
                onCheckedChange={() => handleToggle(item)}
                disabled={isPending}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function CatalogosPanel({ atributos, estadosPadron, tiposSocio, rolesEquipo }: CatalogosPanelProps) {
  return (
    <Tabs defaultValue="atributos" className="w-full">
      <TabsList className="w-full flex flex-wrap h-auto">
        <TabsTrigger value="atributos">Atributos</TabsTrigger>
        <TabsTrigger value="estados">Estados padron</TabsTrigger>
        <TabsTrigger value="tipos">Tipos socio</TabsTrigger>
        <TabsTrigger value="roles">Roles equipo</TabsTrigger>
      </TabsList>

      <TabsContent value="atributos" className="mt-4">
        <CatalogoList
          items={atributos}
          tabla="catalogo_atributos"
          usesSlugAsPK={true}
          showCategoria={true}
        />
      </TabsContent>

      <TabsContent value="estados" className="mt-4">
        <CatalogoList
          items={estadosPadron}
          tabla="catalogo_estados_padron"
          usesSlugAsPK={false}
        />
      </TabsContent>

      <TabsContent value="tipos" className="mt-4">
        <CatalogoList
          items={tiposSocio}
          tabla="catalogo_tipos_socio"
          usesSlugAsPK={false}
        />
      </TabsContent>

      <TabsContent value="roles" className="mt-4">
        <CatalogoList
          items={rolesEquipo}
          tabla="catalogo_roles_equipo"
          usesSlugAsPK={true}
          showCategoria={true}
        />
      </TabsContent>
    </Tabs>
  )
}
