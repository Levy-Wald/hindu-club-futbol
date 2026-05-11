'use client'

import { useState, useTransition } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { MoreHorizontal, Search, Trash2, Eye, Star } from 'lucide-react'
import { toast } from 'sonner'
import { eliminarScoutingFicha } from '../_actions'
import type { ScoutingFichaRow } from '../_lib/queries'

const ESTADOS_SCOUTING = [
  { value: 'observado', label: 'Observado', variant: 'secondary' as const },
  { value: 'contactado', label: 'Contactado', variant: 'default' as const },
  { value: 'en_negociacion', label: 'En negociación', variant: 'outline' as const },
  { value: 'descartado', label: 'Descartado', variant: 'destructive' as const },
  { value: 'incorporado', label: 'Incorporado', variant: 'default' as const },
]

interface Equipo {
  id: string
  nombre: string
}

interface ScoutingTableProps {
  fichas: ScoutingFichaRow[]
  equipos: Equipo[]
}

function EstadoBadge({ estado }: { estado: string }) {
  const config = ESTADOS_SCOUTING.find((e) => e.value === estado)
  if (!config) return <Badge variant="secondary">{estado}</Badge>

  // Incorporado gets a green tint
  if (estado === 'incorporado') {
    return (
      <Badge variant="default" className="bg-success-600 hover:bg-success-700">
        {config.label}
      </Badge>
    )
  }

  return <Badge variant={config.variant}>{config.label}</Badge>
}

function Estrellas({ valor }: { valor: number | null }) {
  if (!valor) return <span className="text-muted-foreground text-sm">—</span>
  return (
    <span className="inline-flex gap-0.5" title={`${valor}/5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={`h-3.5 w-3.5 ${
            n <= valor
              ? 'fill-warning-400 text-warning-400'
              : 'fill-none text-muted-foreground/40'
          }`}
        />
      ))}
    </span>
  )
}

export function ScoutingTable({ fichas, equipos }: ScoutingTableProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const [fichaAEliminar, setFichaAEliminar] = useState<ScoutingFichaRow | null>(null)

  // Filtros locales sincronizados con URL
  const currentSearch = searchParams.get('q') ?? ''
  const currentEstado = searchParams.get('estado') ?? ''
  const currentEquipo = searchParams.get('equipo') ?? ''

  function updateParams(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    router.push(`${pathname}?${params.toString()}`)
  }

  function handleConfirmarEliminar() {
    if (!fichaAEliminar) return
    const id = fichaAEliminar.id
    startTransition(async () => {
      const result = await eliminarScoutingFicha(id)
      if (result.ok) {
        toast.success(result.message)
      } else {
        toast.error(result.message)
      }
      setFichaAEliminar(null)
    })
  }

  return (
    <>
      {/* Confirm delete dialog */}
      <Dialog
        open={!!fichaAEliminar}
        onOpenChange={(open) => {
          if (!open) setFichaAEliminar(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar ficha de scouting</DialogTitle>
            <DialogDescription>
              ¿Estás seguro que querés eliminar la ficha de{' '}
              <strong>
                {fichaAEliminar?.nombre} {fichaAEliminar?.apellido}
              </strong>
              ? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setFichaAEliminar(null)}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmarEliminar}
              disabled={isPending}
            >
              {isPending ? 'Eliminando...' : 'Eliminar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre o apellido..."
            className="pl-8"
            defaultValue={currentSearch}
            onChange={(e) => {
              const val = e.target.value
              // Debounce simple: actualizar en blur o enter
              if (val === '') updateParams('q', '')
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                updateParams('q', (e.target as HTMLInputElement).value)
              }
            }}
            onBlur={(e) => updateParams('q', e.target.value)}
          />
        </div>

        <Select
          value={currentEstado}
          onValueChange={(v) => updateParams('estado', v === 'todos' ? '' : (v ?? ''))}
        >
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Todos los estados" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los estados</SelectItem>
            {ESTADOS_SCOUTING.map((e) => (
              <SelectItem key={e.value} value={e.value}>
                {e.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={currentEquipo}
          onValueChange={(v) => updateParams('equipo', v === 'todos' ? '' : (v ?? ''))}
        >
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Todos los equipos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los equipos</SelectItem>
            {equipos.map((eq) => (
              <SelectItem key={eq.id} value={eq.id}>
                {eq.nombre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {fichas.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-lg font-medium">No hay fichas de scouting</p>
          <p className="text-sm mt-1">
            Creá la primera ficha para empezar a trackear jugadores.
          </p>
        </div>
      ) : (
        <div className="border rounded-lg overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Jugador</TableHead>
                <TableHead className="hidden sm:table-cell">Posición</TableHead>
                <TableHead className="hidden md:table-cell">Club actual</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="hidden sm:table-cell">Evaluación</TableHead>
                <TableHead className="hidden lg:table-cell">Equipo interesado</TableHead>
                <TableHead className="hidden lg:table-cell">Scout</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {fichas.map((ficha) => (
                <TableRow key={ficha.id}>
                  <TableCell>
                    <Link
                      href={`/admin/operaciones/scouting/${ficha.id}`}
                      className="font-medium hover:underline"
                    >
                      {ficha.apellido}, {ficha.nombre}
                    </Link>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    {ficha.posicion ?? '—'}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {ficha.club_actual ?? '—'}
                  </TableCell>
                  <TableCell>
                    <EstadoBadge estado={ficha.estado} />
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <Estrellas valor={ficha.evaluacion} />
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    {ficha.equipo_nombre ?? '—'}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    {ficha.scout_nombre ?? '—'}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="h-8 w-8" />}>
                        <MoreHorizontal className="h-4 w-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() =>
                            router.push(`/admin/operaciones/scouting/${ficha.id}`)
                          }
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Ver ficha
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setFichaAEliminar(ficha)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </>
  )
}
