'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Plus } from 'lucide-react'
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

  const activos = items.filter((i) => i.activo).length
  const inactivos = items.length - activos

  return (
    <div className="space-y-5">
      {/* Summary */}
      {items.length > 0 && (
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span>{items.length} items en total</span>
          <span className="text-green-600 font-medium">{activos} activos</span>
          {inactivos > 0 && <span>{inactivos} inactivos</span>}
        </div>
      )}

      {/* Create form */}
      <form
        onSubmit={handleCreate}
        className="rounded-xl border bg-muted/30 p-4 space-y-3"
      >
        <p className="text-sm font-semibold">Agregar nuevo item</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor={`slug-${tabla}`} className="text-xs">
              Slug <span className="text-muted-foreground">(identificador unico)</span>
            </Label>
            <Input
              id={`slug-${tabla}`}
              placeholder="ej: jugador-externo"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`nombre-${tabla}`} className="text-xs">
              Nombre <span className="text-muted-foreground">(visible en la UI)</span>
            </Label>
            <Input
              id={`nombre-${tabla}`}
              placeholder="ej: Jugador Externo"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
            />
          </div>
          {showCategoria && (
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor={`cat-${tabla}`} className="text-xs">
                Categoria <span className="text-muted-foreground">(opcional)</span>
              </Label>
              <Input
                id={`cat-${tabla}`}
                placeholder="ej: deportivo"
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
              />
            </div>
          )}
        </div>
        <div className="flex justify-end">
          <Button type="submit" disabled={isPending} size="sm" className="gap-1.5">
            <Plus className="h-3.5 w-3.5" />
            Agregar
          </Button>
        </div>
      </form>

      {/* List */}
      <div className="rounded-xl border divide-y overflow-hidden">
        {items.length === 0 && (
          <p className="text-sm text-muted-foreground px-5 py-6">
            No hay items. Usa el formulario de arriba para agregar el primero.
          </p>
        )}
        {items.map((item) => (
          <div
            key={item.slug + (item.id ?? '')}
            className={`flex items-center justify-between gap-4 px-5 py-3.5 transition-colors ${
              item.activo ? 'bg-background' : 'bg-muted/20'
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              {/* Active indicator dot */}
              <span
                className={`shrink-0 w-2 h-2 rounded-full ${
                  item.activo ? 'bg-green-500' : 'bg-muted-foreground/30'
                }`}
              />
              <div className="min-w-0">
                <p className={`text-sm font-medium truncate ${!item.activo && 'text-muted-foreground'}`}>
                  {item.nombre}
                </p>
                <p className="text-xs text-muted-foreground truncate font-mono">{item.slug}</p>
              </div>
              {item.categoria && (
                <Badge variant="secondary" className="text-xs shrink-0">
                  {item.categoria}
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <Badge
                variant={item.activo ? 'default' : 'outline'}
                className={`text-xs ${
                  item.activo
                    ? 'bg-green-100 text-green-700 hover:bg-green-100 border-0'
                    : 'text-muted-foreground'
                }`}
              >
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
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <h2 className="text-xl font-semibold tracking-tight">Catalogos del sistema</h2>
        <p className="text-sm text-muted-foreground">
          Configura los valores base que se usan en toda la plataforma: tipos de socio, estados de padron, roles de equipo y atributos.
        </p>
      </div>

      <Tabs defaultValue="atributos" className="w-full">
        <TabsList className="w-full flex h-auto flex-wrap gap-1 bg-muted/60 p-1 rounded-xl">
          <TabsTrigger value="atributos" className="flex items-center gap-1.5 rounded-lg text-sm">
            Atributos
            <span className="inline-flex items-center justify-center rounded-full bg-muted px-1.5 py-0.5 text-xs tabular-nums min-w-[1.4rem]">
              {atributos.length}
            </span>
          </TabsTrigger>
          <TabsTrigger value="estados" className="flex items-center gap-1.5 rounded-lg text-sm">
            Estados padron
            <span className="inline-flex items-center justify-center rounded-full bg-muted px-1.5 py-0.5 text-xs tabular-nums min-w-[1.4rem]">
              {estadosPadron.length}
            </span>
          </TabsTrigger>
          <TabsTrigger value="tipos" className="flex items-center gap-1.5 rounded-lg text-sm">
            Tipos socio
            <span className="inline-flex items-center justify-center rounded-full bg-muted px-1.5 py-0.5 text-xs tabular-nums min-w-[1.4rem]">
              {tiposSocio.length}
            </span>
          </TabsTrigger>
          <TabsTrigger value="roles" className="flex items-center gap-1.5 rounded-lg text-sm">
            Roles equipo
            <span className="inline-flex items-center justify-center rounded-full bg-muted px-1.5 py-0.5 text-xs tabular-nums min-w-[1.4rem]">
              {rolesEquipo.length}
            </span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="atributos" className="mt-5">
          <CatalogoList
            items={atributos}
            tabla="catalogo_atributos"
            usesSlugAsPK={true}
            showCategoria={true}
          />
        </TabsContent>

        <TabsContent value="estados" className="mt-5">
          <CatalogoList
            items={estadosPadron}
            tabla="catalogo_estados_padron"
            usesSlugAsPK={false}
          />
        </TabsContent>

        <TabsContent value="tipos" className="mt-5">
          <CatalogoList
            items={tiposSocio}
            tabla="catalogo_tipos_socio"
            usesSlugAsPK={false}
          />
        </TabsContent>

        <TabsContent value="roles" className="mt-5">
          <CatalogoList
            items={rolesEquipo}
            tabla="catalogo_roles_equipo"
            usesSlugAsPK={true}
            showCategoria={true}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
