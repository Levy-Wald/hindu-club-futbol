'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { agregarEquipoAction } from '../lib/actions'
import type { Categoria, EquipoPropio } from '../lib/types'

export function ModalAgregarEquipo({
  torneoId,
  categorias,
  equiposPropios,
  onClose,
}: {
  torneoId: string
  categorias: Categoria[]
  equiposPropios: EquipoPropio[]
  onClose: () => void
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [tipoTab, setTipoTab] = useState('propio')
  const [categoriaId, setCategoriaId] = useState('')
  const [equipoId, setEquipoId] = useState('')
  const [externoNombre, setExternoNombre] = useState('')
  const [error, setError] = useState('')

  function handleSubmit() {
    if (tipoTab === 'propio' && !equipoId) {
      setError('Selecciona un equipo')
      return
    }
    if (tipoTab === 'externo' && !externoNombre.trim()) {
      setError('El nombre del equipo externo es obligatorio')
      return
    }

    startTransition(async () => {
      const result = await agregarEquipoAction({
        torneo_id: torneoId,
        categoria_id: categoriaId || undefined,
        equipo_id: tipoTab === 'propio' ? equipoId : undefined,
        equipo_externo_nombre: tipoTab === 'externo' ? externoNombre.trim() : undefined,
      })

      if (!result.ok) {
        setError(result.error)
        return
      }

      router.refresh()
      onClose()
    })
  }

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent data-testid="modal-agregar-equipo">
        <DialogHeader>
          <DialogTitle>Agregar equipo</DialogTitle>
        </DialogHeader>

        {error && (
          <div className="text-sm text-destructive bg-destructive/10 p-2 rounded">
            {error}
          </div>
        )}

        {categorias.length > 0 && (
          <div>
            <Label>Categoria</Label>
            <Select
              value={categoriaId}
              onValueChange={(v) => setCategoriaId(v === '__none__' ? '' : (v ?? ''))}
            >
              <SelectTrigger data-testid="select-categoria-equipo">
                <SelectValue placeholder="Sin categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Sin categoria</SelectItem>
                {categorias.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <Tabs value={tipoTab} onValueChange={setTipoTab}>
          <TabsList className="w-full">
            <TabsTrigger value="propio" className="flex-1" data-testid="tab-equipo-propio">
              Equipo propio
            </TabsTrigger>
            <TabsTrigger value="externo" className="flex-1" data-testid="tab-equipo-externo">
              Equipo externo
            </TabsTrigger>
          </TabsList>
          <TabsContent value="propio">
            <Select
              value={equipoId}
              onValueChange={(v) => setEquipoId(v ?? '')}
            >
              <SelectTrigger data-testid="select-equipo-propio">
                <SelectValue placeholder="Seleccionar equipo..." />
              </SelectTrigger>
              <SelectContent>
                {equiposPropios.map((eq) => (
                  <SelectItem key={eq.id} value={eq.id}>
                    {eq.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </TabsContent>
          <TabsContent value="externo">
            <Input
              data-testid="input-equipo-externo"
              value={externoNombre}
              onChange={(e) => setExternoNombre(e.target.value)}
              placeholder="Nombre del equipo externo"
            />
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isPending}
            data-testid="btn-inscribir-equipo"
          >
            {isPending ? 'Agregando...' : 'Agregar'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
