'use client'

import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, Shield, Info } from 'lucide-react'

interface CategoriaEquipo {
  id: string
  nombre_display: string
  edad_min?: number | null
  edad_max?: number | null
}

interface EquipoMembership {
  id: string
  equipo_id: string
  rol_equipo_slug: string
  dorsal: number | null
  posicion: string | null
  fecha_inicio: string | null
  activo: boolean
  equipo: {
    id: string
    nombre: string
    disciplina_slug: string
    modalidad: string | null
    categorias_equipo: CategoriaEquipo | null
  } | null
}

interface SeccionDeporteEquiposProps {
  personaEquipos: EquipoMembership[]
  fechaNacimiento?: string | null
  categoriasDisponibles?: CategoriaEquipo[]
}

function calcularEdad(fechaNac: string): number {
  const hoy = new Date()
  const nac = new Date(fechaNac)
  let edad = hoy.getFullYear() - nac.getFullYear()
  const m = hoy.getMonth() - nac.getMonth()
  if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) edad--
  return edad
}

const DISCIPLINA_LABELS: Record<string, string> = {
  hockey: 'Hockey',
  futbol: 'Fútbol',
  rugby: 'Rugby',
  natacion: 'Natación',
  tenis: 'Tenis',
  padel: 'Pádel',
  basquet: 'Básquet',
  voley: 'Vóley',
  handball: 'Handball',
  atletismo: 'Atletismo',
  gimnasia: 'Gimnasia',
  otro: 'Otro',
}

function getCategoriasSugeridas(edad: number | null, categorias: CategoriaEquipo[]): CategoriaEquipo[] {
  if (edad === null || categorias.length === 0) return []
  return categorias.filter((c) => {
    if (c.edad_min == null && c.edad_max == null) return false
    const min = c.edad_min ?? 0
    const max = c.edad_max ?? 99
    return edad >= min && edad <= max
  })
}

export function SeccionDeporteEquipos({ personaEquipos, fechaNacimiento, categoriasDisponibles = [] }: SeccionDeporteEquiposProps) {
  const activos = personaEquipos.filter((pe) => pe.activo)
  const edad = fechaNacimiento ? calcularEdad(fechaNacimiento) : null
  const categoriasSugeridas = getCategoriasSugeridas(edad, categoriasDisponibles)

  // Group by disciplina
  const porDeporte = activos.reduce<Record<string, EquipoMembership[]>>((acc, pe) => {
    const disc = pe.equipo?.disciplina_slug ?? 'otro'
    if (!acc[disc]) acc[disc] = []
    acc[disc].push(pe)
    return acc
  }, {})

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          Deportes y equipos
          {edad !== null && (
            <Badge variant="outline" className="text-xs font-normal">
              {edad} años
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {categoriasSugeridas.length > 0 && (
          <div className="flex items-center gap-2 mb-3 rounded-md bg-muted/50 px-3 py-2">
            <Info className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <p className="text-xs text-muted-foreground">
              Categoría sugerida por edad ({edad} años):{' '}
              {categoriasSugeridas.map((c) => c.nombre_display).join(', ')}
            </p>
          </div>
        )}
        {activos.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Esta persona no está asignada a ningún equipo.
          </p>
        ) : (
          <div className="space-y-4">
            {Object.entries(porDeporte).map(([disciplina, memberships]) => (
              <div key={disciplina} className="space-y-2">
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  {DISCIPLINA_LABELS[disciplina] ?? disciplina}
                  <span className="ml-2 font-normal text-xs">({memberships.length})</span>
                </h4>
                <div className="grid gap-2 sm:grid-cols-2">
                  {memberships.map((pe) => (
                    <Link
                      key={pe.id}
                      href={`/admin/equipos/${pe.equipo_id}`}
                      className="flex items-center gap-3 rounded-lg border p-3 hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary shrink-0">
                        {pe.dorsal !== null ? (
                          <span className="text-sm font-bold">{pe.dorsal}</span>
                        ) : (
                          <Users className="h-4 w-4" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {pe.equipo?.nombre ?? 'Equipo'}
                        </p>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <span className="capitalize">{pe.rol_equipo_slug.replace(/_/g, ' ')}</span>
                          {pe.equipo?.categorias_equipo && (
                            <>
                              <span>·</span>
                              <span>{pe.equipo.categorias_equipo.nombre_display}</span>
                            </>
                          )}
                          {pe.posicion && (
                            <>
                              <span>·</span>
                              <span>{pe.posicion}</span>
                            </>
                          )}
                        </div>
                      </div>
                      {pe.equipo?.modalidad && (
                        <Badge variant="secondary" className="text-[10px] shrink-0">
                          {pe.equipo.modalidad}
                        </Badge>
                      )}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
