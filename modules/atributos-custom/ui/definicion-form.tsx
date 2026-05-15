'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { Loader2, Plus, X } from 'lucide-react'
import { crearDefinicion, actualizarDefinicion } from '../lib/actions'
import type { AtributoDefinicion, TipoDato, AplicaA } from '../lib/tipos'
import { TIPO_DATO_LABELS, APLICA_A_LABELS } from '../lib/tipos'

interface DefinicionFormProps {
  definicion?: AtributoDefinicion | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DefinicionForm({ definicion, open, onOpenChange }: DefinicionFormProps) {
  const isEdit = !!definicion
  const [loading, setLoading] = useState(false)
  const [nombre, setNombre] = useState(definicion?.nombre ?? '')
  const [slug, setSlug] = useState(definicion?.slug ?? '')
  const [descripcion, setDescripcion] = useState(definicion?.descripcion ?? '')
  const [aplicaA, setAplicaA] = useState<AplicaA>(definicion?.aplica_a ?? 'persona')
  const [tipoDato, setTipoDato] = useState<TipoDato>(definicion?.tipo_dato ?? 'texto')
  const [obligatorio, setObligatorio] = useState(definicion?.obligatorio ?? false)
  const [visibleListado, setVisibleListado] = useState(definicion?.visible_en_listado ?? false)
  const [visibleFiltro, setVisibleFiltro] = useState(definicion?.visible_en_filtro ?? false)
  const [orden, setOrden] = useState(definicion?.orden ?? 100)
  const [opciones, setOpciones] = useState<string[]>(
    (definicion?.opciones as string[] | null) ?? []
  )
  const [nuevaOpcion, setNuevaOpcion] = useState('')

  function autoSlug(name: string) {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_|_$/g, '')
  }

  async function handleSubmit() {
    if (!nombre.trim() || !slug.trim()) {
      toast.error('Nombre y slug son obligatorios')
      return
    }

    setLoading(true)
    let result
    if (isEdit) {
      result = await actualizarDefinicion(definicion!.id, {
        nombre: nombre.trim(),
        descripcion: descripcion.trim() || null,
        obligatorio,
        opciones,
        orden,
        visible_en_listado: visibleListado,
        visible_en_filtro: visibleFiltro,
      })
    } else {
      result = await crearDefinicion({
        slug: slug.trim(),
        nombre: nombre.trim(),
        descripcion: descripcion.trim() || undefined,
        aplica_a: aplicaA,
        tipo_dato: tipoDato,
        obligatorio,
        opciones,
        orden,
        visible_en_listado: visibleListado,
        visible_en_filtro: visibleFiltro,
      })
    }
    setLoading(false)

    if (result.ok) {
      toast.success(result.message)
      onOpenChange(false)
    } else {
      toast.error(result.message)
    }
  }

  function addOpcion() {
    const val = nuevaOpcion.trim()
    if (val && !opciones.includes(val)) {
      setOpciones([...opciones, val])
      setNuevaOpcion('')
    }
  }

  const needsOpciones = tipoDato === 'select' || tipoDato === 'multi_select'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar definición' : 'Nueva definición de atributo'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Nombre *</Label>
              <Input
                value={nombre}
                onChange={(e) => {
                  setNombre(e.target.value)
                  if (!isEdit) setSlug(autoSlug(e.target.value))
                }}
                placeholder="Talla de camiseta"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Slug *</Label>
              <Input
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="talla_camiseta"
                disabled={isEdit}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Descripción</Label>
            <Textarea
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              rows={2}
              placeholder="Descripción opcional..."
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Aplica a *</Label>
              <Select
                value={aplicaA}
                onValueChange={(v) => setAplicaA((v ?? 'persona') as AplicaA)}
                disabled={isEdit}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(APLICA_A_LABELS) as AplicaA[]).map((k) => (
                    <SelectItem key={k} value={k}>{APLICA_A_LABELS[k]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Tipo de dato *</Label>
              <Select
                value={tipoDato}
                onValueChange={(v) => setTipoDato((v ?? 'texto') as TipoDato)}
                disabled={isEdit}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(TIPO_DATO_LABELS) as TipoDato[]).map((k) => (
                    <SelectItem key={k} value={k}>{TIPO_DATO_LABELS[k]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {needsOpciones && (
            <div className="space-y-2">
              <Label>Opciones</Label>
              <div className="flex gap-2">
                <Input
                  value={nuevaOpcion}
                  onChange={(e) => setNuevaOpcion(e.target.value)}
                  placeholder="Nueva opción..."
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addOpcion() } }}
                />
                <Button type="button" size="icon" variant="outline" onClick={addOpcion}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {opciones.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {opciones.map((op) => (
                    <span key={op} className="inline-flex items-center gap-1 bg-muted px-2 py-1 rounded text-sm">
                      {op}
                      <button onClick={() => setOpciones(opciones.filter((o) => o !== op))}>
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="space-y-1.5">
            <Label>Orden</Label>
            <Input
              type="number"
              value={orden}
              onChange={(e) => setOrden(parseInt(e.target.value) || 100)}
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Switch checked={obligatorio} onCheckedChange={setObligatorio} />
              <Label>Obligatorio</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={visibleListado} onCheckedChange={setVisibleListado} />
              <Label>Visible en listado</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={visibleFiltro} onCheckedChange={setVisibleFiltro} />
              <Label>Visible en filtros</Label>
            </div>
          </div>

          <Button onClick={handleSubmit} disabled={loading} className="w-full">
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEdit ? 'Guardar cambios' : 'Crear definición'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
