import Link from 'next/link'
import { fetchEquiposPublicos, fetchConfigPublica } from '../_lib/queries'
import { Trophy, Users, ChevronRight } from 'lucide-react'

export default async function EquiposPublicosPage() {
  const [equipos, config] = await Promise.all([
    fetchEquiposPublicos(),
    fetchConfigPublica(),
  ])

  // Group by disciplina
  const grouped = equipos.reduce((acc, eq) => {
    const key = eq.disciplina_slug || 'otro'
    if (!acc[key]) acc[key] = []
    acc[key].push(eq)
    return acc
  }, {} as Record<string, typeof equipos>)

  return (
    <div className="py-12 sm:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold">Nuestros equipos</h1>
          <p className="mt-2 text-muted-foreground">Conoce todos los equipos de {config?.nombre_display || 'Hindu Club'}</p>
        </div>

        {Object.entries(grouped).map(([disciplina, teams]) => (
          <div key={disciplina} className="mb-12">
            <h2 className="text-xl font-semibold capitalize mb-6 flex items-center gap-2">
              <Trophy className="h-5 w-5 text-[#F2C531]" />
              {disciplina}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {teams.map((equipo) => {
                const cat = equipo.categoria as unknown as { nombre_display: string; edad_min: number | null; edad_max: number | null } | null
                return (
                  <Link key={equipo.id} href={`/equipos/${equipo.id}`}
                    className="group block rounded-xl border bg-card p-4 hover:shadow-lg transition-all hover:border-[#3A8FC5]/50">
                    <div className="flex items-center gap-3">
                      {equipo.escudo_url ? (
                        <img src={equipo.escudo_url} alt="" className="h-12 w-12 rounded-lg object-contain" />
                      ) : (
                        <div className="h-12 w-12 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: equipo.color_principal || '#3A8FC5' }}>
                          <Trophy className="h-6 w-6 text-white/80" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold truncate group-hover:text-[#3A8FC5] transition-colors">{equipo.nombre}</h3>
                        <p className="text-sm text-muted-foreground">
                          {cat?.nombre_display || 'Sin categoria'}
                          {cat?.edad_min != null && cat?.edad_max != null && (
                            <span className="ml-1">({cat.edad_min}-{cat.edad_max} anos)</span>
                          )}
                        </p>
                        {equipo.torneo && (
                          <p className="text-xs text-muted-foreground mt-0.5">{equipo.torneo}</p>
                        )}
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-[#3A8FC5] transition-colors" />
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        ))}

        {equipos.length === 0 && (
          <p className="text-center text-muted-foreground py-12">No hay equipos disponibles</p>
        )}
      </div>
    </div>
  )
}
