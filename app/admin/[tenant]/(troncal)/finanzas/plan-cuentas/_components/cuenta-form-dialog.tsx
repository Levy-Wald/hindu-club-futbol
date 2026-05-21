'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import { crearCuenta, editarCuenta } from '@/modules/finanzas/lib/actions'
import type { CuentaNode } from './plan-cuentas-tree'

const TIPOS_CUENTA = [
  { value: 'activo', label: 'Activo' },
  { value: 'pasivo', label: 'Pasivo' },
  { value: 'patrimonio_neto', label: 'Patrimonio Neto' },
  { value: 'ingreso', label: 'Ingreso' },
  { value: 'egreso', label: 'Egreso' },
]

const MONEDAS = [
  { value: 'ARS', label: 'ARS' },
  { value: 'USD', label: 'USD' },
  { value: 'EUR', label: 'EUR' },
]

interface CuentaFormDialogProps {
  trigger: React.ReactNode
  cuenta?: CuentaNode
  parentCuenta?: CuentaNode
  allCuentas: { id: string; codigo: string; nombre: string; tipo: string; nivel: number }[]
}

export function CuentaFormDialog({ trigger, cuenta, parentCuenta, allCuentas }: CuentaFormDialogProps) {
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()

  const isEdit = !!cuenta
  const isSubCuenta = !!parentCuenta

  const defaultTipo = parentCuenta?.tipo ?? cuenta?.tipo ?? ''
  const defaultNivel = parentCuenta ? parentCuenta.nivel + 1 : (cuenta?.nivel ?? 1)
  const defaultPadreId = parentCuenta?.id ?? undefined

  const tipoLocked = isSubCuenta || (isEdit && !!cuenta)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    form.set('nivel', String(defaultNivel))
    if (defaultPadreId) form.set('cuenta_padre_id', defaultPadreId)
    if (tipoLocked && defaultTipo) form.set('tipo', defaultTipo)

    startTransition(async () => {
      const result = isEdit
        ? await editarCuenta(cuenta!.id, form)
        : await crearCuenta(form)

      if (result.success) {
        toast.success(isEdit ? 'Cuenta actualizada' : 'Cuenta creada')
        setOpen(false)
      } else {
        toast.error(result.error)
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger as React.ReactElement} />
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? 'Editar cuenta' : isSubCuenta ? `Nueva sub-cuenta de ${parentCuenta.codigo}` : 'Nueva cuenta'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="codigo">Codigo</Label>
              <Input id="codigo" name="codigo" required defaultValue={cuenta?.codigo ?? ''} placeholder="1.1.01" />
            </div>
            <div className="space-y-2">
              <Label>Nivel</Label>
              <Input value={defaultNivel} disabled />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="nombre">Nombre</Label>
            <Input id="nombre" name="nombre" required defaultValue={cuenta?.nombre ?? ''} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tipo">Tipo</Label>
            {tipoLocked ? (
              <Input value={TIPOS_CUENTA.find(t => t.value === defaultTipo)?.label ?? defaultTipo} disabled />
            ) : (
              <Select name="tipo" defaultValue={defaultTipo} required>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar..." />
                </SelectTrigger>
                <SelectContent>
                  {TIPOS_CUENTA.map(t => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {!isSubCuenta && !isEdit && (
            <div className="space-y-2">
              <Label htmlFor="cuenta_padre_id">Cuenta padre (opcional)</Label>
              <Select name="cuenta_padre_id" defaultValue="">
                <SelectTrigger>
                  <SelectValue placeholder="Sin padre (raiz)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Sin padre (raiz)</SelectItem>
                  {allCuentas.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.codigo} — {c.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="moneda_default">Moneda default</Label>
            <Select name="moneda_default" defaultValue={isEdit ? undefined : 'ARS'}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar..." />
              </SelectTrigger>
              <SelectContent>
                {MONEDAS.map(m => (
                  <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Switch
                id="es_imputable"
                name="es_imputable"
                value="true"
                defaultChecked={cuenta?.es_imputable ?? true}
              />
              <Label htmlFor="es_imputable">Imputable</Label>
            </div>
            {isEdit && (
              <div className="flex items-center gap-2">
                <Switch
                  id="activa"
                  name="activa"
                  value="true"
                  defaultChecked={cuenta?.activa ?? true}
                />
                <Label htmlFor="activa">Activa</Label>
              </div>
            )}
          </div>

          <input type="hidden" name="acepta_movimientos" value="true" />

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button type="submit" disabled={pending}>
              {pending ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear cuenta'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
