'use client'

import { useState, useTransition, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, RefreshCw, Loader2, Trophy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { obtenerTablaPosicionesAction } from '../lib/posiciones-actions'
import type { FilaPosicion } from '../lib/posiciones-actions'

export function PantallaPosiciones({
  torneoId,
  torneoNombre,
  categorias,
  equiposPropiosIds,
}: {
  torneoId: string
  torneoNombre: string
  categorias: { id: string; nombre: string }[]
  equiposPropiosIds: string[]
}) {
  const [isPending, startTransition] = useTransition()
  const [categoriaId, setCategoriaId] = useState<string>('')
  const [tabla, setTabla] = useState<FilaPosicion[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  function cargar() {
    setError(null)
    startTransition(async () => {
      const res = await obtenerTablaPosicionesAction({
        torneo_id: torneoId,
        categoria_id: categoriaId || undefined,
      })
      if (res.ok) {
        setTabla(res.tabla)
      } else {
        setError(res.error)
        setTabla(null)
      }
    })
  }

  // Auto-load on mount and when categoria changes
  useEffect(() => {
    cargar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoriaId])

  const propiosSet = new Set(equiposPropiosIds)

  return (
    <div data-testid="pantalla-posiciones">
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/admin/competencias/torneos/${torneoId}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Tabla de posiciones</h1>
          <p className="text-sm text-muted-foreground">{torneoNombre}</p>
        </div>
      </div>

      <div className="flex items-center gap-3 mb-4">
        {categorias.length > 0 && (
          <Select value={categoriaId} onValueChange={(v) => setCategoriaId(v ?? '')}>
            <SelectTrigger className="w-48" data-testid="select-categoria-posiciones">
              <SelectValue placeholder="Todas las categorias" />
            </SelectTrigger>
            <SelectContent>
              {categorias.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <Button
          variant="outline"
          size="sm"
          onClick={cargar}
          disabled={isPending}
          data-testid="btn-actualizar-tabla"
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          Actualizar
        </Button>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive bg-destructive/10 p-3 mb-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {tabla !== null && tabla.length === 0 && !isPending && (
        <div className="rounded-lg border p-8 text-center text-muted-foreground" data-testid="tabla-vacia">
          <Trophy className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>No hay partidos con resultados cargados para este torneo.</p>
        </div>
      )}

      {tabla !== null && tabla.length > 0 && (
        <div className="rounded-lg border overflow-x-auto" data-testid="tabla-posiciones">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-3 py-2 text-left w-12">Pos</th>
                <th className="px-3 py-2 text-left">Equipo</th>
                <th className="px-3 py-2 text-center w-10">PJ</th>
                <th className="px-3 py-2 text-center w-10">G</th>
                <th className="px-3 py-2 text-center w-10">E</th>
                <th className="px-3 py-2 text-center w-10">P</th>
                <th className="px-3 py-2 text-center w-10">GF</th>
                <th className="px-3 py-2 text-center w-10">GC</th>
                <th className="px-3 py-2 text-center w-10">DG</th>
                <th className="px-3 py-2 text-center w-12 font-bold">Pts</th>
              </tr>
            </thead>
            <tbody>
              {tabla.map((fila) => {
                const esPropio = fila.equipo_id_propio !== null && propiosSet.has(fila.equipo_id_propio)
                return (
                  <tr
                    key={fila.posicion}
                    className={`border-b last:border-b-0 ${esPropio ? 'bg-primary/5 font-medium equipo-propio' : ''}`}
                    data-testid={`fila-posicion-${fila.posicion}`}
                  >
                    <td className="px-3 py-2 font-semibold">{fila.posicion}</td>
                    <td className="px-3 py-2">{fila.equipo_display}</td>
                    <td className="px-3 py-2 text-center">{fila.partidos_jugados}</td>
                    <td className="px-3 py-2 text-center">{fila.ganados}</td>
                    <td className="px-3 py-2 text-center">{fila.empatados}</td>
                    <td className="px-3 py-2 text-center">{fila.perdidos}</td>
                    <td className="px-3 py-2 text-center">{fila.goles_a_favor}</td>
                    <td className="px-3 py-2 text-center">{fila.goles_en_contra}</td>
                    <td className="px-3 py-2 text-center">
                      {fila.diferencia_goles > 0 ? '+' : ''}{fila.diferencia_goles}
                    </td>
                    <td className="px-3 py-2 text-center font-bold">{fila.puntos}</td>
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
