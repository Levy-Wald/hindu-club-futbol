'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'
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

const CATEGORIA_ICONS: Record<string, { emoji: string; color: string }> = {
  tronco:      { emoji: '🏛️', color: 'bg-slate-100 text-slate-700' },
  disciplina:  { emoji: '⚽', color: 'bg-green-100 text-green-700' },
  vertical:    { emoji: '📐', color: 'bg-violet-100 text-violet-700' },
  canal:       { emoji: '📡', color: 'bg-sky-100 text-sky-700' },
  integracion: { emoji: '🔗', color: 'bg-amber-100 text-amber-700' },
  premium:     { emoji: '⭐', color: 'bg-yellow-100 text-yellow-700' },
  operaciones: { emoji: '⚙️', color: 'bg-orange-100 text-orange-700' },
  financiero:  { emoji: '💰', color: 'bg-emerald-100 text-emerald-700' },
}

export function ModulosPanel({ modulos }: ModulosPanelProps) {
  const [isPending, startTransition] = useTransition()
  const [search, setSearch] = useState('')

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

  const filtered = search.trim()
    ? modulos.filter((m) =>
        m.nombre.toLowerCase().includes(search.toLowerCase()) ||
        m.slug.toLowerCase().includes(search.toLowerCase()) ||
        (m.descripcion ?? '').toLowerCase().includes(search.toLowerCase())
      )
    : modulos

  const categorias = [...new Set(modulos.map((m) => m.categoria ?? 'General'))]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <h2 className="text-xl font-semibold tracking-tight">Modulos disponibles</h2>
        <p className="text-sm text-muted-foreground">
          Activa y desactiva los modulos de tu plataforma. Cada modulo agrega funcionalidades especificas.
        </p>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          placeholder="Buscar modulo..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {filtered.length === 0 && search.trim() && (
        <div className="text-center py-10">
          <p className="text-sm text-muted-foreground">
            Ningun modulo coincide con &ldquo;{search}&rdquo;.
          </p>
        </div>
      )}

      {categorias.map((cat) => {
        const catModulos = filtered.filter((m) => (m.categoria ?? 'General') === cat)
        if (catModulos.length === 0) return null

        const activosCount = catModulos.filter((m) => m.activado).length
        const icon = CATEGORIA_ICONS[cat] ?? { emoji: '📦', color: 'bg-gray-100 text-gray-700' }

        return (
          <div key={cat} className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-base select-none ${icon.color}`}
                  aria-hidden="true"
                >
                  {icon.emoji}
                </span>
                <h3 className="text-sm font-semibold text-foreground">
                  {CATEGORIA_LABELS[cat] ?? cat}
                </h3>
              </div>
              <Badge variant="secondary" className="text-xs tabular-nums">
                {activosCount}/{catModulos.length} activos
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {catModulos.map((modulo) => (
                <Card
                  key={modulo.slug}
                  className={`relative transition-all overflow-hidden ${
                    modulo.activado
                      ? 'border-l-4 border-l-green-500 shadow-sm'
                      : 'border-l-4 border-l-transparent opacity-80 hover:opacity-100'
                  }`}
                >
                  <CardHeader className="pb-2 pt-4 px-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className={`inline-flex items-center justify-center w-9 h-9 rounded-xl text-lg shrink-0 select-none ${icon.color}`}
                          aria-hidden="true"
                        >
                          {icon.emoji}
                        </span>
                        <CardTitle className="text-sm font-semibold leading-tight">
                          {modulo.nombre}
                        </CardTitle>
                      </div>
                      <Switch
                        checked={modulo.activado}
                        onCheckedChange={() => handleToggle(modulo.slug)}
                        disabled={isPending}
                        className="shrink-0 mt-0.5"
                      />
                    </div>

                    <div className="flex items-center gap-2 pl-11 flex-wrap">
                      {modulo.activado && (
                        <Badge className="text-xs bg-green-100 text-green-700 hover:bg-green-100 border-0">
                          Activo
                        </Badge>
                      )}
                      {modulo.precio != null && modulo.precio > 0 && (
                        <Badge variant="outline" className="text-xs">
                          USD {modulo.precio}/mes
                        </Badge>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="px-4 pb-4 pt-0 pl-[3.75rem]">
                    <CardDescription className="text-xs leading-relaxed">
                      {modulo.descripcion ?? 'Sin descripcion'}
                    </CardDescription>
                    {modulo.fechaActivacion && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Activo desde{' '}
                        {new Date(modulo.fechaActivacion).toLocaleDateString('es-AR', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
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
