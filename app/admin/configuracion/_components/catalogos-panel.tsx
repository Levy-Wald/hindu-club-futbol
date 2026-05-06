'use client'

import { useState, useTransition, useMemo } from 'react'
import { toast } from 'sonner'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Plus, Search, Users, Trophy, Heart, FileText, Briefcase } from 'lucide-react'
import { crearItemCatalogo, toggleItemCatalogo } from '../_actions'

interface CatalogoItem {
  slug: string
  nombre: string
  id?: number
  descripcion?: string | null
  categoria?: string | null
  activo: boolean
}

// Each catalog definition
interface CatalogoDef {
  key: string
  tabla: string
  label: string
  usesSlugAsPK: boolean
  showCategoria: boolean
}

// Group definitions
interface CatalogoGroup {
  key: string
  label: string
  icon: React.ElementType
  catalogs: CatalogoDef[]
}

const GROUPS: CatalogoGroup[] = [
  {
    key: 'club',
    label: 'Club y socios',
    icon: Users,
    catalogs: [
      { key: 'atributos', tabla: 'catalogo_atributos', label: 'Atributos / Roles', usesSlugAsPK: true, showCategoria: true },
      { key: 'tiposSocio', tabla: 'catalogo_tipos_socio', label: 'Tipos de socio', usesSlugAsPK: false, showCategoria: false },
      { key: 'estadosPadron', tabla: 'catalogo_estados_padron', label: 'Estados de padron', usesSlugAsPK: false, showCategoria: false },
      { key: 'motivosBaja', tabla: 'catalogo_motivos_baja', label: 'Motivos de baja', usesSlugAsPK: true, showCategoria: false },
      { key: 'tiposVinculo', tabla: 'catalogo_tipos_vinculo', label: 'Tipos de vinculo', usesSlugAsPK: true, showCategoria: true },
    ],
  },
  {
    key: 'deportivo',
    label: 'Deportivo',
    icon: Trophy,
    catalogs: [
      { key: 'rolesEquipo', tabla: 'catalogo_roles_equipo', label: 'Roles de equipo', usesSlugAsPK: true, showCategoria: true },
      { key: 'disciplinas', tabla: 'catalogo_disciplinas', label: 'Disciplinas', usesSlugAsPK: true, showCategoria: true },
      { key: 'nivelesCompetencia', tabla: 'catalogo_niveles_competencia', label: 'Niveles de competencia', usesSlugAsPK: true, showCategoria: false },
    ],
  },
  {
    key: 'salud',
    label: 'Salud y documentos',
    icon: Heart,
    catalogs: [
      { key: 'tiposDocumento', tabla: 'catalogo_tipos_documento', label: 'Tipos de documento', usesSlugAsPK: true, showCategoria: false },
      { key: 'tiposEstudio', tabla: 'catalogo_tipos_estudio', label: 'Tipos de estudio medico', usesSlugAsPK: true, showCategoria: false },
      { key: 'obrasSociales', tabla: 'catalogo_obras_sociales', label: 'Obras sociales / Prepagas', usesSlugAsPK: true, showCategoria: false },
    ],
  },
  {
    key: 'rrhh',
    label: 'RRHH',
    icon: Briefcase,
    catalogs: [
      { key: 'areasTrabajo', tabla: 'catalogo_areas_trabajo', label: 'Areas de trabajo', usesSlugAsPK: true, showCategoria: false },
      { key: 'puestos', tabla: 'catalogo_puestos', label: 'Puestos laborales', usesSlugAsPK: true, showCategoria: false },
      { key: 'rolesLaborales', tabla: 'catalogo_roles_laborales', label: 'Roles laborales', usesSlugAsPK: true, showCategoria: false },
    ],
  },
]

