'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { Loader2, DollarSign, RotateCcw } from 'lucide-react'
import { listarCargos, reversarCargo, fetchEquiposUtileria } from '../_actions'

interface Equipo { id: string; nombre: string }

const ESTADO_LABELS: Record<string, string> = {
  pendiente_emision: 'Pendiente emision',
  emitido: 'Emitido',
  reversado: 'Reversado',
  parcialmente_emitido: 'Parcial',
}

export function CargosClient() {
  const [cargos, setCargos] = useState<Record<string, unknown>[]>([])
  const [equipos, setEquipos] = useState<Equipo[]>([])
  const [loading, setLoading] = useState(true)
  const [estadoFiltro, setEstadoFiltro] = useState('')
  const [equipoFiltro, setEquipoFiltro] = useState('')

  const cargar = useCallback(async () => {
    setLoading(true)
    const res = await listarCargos({
      estado: estadoFiltro || undefined,
      equipo_id: equipoFiltro || undefined,
    })
    if (res.ok) setCargos(res.data as Record<string, unknown>[])
    else toast.error(res.message)
    setLoading(false)
  }, [estadoFiltro, equipoFiltro])

  useEffect(() => { cargar() }, [cargar])
  useEffect(() => { fetchEquiposUtileria().then(setEquipos) }, [])

  const handleReversar = async (cargoId: string) => {
    const motivo = prompt('Motivo del reverso (ej: item apareció):')
    if (!motivo) return
    const res = await reversarCargo(cargoId, motivo)
    if (res.ok) { toast.success(res.message); cargar() }
    else toast.error(res.message)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Cargos de Reposicion</h1>
      </div>

      <div className="flex flex-wrap gap-2">
        <Select value={estadoFiltro} onValueChange={v => setEstadoFiltro(v ?? '')}>
          <SelectTrigger className="w-[200px]"><SelectValue placeholder="Estado" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todos</SelectItem>
            {Object.entries(ESTADO_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={equipoFiltro} onValueChange={v => setEquipoFiltro(v ?? '')}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Equipo" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todos</SelectItem>
            {equipos.map(e => <SelectItem key={e.id} value={e.id}>{e.nombre}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>
      ) : cargos.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">No hay cargos de reposicion</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="py-2 px-2 font-medium">Item</th>
                <th className="py-2 px-2 font-medium">Equipo</th>
                <th className="py-2 px-2 font-medium">Cant. faltante</th>
                <th className="py-2 px-2 font-medium">Costo total</th>
                <th className="py-2 px-2 font-medium">Personas</th>
                <th className="py-2 px-2 font-medium">$/persona</th>
                <th className="py-2 px-2 font-medium">Periodo</th>
                <th className="py-2 px-2 font-medium">Estado</th>
                <th className="py-2 px-2 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {cargos.map(cargo => {
                const equipo = cargo.equipos as Record<string, unknown> | Record<string, unknown>[] | null
                const equipoNombre = Array.isArray(equipo) ? (equipo[0] as Record<string, unknown>)?.nombre : (equipo as Record<string, unknown>)?.nombre
                const item = cargo.utileria_items as Record<string, unknown> | Record<string, unknown>[] | null
                const itemNombre = Array.isArray(item) ? (item[0] as Record<string, unknown>)?.nombre : (item as Record<string, unknown>)?.nombre
                return (
                  <tr key={cargo.id as string} className="border-b hover:bg-muted/50">
                    <td className="py-2 px-2">{itemNombre as string}</td>
                    <td className="py-2 px-2">{equipoNombre as string}</td>
                    <td className="py-2 px-2">{cargo.cantidad_no_devuelta as number}</td>
                    <td className="py-2 px-2 font-medium">${(cargo.costo_total as number)?.toLocaleString('es-AR')}</td>
                    <td className="py-2 px-2">{cargo.cantidad_personas_prorrateo as number}</td>
                    <td className="py-2 px-2">${(cargo.costo_por_persona as number)?.toLocaleString('es-AR')}</td>
                    <td className="py-2 px-2">{cargo.periodo_emision as string}</td>
                    <td className="py-2 px-2">
                      <Badge variant={cargo.estado === 'reversado' ? 'outline' : cargo.estado === 'pendiente_emision' ? 'secondary' : 'default'}>
                        {ESTADO_LABELS[cargo.estado as string] ?? cargo.estado as string}
                      </Badge>
                    </td>
                    <td className="py-2 px-2">
                      {cargo.estado !== 'reversado' && (
                        <Button size="sm" variant="ghost" onClick={() => handleReversar(cargo.id as string)}>
                          <RotateCcw className="h-3.5 w-3.5 mr-1" /> Reversar
                        </Button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
