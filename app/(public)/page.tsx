import Image from 'next/image'
import Link from 'next/link'
import {
  Mail,
  Phone,
  MessageCircle,
  MapPin,
  Calendar,
  Clock,
  Trophy,
  Users,
  ExternalLink,
  Shield,
} from 'lucide-react'
import {
  fetchConfigPublica,
  fetchProximosEventos,
  fetchFederacionesPublicas,
  fetchEquiposPublicos,
  fetchCapitanesPublicos,
  fetchStaffPublico,
  fetchCategoriasPublicas,
} from './_lib/queries'

// ---------------------------------------------------------------------------
// Tipos auxiliares
// ---------------------------------------------------------------------------

type ConfigPublica = Awaited<ReturnType<typeof fetchConfigPublica>>
type Evento = Awaited<ReturnType<typeof fetchProximosEventos>>[number]
type Federacion = Awaited<ReturnType<typeof fetchFederacionesPublicas>>[number]
type EquipoPublico = Awaited<ReturnType<typeof fetchEquiposPublicos>>[number]
type CapitanRow = Awaited<ReturnType<typeof fetchCapitanesPublicos>>[number]
type StaffRow = Awaited<ReturnType<typeof fetchStaffPublico>>[number]
type CategoriaPublica = Awaited<ReturnType<typeof fetchCategoriasPublicas>>[number]

// ---------------------------------------------------------------------------
// Constantes
// ---------------------------------------------------------------------------

const ROL_LABELS: Record<string, string> = {
  dt: 'Director Técnico',
  capitan: 'Capitán',
  subcapitan: 'Subcapitán',
  preparador_fisico: 'Preparador Físico',
  kinesiologo: 'Kinesiólogo',
  delegado: 'Delegado',
  ayudante_campo: 'Ayudante de Campo',
  coordinador: 'Coordinador',
  director_deportivo: 'Director Deportivo',
}

const TIPO_EVENTO_LABELS: Record<string, string> = {
  entrenamiento: 'Entrenamiento',
  partido: 'Partido',
  practica_informal: 'Práctica informal',
  reunion: 'Reunión',
  evaluacion_fisica: 'Evaluación física',
  otro: 'Otro',
}

const CUERPO_TECNICO_SLUGS = ['dt', 'ayudante_campo', 'preparador_fisico']
const STAFF_SLUGS = ['kinesiologo', 'delegado', 'coordinador', 'director_deportivo']

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function inicialNombre(nombre: string, apellido: string): string {
  return `${nombre.charAt(0).toUpperCase()}. ${apellido}`
}