interface CatalogosPanelProps {
  atributos: CatalogoItem[]
  estadosPadron: CatalogoItem[]
  tiposSocio: CatalogoItem[]
  rolesEquipo: CatalogoItem[]
  motivosBaja: CatalogoItem[]
  tiposVinculo: CatalogoItem[]
  disciplinas: CatalogoItem[]
  nivelesCompetencia: CatalogoItem[]
  tiposDocumento: CatalogoItem[]
  tiposEstudio: CatalogoItem[]
  obrasSociales: CatalogoItem[]
  areasTrabajo: CatalogoItem[]
  puestos: CatalogoItem[]
  rolesLaborales: CatalogoItem[]
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
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    if (!search.trim()) return items
    const q = search.toLowerCase()
    return items.filter(
      (i) => i.nombre.toLowerCase().includes(q) || i.slug.toLowerCase().includes(q)
    )
  }, [items, search])

  function handleToggle(item: CatalogoItem) {
    const id = usesSlugAsPK ? item.slug : String(item.id)
    startTransition(async () => {
      const result = await toggleItemCatalogo(tabla, id)
      if (result.ok) toast.success(result.message)
      else toast.error(result.message)
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

  return (
    <div className="space-y-4">
      {/* Search + summary */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Buscar..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-8 text-sm"
          />
        </div>
        <span className="text-xs text-muted-foreground shrink-0">
          {activos}/{items.length} activos
        </span>
      </div>

      {/* Create form */}
      <form onSubmit={handleCreate} className="flex flex-wrap items-end gap-2 rounded-lg border border-dashed bg-muted/20 p-3">
        <div className="space-y-1 flex-1 min-w-[120px]">
          <Label className="text-[11px] text-muted-foreground">Slug</Label>
          <Input
            placeholder="ej: nuevo_item"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            className="h-8 text-sm"
          />
        </div>
        <div className="space-y-1 flex-1 min-w-[120px]">
          <Label className="text-[11px] text-muted-foreground">Nombre</Label>
          <Input
            placeholder="ej: Nuevo Item"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className="h-8 text-sm"
          />
        </div>
        {showCategoria && (
          <div className="space-y-1 flex-1 min-w-[100px]">
            <Label className="text-[11px] text-muted-foreground">Categoria</Label>
            <Input
              placeholder="ej: deportivo"
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              className="h-8 text-sm"
            />
          </div>
        )}
        <Button type="submit" disabled={isPending} size="sm" className="gap-1 h-8">
          <Plus className="h-3 w-3" />
          Agregar
        </Button>
      </form>

      {/* List */}
      <div className="rounded-lg border divide-y overflow-hidden">
        {filtered.length === 0 && (
          <p className="text-sm text-muted-foreground px-4 py-6 text-center">
            {items.length === 0 ? 'Sin items cargados.' : 'Sin resultados.'}
          </p>
        )}
        {filtered.map((item) => (
          <div
            key={item.slug + (item.id ?? '')}
            className={`flex items-center justify-between gap-3 px-4 py-2.5 transition-colors ${
              !item.activo ? 'bg-muted/20 opacity-60' : ''
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <span className={`shrink-0 w-1.5 h-1.5 rounded-full ${item.activo ? 'bg-emerald-500' : 'bg-muted-foreground/30'}`} />
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{item.nombre}</p>
                <p className="text-[11px] text-muted-foreground truncate font-mono">{item.slug}</p>
              </div>
              {item.categoria && (
                <Badge variant="secondary" className="text-[10px] shrink-0">{item.categoria}</Badge>
              )}
            </div>
            <Switch
              checked={item.activo}
              onCheckedChange={() => handleToggle(item)}
              disabled={isPending}
            />
          </div>
        ))}
      </div>
    </div>
  )
}

export function CatalogosPanel(data: CatalogosPanelProps) {
  const dataMap: Record<string, CatalogoItem[]> = {
    atributos: data.atributos,
    estadosPadron: data.estadosPadron,
    tiposSocio: data.tiposSocio,
    rolesEquipo: data.rolesEquipo,
    motivosBaja: data.motivosBaja,
    tiposVinculo: data.tiposVinculo,
    disciplinas: data.disciplinas,
    nivelesCompetencia: data.nivelesCompetencia,
    tiposDocumento: data.tiposDocumento,
    tiposEstudio: data.tiposEstudio,
    obrasSociales: data.obrasSociales,
  }

  const totalItems = Object.values(dataMap).reduce((sum, arr) => sum + arr.length, 0)

  const [activeGroup, setActiveGroup] = useState(GROUPS[0].key)
  const [activeCatalog, setActiveCatalog] = useState(GROUPS[0].catalogs[0].key)

  const currentGroup = GROUPS.find((g) => g.key === activeGroup) ?? GROUPS[0]

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Catalogos del sistema</h2>
          <p className="text-sm text-muted-foreground">
            Valores de referencia que se usan en toda la plataforma.
          </p>
        </div>
        <Badge variant="secondary" className="text-xs">{totalItems} items</Badge>
      </div>

      {/* Group tabs */}
      <Tabs
        value={activeGroup}
        onValueChange={(v) => {
          setActiveGroup(v)
          const group = GROUPS.find((g) => g.key === v)
          if (group) setActiveCatalog(group.catalogs[0].key)
        }}
      >
        <TabsList className="w-full flex overflow-x-auto">
          {GROUPS.map((g) => {
            const count = g.catalogs.reduce((sum, c) => sum + (dataMap[c.key]?.length ?? 0), 0)
            return (
              <TabsTrigger key={g.key} value={g.key} className="gap-1.5 text-sm">
                <g.icon className="h-3.5 w-3.5" />
                {g.label}
                <Badge variant="secondary" className="text-[10px] h-4 px-1.5 ml-0.5">{count}</Badge>
              </TabsTrigger>
            )
          })}
        </TabsList>

        {GROUPS.map((group) => (
          <TabsContent key={group.key} value={group.key} className="mt-4">
            <Tabs value={activeCatalog} onValueChange={setActiveCatalog}>
              <TabsList className="w-full flex overflow-x-auto h-auto flex-wrap gap-1 bg-muted/40 p-1 rounded-lg">
                {group.catalogs.map((cat) => {
                  const count = dataMap[cat.key]?.length ?? 0
                  return (
                    <TabsTrigger key={cat.key} value={cat.key} className="text-xs gap-1 rounded-md px-2.5 py-1.5">
                      {cat.label}
                      <span className="text-[10px] text-muted-foreground tabular-nums">{count}</span>
                    </TabsTrigger>
                  )
                })}
              </TabsList>

              {group.catalogs.map((cat) => (
                <TabsContent key={cat.key} value={cat.key} className="mt-4">
                  <CatalogoList
                    items={dataMap[cat.key] ?? []}
                    tabla={cat.tabla}
                    usesSlugAsPK={cat.usesSlugAsPK}
                    showCategoria={cat.showCategoria}
                  />
                </TabsContent>
              ))}
            </Tabs>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
