'use client'

import { useState, useTransition, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Plus } from 'lucide-react'
import { crearListaPreciosAction, editarListaPreciosAction } from '../lib/actions'
import type { ListaPrecios, TipoLista } from '../lib/tipos'
import { useRouter } from 'next/navigation'

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/(^_|_$)/g, '')
}

interface ListaPreciosFormDialogProps {
  mode: 'create' | 'edit'
  lista?: ListaPrecios
  triggerRender?: React.ReactElement
  triggerLabel?: string
}

export function ListaPreciosFormDialog({
  mode,
  lista,
  triggerRender,
  triggerLabel,
}: ListaPreciosFormDialogProps) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const [nombre, setNombre] = useState(lista?.nombre ?? '')
  const [slug, setSlug] = useState(lista?.slug ?? '')
  const [descripcion, setDescripcion] = useState(lista?.descripcion ?? '')
  const [tipo, setTipo] = useState<TipoLista>(lista?.tipo ?? 'venta')
  type Moneda = 'ARS' | 'USD' | 'EUR' | 'BRL' | 'UYU' | 'CLP'
  const [moneda, setMoneda] = useState<Moneda>((lista?.moneda ?? 'ARS') as Moneda)
  const [activa, setActiva] = useState(lista?.activa ?? true)
  const [esDefault, setEsDefault] = useState(lista?.es_default ?? false)
  const [orden, setOrden] = useState(String(lista?.orden ?? 0))
  const [slugManual, setSlugManual] = useState(mode === 'edit')

  useEffect(() => {
    if (!slugManual && mode === 'create') {
      setSlug(slugify(nombre))
    }
  }, [nombre, slugManual, mode])

  function handleSubmit() {
    startTransition(async () => {
      const payload = {
        slug,
        nombre: nombre.trim(),
        descripcion,
        tipo,
        moneda,
        activa,
        es_default: esDefault,
        orden: parseInt(orden) || 0,
      }

      const res = mode === 'edit' && lista
        ? await editarListaPreciosAction({ id: lista.id, ...payload })
        : await crearListaPreciosAction(payload)

      if (res.ok) {
        setOpen(false)
        router.refresh()
      } else {
        alert(res.error)
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={triggerRender ?? <Button variant="outline" size="sm" />}>
        {triggerLabel ?? (
          <>
            <Plus className="h-4 w-4 mr-1" />
            Nueva lista de precios
          </>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{mode === 'edit' ? 'Editar lista' : 'Nueva lista de precios'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Nombre</Label>
            <Input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej: Venta B2B Premium" />
          </div>

          <div className="space-y-2">
            <Label>Slug</Label>
            <Input
              value={slug}
              onChange={(e) => { setSlug(e.target.value); setSlugManual(true) }}
              placeholder="venta_b2b_premium"
            />
          </div>

          <div className="space-y-2">
            <Label>Descripcion</Label>
            <Textarea value={descripcion} onChange={(e) => setDescripcion(e.target.value)} rows={2} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={tipo} onValueChange={(v) => setTipo((v ?? 'venta') as TipoLista)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="compra">Compra</SelectItem>
                  <SelectItem value="costo">Costo</SelectItem>
                  <SelectItem value="venta">Venta</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Moneda</Label>
              <Select value={moneda} onValueChange={(v) => setMoneda((v ?? 'ARS') as Moneda)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ARS">ARS</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                  <SelectItem value="BRL">BRL</SelectItem>
                  <SelectItem value="UYU">UYU</SelectItem>
                  <SelectItem value="CLP">CLP</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Orden</Label>
            <Input type="number" value={orden} onChange={(e) => setOrden(e.target.value)} min={0} />
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Switch checked={activa} onCheckedChange={setActiva} />
              <Label>Activa</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={esDefault} onCheckedChange={setEsDefault} />
              <Label>Default</Label>
            </div>
          </div>

          <Button onClick={handleSubmit} disabled={isPending} className="w-full">
            {isPending ? 'Guardando...' : mode === 'edit' ? 'Guardar' : 'Crear'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