function formatFecha(fecha: string): string {
  const d = new Date(fecha + 'T12:00:00')
  return d.toLocaleDateString('es-AR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
}

function formatHora(hora: string | null): string {
  if (!hora) return ''
  return hora.slice(0, 5)
}

function getInitials(nombre: string, apellido: string): string {
  return `${nombre.charAt(0)}${apellido.charAt(0)}`.toUpperCase()
}

/** Orden para capitanes: Primera primero, luego juveniles desc por edad_max, seniors asc por edad_min */
function ordenCapitanes(a: CapitanRow, b: CapitanRow): number {
  const catA = (a.equipo as unknown as {
    categoria: { nombre_display: string; edad_min: number | null; edad_max: number | null } | null
  } | null)?.categoria
  const catB = (b.equipo as unknown as {
    categoria: { nombre_display: string; edad_min: number | null; edad_max: number | null } | null
  } | null)?.categoria

  const nombreA = catA?.nombre_display?.toLowerCase() ?? ''
  const nombreB = catB?.nombre_display?.toLowerCase() ?? ''

  // "Primera" siempre primero
  if (nombreA.includes('primera') && !nombreB.includes('primera')) return -1
  if (!nombreA.includes('primera') && nombreB.includes('primera')) return 1

  const edadMaxA = catA?.edad_max ?? 99
  const edadMaxB = catB?.edad_max ?? 99
  const edadMinA = catA?.edad_min ?? 0
  const edadMinB = catB?.edad_min ?? 0

  // Juveniles/menores (edad_max definida y < 90): descendente por edad_max
  const esJuvenilA = edadMaxA < 90
  const esJuvenilB = edadMaxB < 90

  if (esJuvenilA && esJuvenilB) return edadMaxB - edadMaxA
  if (esJuvenilA && !esJuvenilB) return -1
  if (!esJuvenilA && esJuvenilB) return 1

  // Seniors: ascendente por edad_min
  return edadMinA - edadMinB
}

// ---------------------------------------------------------------------------
// Secciones
// ---------------------------------------------------------------------------

function HeroSection({ config }: { config: ConfigPublica }) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-[#3A8FC5] via-[#2B6A9C] to-[#1E3A5F]">
      {/* Patrón decorativo */}
      <div className="absolute inset-0 opacity-10">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              'radial-gradient(circle at 25% 25%, rgba(255,255,255,0.15) 1px, transparent 1px), radial-gradient(circle at 75% 75%, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />
      </div>
      <div className="absolute top-0 right-0 h-full w-1/2 bg-gradient-to-l from-[#1E3A5F]/40 to-transparent" />

      <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-32 lg:px-8">
        <div className="flex flex-col items-center text-center">
          <div className="mb-8 rounded-full bg-white/10 p-4 ring-1 ring-white/20 backdrop-blur-sm">
            <Image
              src="/hindu-logo.png"
              alt="Hindu Club"
              width={120}
              height={120}
              className="h-20 w-20 sm:h-[120px] sm:w-[120px]"
              priority
            />
          </div>

          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
            {config?.hero_titulo ?? 'Hindu Club Fútbol'}
          </h1>

          <p className="mt-4 max-w-2xl text-lg text-white/80 sm:text-xl">
            {config?.hero_bajada ?? 'Pasión, tradición y fútbol desde siempre.'}
          </p>

          <div className="mt-10 flex flex-col gap-4 sm:flex-row">
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-lg border border-white/40 bg-white/10 px-8 py-3 text-sm font-medium text-white backdrop-blur-sm transition-all hover:border-white/60 hover:bg-white/20"
            >
              Ingresar
            </Link>
            <Link
              href="/asociate"
              className="inline-flex items-center justify-center rounded-lg bg-[#F2C531] px-8 py-3 text-sm font-semibold text-[#1E3A5F] shadow-lg transition-all hover:bg-[#f5d060] hover:shadow-xl"
            >
              Inscribite
            </Link>
          </div>
        </div>
      </div>

      {/* Onda inferior */}
      <div className="absolute right-0 bottom-0 left-0">
        <svg
          viewBox="0 0 1440 80"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="block w-full text-white dark:text-[#0a0a0a]"
          preserveAspectRatio="none"
        >
          <path
            d="M0 40C240 80 480 0 720 40C960 80 1200 0 1440 40V80H0V40Z"
            fill="currentColor"
          />
        </svg>
      </div>
    </section>
  )
}

