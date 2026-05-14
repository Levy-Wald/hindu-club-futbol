'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Plus } from 'lucide-react'
import { agregarResponsableAProductoAction } from '../lib/actions'
import type { RolResponsable } from '../lib/tipos'
import { useRouter } from 'next/navigation'

const ROL_OPTIONS: { value: RolResponsable; label: string }[] = [
  { value: 'general', label: 'General' },
  { value: 'compras', label: 'Compras' },
  { value: 'stock', label: 'Stock' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'product_owner', label: 'Product Owner' },
  { value: 'qa', label: 'QA' },
  { value: 'logistica', label: 'Logistica' },
  { value: 'ventas', label: 'Ventas' },
]

interface ResponsableFormDialogProps {
  productoId: string
  personas: { id: string; nombre: string; apellido: string }[]
  atributos: { slug: string; nombre: string }[]
}

export function ResponsableFormDialog({
  productoId,
  personas,
  atributos,
}: ResponsableFormDialogProps) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const [tipoResp, setTipoResp] = useState<'persona' | 'atributo'>('persona')
  const [personaId, setPersonaId] = useState('')
  const [atributoSlug, setAtributoSlug] = useState('')
  const [rol, setRol] = useState<RolResponsable>('general')
  const [notas, setNotas] = useState('')

  function resetForm() {
    setTipoResp('persona')
    setPersonaId('')
    setAtributoSlug('')
    setRol('general')
    setNotas('')
  }

  function handleSubmit() {
    startTransition(async () => {
      const res = await agregarResponsableAProductoAction({
        producto_id: productoId,
        persona_id: tipoResp === 'persona' ? personaId || null : null,
        atributo_slug: tipoResp === 'atributo' ? atributoSlug || null : null,
        rol,
        notas,
      })
      if (res.ok) {
        setOpen(false)
        resetForm()
        router.refresh()
      } else {
        alert(res.error)
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" size="sm" />}>
        <Plus className="h-4 w-4 mr-1" />
        Agregar responsable
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Agregar responsable</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Asignar a</Label>
            <Select value={tipoResp} onValueChange={(v) => setTipoResp((v ?? 'persona') as 'persona' | 'atributo')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="persona">Persona</SelectItem>
                <SelectItem value="atributo">Atributo (rol)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {tipoResp === 'persona' ? (
            <div className="space-y-2">
              <Label>Persona</Label>
              <Select value={personaId} onValueChange={(v) => setPersonaId(v ?? '')}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar persona..." />
                </SelectTrigger>
                <SelectContent>
                  {personas.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.apellido}, {p.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className="space-y-2">
              <Label>Atributo</Label>
              <Select value={atributoSlug} onValueChange={(v) => setAtributoSlug(v ?? '')}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar atributo..." />
                </SelectTrigger>
                <SelectContent>
                  {atributos.map((a) => (
                    <SelectItem key={a.slug} value={a.slug}>
                      {a.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label>Rol</Label>
            <Select value={rol} onValueChange={(v) => setRol((v ?? 'general') as RolResponsable)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ROL_OPTIONS.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Notas</Label>
            <Textarea value={notas} onChange={(e) => setNotas(e.target.value)} rows={2} />
          </div>

          <Button onClick={handleSubmit} disabled={isPending} className="w-full">
            {isPending ? 'Guardando...' : 'Agregar'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