function ProximosEventosSection({ eventos }: { eventos: Evento[] }) {
  return (
    <section className="bg-white py-16 sm:py-24 dark:bg-[#0a0a0a]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl dark:text-white">
            Próximos eventos
          </h2>
          <p className="mt-2 text-muted-foreground">
            Entrenate, competí, disfrutá
          </p>
        </div>

        {eventos.length === 0 ? (
          <div className="rounded-xl border border-border bg-muted/30 py-16 text-center">
            <Calendar className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
            <p className="text-muted-foreground">
              No hay eventos próximos programados
            </p>
          </div>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide sm:grid sm:grid-cols-2 sm:overflow-visible lg:grid-cols-3">
            {eventos.map((ev) => {
              const equipo = ev.equipo as unknown as {
                id: string
                nombre: string
                escudo_url: string | null
                color_principal: string | null
                categoria: { nombre_display: string } | null
              } | null

              return (
                <div
                  key={ev.id}
                  className="min-w-[280px] shrink-0 rounded-xl border border-border bg-card p-5 ring-1 ring-foreground/5 transition-shadow hover:shadow-md sm:min-w-0"
                >
                  <div className="mb-3 flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#3A8FC5]/10 px-3 py-1 text-xs font-medium text-[#3A8FC5] dark:bg-[#3A8FC5]/20">
                      {ev.tipo_evento_slug === 'partido' ? (
                        <Trophy className="h-3 w-3" />
                      ) : (
                        <Calendar className="h-3 w-3" />
                      )}
                      {TIPO_EVENTO_LABELS[ev.tipo_evento_slug] ?? ev.tipo_evento_slug}
                    </span>
                  </div>

                  <div className="mb-3 flex items-start gap-3">
                    <div className="flex flex-col items-center rounded-lg bg-[#3A8FC5]/5 px-3 py-2 dark:bg-[#3A8FC5]/10">
                      <span className="text-xs font-medium uppercase text-muted-foreground">
                        {ev.fecha
                          ? new Date(ev.fecha + 'T12:00:00').toLocaleDateString('es-AR', { weekday: 'short' })
                          : ''}
                      </span>
                      <span className="text-2xl font-bold text-[#3A8FC5]">
                        {ev.fecha ? new Date(ev.fecha + 'T12:00:00').getDate() : ''}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      {ev.titulo && (
                        <p className="mb-1 truncate text-sm font-semibold text-foreground">
                          {ev.titulo}
                        </p>
                      )}
                      <div className="flex items-center gap-2">
                        {equipo?.color_principal && (
                          <span
                            className="inline-block h-3 w-3 rounded-full ring-1 ring-black/10"
                            style={{ backgroundColor: equipo.color_principal }}
                          />
                        )}
                        <span className="truncate text-sm text-foreground">
                          {equipo?.nombre ?? 'Equipo'}
                        </span>
                      </div>
                      {equipo?.categoria?.nombre_display && (
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {equipo.categoria.nombre_display}
                        </p>
                      )}
                    </div>
                  </div>

                  {(ev.hora_inicio || ev.hora_fin) && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>
                        {formatHora(ev.hora_inicio)}
                        {ev.hora_fin ? ` - ${formatHora(ev.hora_fin)}` : ''}
                      </span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}

function LigasYTorneosSection({
  federaciones,
  equipos,
  categorias,
}: {
  federaciones: Federacion[]
  equipos: EquipoPublico[]
  categorias: CategoriaPublica[]
}) {
  // Agrupar equipos por categoría
  const equiposPorCategoria = categorias
    .map((cat) => {
      const eqs = equipos.filter((eq) => {
        const eqCat = eq.categoria as unknown as { id: string } | null
        return eqCat?.id === cat.id
      })
      return { ...cat, equipos: eqs }
    })
    .filter((cat) => cat.equipos.length > 0)

  return (
    <section className="bg-gray-50/50 py-16 sm:py-24 dark:bg-[#111]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl dark:text-white">
            Nuestras ligas y torneos
          </h2>
          <p className="mt-2 text-muted-foreground">
            Competimos en las mejores ligas del fútbol amateur y juvenil
          </p>
        </div>

        {/* Federaciones */}
        {federaciones.length > 0 && (
          <div className="mb-12 flex flex-wrap justify-center gap-6">
            {federaciones.map((fed) => (
              <div
                key={fed.id}
                className="flex items-center gap-3 rounded-xl border border-border bg-card px-5 py-3 ring-1 ring-foreground/5"
              >
                {fed.logo_url ? (
                  <Image
                    src={fed.logo_url}
                    alt={fed.nombre}
                    width={40}
                    height={40}
                    className="h-10 w-10 rounded-lg object-contain"
                  />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#3A8FC5]/10">
                    <Shield className="h-5 w-5 text-[#3A8FC5]" />
                  </div>
                )}
                <div>
                  <p className="font-semibold text-foreground">{fed.nombre}</p>
                  <p className="text-xs capitalize text-muted-foreground">{fed.tipo}</p>
                </div>
                {fed.web_url && (
                  <a
                    href={fed.web_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-2 text-muted-foreground transition-colors hover:text-[#3A8FC5]"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Categorías con equipos */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {equiposPorCategoria.map((cat) => (
            <div
              key={cat.id}
              className="rounded-xl border border-border bg-card p-5 ring-1 ring-foreground/5"
            >
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-foreground">
                  {cat.nombre_display}
                </h3>
                <span className="inline-flex items-center gap-1 rounded-full bg-[#3A8FC5]/10 px-2.5 py-0.5 text-xs font-medium text-[#3A8FC5] dark:bg-[#3A8FC5]/20">
                  <Users className="h-3 w-3" />
                  {cat.equipos.length} {cat.equipos.length === 1 ? 'equipo' : 'equipos'}
                </span>
              </div>

              {(cat.edad_min != null || cat.edad_max != null) && (
                <p className="mb-3 text-sm text-muted-foreground">
                  {cat.edad_min != null && cat.edad_max != null
                    ? `${cat.edad_min}-${cat.edad_max} años`
                    : cat.edad_min != null
                      ? `Desde ${cat.edad_min} años`
                      : `Hasta ${cat.edad_max} años`}
                </p>
              )}

              <div className="flex flex-wrap gap-2">
                {cat.equipos.map((eq) => (
                  <span
                    key={eq.id}
                    className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-foreground"
                  >
                    {eq.color_principal && (
                      <span
                        className="inline-block h-2.5 w-2.5 rounded-full ring-1 ring-black/10"
                        style={{ backgroundColor: eq.color_principal }}
                      />
                    )}
                    {eq.nombre}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        {equiposPorCategoria.length === 0 && federaciones.length === 0 && (
          <div className="rounded-xl border border-border bg-muted/30 py-16 text-center">
            <Trophy className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
            <p className="text-muted-foreground">
              Próximamente se publicarán las ligas y equipos
            </p>
          </div>
        )}
      </div>
    </section>
  )
}

function AvatarPlaceholder({
  nombre,
  apellido,
  fotoUrl,
  size = 'md',
}: {
  nombre: string
  apellido: string
  fotoUrl: string | null
  size?: 'md' | 'lg'
}) {
  const sizeClasses = size === 'lg' ? 'h-20 w-20' : 'h-14 w-14'
  const textSize = size === 'lg' ? 'text-xl' : 'text-sm'
  const imgPx = size === 'lg' ? 80 : 56

  if (fotoUrl) {
    return (
      <Image
        src={fotoUrl}
        alt={`${nombre.charAt(0)}. ${apellido}`}
        width={imgPx}
        height={imgPx}
        className={`${sizeClasses} rounded-full object-cover ring-2 ring-border`}
      />
    )
  }

  return (
    <div
      className={`${sizeClasses} flex items-center justify-center rounded-full bg-[#3A8FC5]/10 ring-2 ring-[#3A8FC5]/20 dark:bg-[#3A8FC5]/20`}
    >
      <span className={`${textSize} font-semibold text-[#3A8FC5]`}>
        {getInitials(nombre, apellido)}
      </span>
    </div>
  )
}

function CapitanesSection({ capitanes }: { capitanes: CapitanRow[] }) {
  const sorted = [...capitanes].sort(ordenCapitanes)

  return (
    <section className="bg-white py-16 sm:py-24 dark:bg-[#0a0a0a]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl dark:text-white">
            Nuestros capitanes
          </h2>
          <p className="mt-2 text-muted-foreground">
            Los referentes de cada equipo dentro y fuera de la cancha
          </p>
        </div>

        {sorted.length === 0 ? (
          <div className="rounded-xl border border-border bg-muted/30 py-16 text-center">
            <Shield className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
            <p className="text-muted-foreground">
              Próximamente se publicarán los capitanes
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {sorted.map((cap) => {
              const persona = cap.persona as unknown as {
                id: string
                nombre: string
                apellido: string
                foto_perfil_url: string | null
              } | null
              const equipo = cap.equipo as unknown as {
                id: string
                nombre: string
                color_principal: string | null
                escudo_url: string | null
                categoria: {
                  nombre_display: string
                  edad_min: number | null
                  edad_max: number | null
                } | null
              } | null

              if (!persona) return null

              return (
                <div
                  key={`${cap.equipo_id}-${persona.id}`}
                  className="flex flex-col items-center rounded-xl border border-border bg-card p-5 text-center ring-1 ring-foreground/5 transition-shadow hover:shadow-md"
                >
                  <AvatarPlaceholder
                    nombre={persona.nombre}
                    apellido={persona.apellido}
                    fotoUrl={persona.foto_perfil_url}
                    size="lg"
                  />

                  <p className="mt-3 text-sm font-semibold text-foreground">
                    {inicialNombre(persona.nombre, persona.apellido)}
                  </p>

                  <div className="mt-1 flex items-center gap-1.5">
                    {equipo?.color_principal && (
                      <span
                        className="inline-block h-2.5 w-2.5 rounded-full ring-1 ring-black/10"
                        style={{ backgroundColor: equipo.color_principal }}
                      />
                    )}
                    <span className="text-xs text-muted-foreground">
                      {equipo?.nombre}
                    </span>
                  </div>

                  {equipo?.categoria?.nombre_display && (
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {equipo.categoria.nombre_display}
                    </p>
                  )}

                  <span
                    className={`mt-2 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      cap.rol_equipo_slug === 'capitan'
                        ? 'bg-[#F2C531]/20 text-[#a8850a] dark:bg-[#F2C531]/10 dark:text-[#F2C531]'
                        : 'bg-[#3A8FC5]/10 text-[#3A8FC5] dark:bg-[#3A8FC5]/20'
                    }`}
                  >
                    {ROL_LABELS[cap.rol_equipo_slug] ?? cap.rol_equipo_slug}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}

function StaffSection({ staff }: { staff: StaffRow[] }) {
  const cuerpoTecnico = staff.filter((s) =>
    CUERPO_TECNICO_SLUGS.includes(s.rol_equipo_slug)
  )
  const staffGeneral = staff.filter((s) =>
    STAFF_SLUGS.includes(s.rol_equipo_slug)
  )

  return (
    <section className="bg-gray-50/50 py-16 sm:py-24 dark:bg-[#111]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl dark:text-white">
            Nuestro staff
          </h2>
          <p className="mt-2 text-muted-foreground">
            El equipo detrás de los equipos
          </p>
        </div>

        {staff.length === 0 ? (
          <p className="text-center text-muted-foreground">
            Próximamente
          </p>
        ) : (
          <div className="space-y-12">
            {cuerpoTecnico.length > 0 && (
              <StaffGroup title="Cuerpo Técnico" items={cuerpoTecnico} />
            )}
            {staffGeneral.length > 0 && (
              <StaffGroup title="Staff" items={staffGeneral} />
            )}
          </div>
        )}
      </div>
    </section>
  )
}

function StaffGroup({ title, items }: { title: string; items: StaffRow[] }) {
  return (
    <div>
      <h3 className="mb-6 text-center text-xl font-semibold text-foreground">
        {title}
      </h3>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {items.map((member) => {
          const persona = member.persona as unknown as {
            id: string
            nombre: string
            apellido: string
            foto_perfil_url: string | null
          } | null
          const equipo = member.equipo as unknown as {
            id: string
            nombre: string
          } | null

          if (!persona) return null

          return (
            <div
              key={`${member.equipo_id}-${persona.id}-${member.rol_equipo_slug}`}
              className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 ring-1 ring-foreground/5"
            >
              <AvatarPlaceholder
                nombre={persona.nombre}
                apellido={persona.apellido}
                fotoUrl={persona.foto_perfil_url}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">
                  {inicialNombre(persona.nombre, persona.apellido)}
                </p>
                <p className="truncate text-xs text-[#3A8FC5]">
                  {ROL_LABELS[member.rol_equipo_slug] ?? member.rol_equipo_slug}
                </p>
                {equipo?.nombre && (
                  <p className="truncate text-xs text-muted-foreground">
                    {equipo.nombre}
                  </p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

interface PalmaresItem {
  anio: number
  titulo: string
  tipo: string
  descripcion?: string
}

function PalmaresSection({ palmares }: { palmares: PalmaresItem[] }) {
  if (palmares.length === 0) return null

  const tipoIcon: Record<string, string> = {
    copa: '🏆',
    trofeo: '🥇',
    medalla: '🥈',
    escudo: '🛡️',
  }

  return (
    <section className="bg-muted py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold text-foreground sm:text-4xl">
            Palmarés
          </h2>
          <p className="mt-2 text-muted-foreground">
            Trofeos y copas de nuestra historia
          </p>
        </div>

        <div className="mx-auto grid max-w-4xl grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {palmares
            .sort((a, b) => b.anio - a.anio)
            .map((item, i) => (
            <div
              key={i}
              className="group relative overflow-hidden rounded-xl border border-[#F2C531]/30 bg-card p-5 transition-all hover:border-[#F2C531] hover:shadow-lg"
            >
              <div className="flex items-start gap-3">
                <span className="text-3xl" role="img" aria-label={item.tipo}>
                  {tipoIcon[item.tipo] ?? '🏆'}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-[#F2C531]">{item.anio}</p>
                  <h3 className="mt-0.5 font-semibold text-foreground leading-tight">
                    {item.titulo}
                  </h3>
                  {item.descripcion && (
                    <p className="mt-1 text-sm text-muted-foreground">
                      {item.descripcion}
                    </p>
                  )}
                </div>
              </div>
              {/* Decorative gold accent */}
              <div className="absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r from-[#F2C531] to-[#F2C531]/0 opacity-0 transition-opacity group-hover:opacity-100" />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function AsociateCTASection({ config }: { config: ConfigPublica }) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-[#F2C531] via-[#e5b820] to-[#d4a510]">
      {/* Patrón decorativo */}
      <div className="absolute inset-0 opacity-10">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              'radial-gradient(circle at 30% 50%, rgba(0,0,0,0.1) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold text-[#1E3A5F] sm:text-4xl">
            {config?.asociate_titulo ?? 'Sumate a Hindu Club'}
          </h2>

          <p className="mt-4 text-lg font-medium text-[#1E3A5F]/80">
            {config?.asociate_bajada ?? 'Sé parte de nuestra familia futbolera.'}
          </p>

          {config?.asociate_descripcion && (
            <p className="mt-3 text-[#1E3A5F]/70">
              {config.asociate_descripcion}
            </p>
          )}

          <div className="mt-8">
            <Link
              href="/asociate"
              className="inline-flex items-center justify-center rounded-lg bg-[#1E3A5F] px-10 py-3.5 text-sm font-semibold text-white shadow-lg transition-all hover:bg-[#2a4f7a] hover:shadow-xl"
            >
              Inscribite
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

function ContactoSection({ config }: { config: ConfigPublica }) {
  const contactoEmail = config?.contacto_email
  const contactoTelefono = config?.contacto_telefono
  const contactoWhatsapp = config?.contacto_whatsapp
  const contactoDireccion = config?.contacto_direccion ?? config?.direccion
  const contactoMapa = config?.contacto_mapa_url

  const hasContacto = contactoEmail || contactoTelefono || contactoWhatsapp || contactoDireccion

  if (!hasContacto) return null

  const whatsappLink = contactoWhatsapp
    ? `https://wa.me/${String(contactoWhatsapp).replace(/[^0-9]/g, '')}`
    : null

  return (
    <section className="bg-white py-16 sm:py-24 dark:bg-[#0a0a0a]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl dark:text-white">
            Contacto
          </h2>
          <p className="mt-2 text-muted-foreground">Comunicate con nosotros</p>
        </div>

        <div className="mx-auto grid max-w-3xl gap-4 sm:grid-cols-2">
          {contactoEmail && (
            <a
              href={`mailto:${contactoEmail}`}
              className="flex items-center gap-4 rounded-xl border border-border bg-card p-5 ring-1 ring-foreground/5 transition-shadow hover:shadow-md"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#3A8FC5]/10 dark:bg-[#3A8FC5]/20">
                <Mail className="h-5 w-5 text-[#3A8FC5]" />
              </div>
              <div>
                <p className="text-xs font-medium uppercase text-muted-foreground">Email</p>
                <p className="text-sm font-medium text-foreground">{contactoEmail}</p>
              </div>
            </a>
          )}

          {contactoTelefono && (
            <a
              href={`tel:${contactoTelefono}`}
              className="flex items-center gap-4 rounded-xl border border-border bg-card p-5 ring-1 ring-foreground/5 transition-shadow hover:shadow-md"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#3A8FC5]/10 dark:bg-[#3A8FC5]/20">
                <Phone className="h-5 w-5 text-[#3A8FC5]" />
              </div>
              <div>
                <p className="text-xs font-medium uppercase text-muted-foreground">Teléfono</p>
                <p className="text-sm font-medium text-foreground">{contactoTelefono}</p>
              </div>
            </a>
          )}

          {contactoWhatsapp && whatsappLink && (
            <a
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 rounded-xl border border-border bg-card p-5 ring-1 ring-foreground/5 transition-shadow hover:shadow-md"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-500/10 dark:bg-green-500/20">
                <MessageCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-xs font-medium uppercase text-muted-foreground">WhatsApp</p>
                <p className="text-sm font-medium text-foreground">{contactoWhatsapp}</p>
              </div>
            </a>
          )}

          {contactoDireccion && (
            <div className="flex items-center gap-4 rounded-xl border border-border bg-card p-5 ring-1 ring-foreground/5">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#F2C531]/10 dark:bg-[#F2C531]/20">
                <MapPin className="h-5 w-5 text-[#F2C531]" />
              </div>
              <div>
                <p className="text-xs font-medium uppercase text-muted-foreground">Dirección</p>
                <p className="text-sm font-medium text-foreground">{contactoDireccion}</p>
                {contactoMapa && (
                  <a
                    href={String(contactoMapa)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 inline-flex items-center gap-1 text-xs text-[#3A8FC5] hover:underline"
                  >
                    Ver en mapa
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------
// Página principal
// ---------------------------------------------------------------------------

export default async function HomePage() {
  const [config, eventos, federaciones, equipos, capitanes, staff, categorias] =
    await Promise.all([
      fetchConfigPublica(),
      fetchProximosEventos(),
      fetchFederacionesPublicas(),
      fetchEquiposPublicos(),
      fetchCapitanesPublicos(),
      fetchStaffPublico(),
      fetchCategoriasPublicas(),
    ])

  return (
    <>
      <HeroSection config={config} />
      <ProximosEventosSection eventos={eventos} />
      <LigasYTorneosSection
        federaciones={federaciones}
        equipos={equipos}
        categorias={categorias}
      />
      <CapitanesSection capitanes={capitanes} />
      <StaffSection staff={staff} />
      <PalmaresSection palmares={((config?.palmares ?? []) as PalmaresItem[])} />
      <AsociateCTASection config={config} />
      <ContactoSection config={config} />
    </>
  )
}
