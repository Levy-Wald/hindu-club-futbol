import { Calendar, Clock, MapPin, Users } from 'lucide-react'

export function HeaderAmistoso({
  evento,
}: {
  evento: {
    titulo: string
    fecha: string
    hora_inicio: string
    hora_fin: string | null
    cancha_nombre: string | null
    equipo_nombre: string | null
  }
}) {
  const fechaFormateada = new Date(evento.fecha + 'T12:00:00').toLocaleDateString('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  const horaFormateada = evento.hora_inicio?.slice(0, 5)
    + (evento.hora_fin ? ` – ${evento.hora_fin.slice(0, 5)}` : '')

  return (
    <div className="border rounded-lg p-4 mb-4" data-testid="header-amistoso">
      <h2 className="font-semibold text-lg mb-2">{evento.titulo}</h2>
      <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
        {evento.equipo_nombre && (
          <div className="flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5" />
            <span>{evento.equipo_nombre}</span>
          </div>
        )}
        <div className="flex items-center gap-1.5">
          <Calendar className="h-3.5 w-3.5" />
          <span className="capitalize">{fechaFormateada}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5" />
          <span>{horaFormateada}</span>
        </div>
        {evento.cancha_nombre && (
          <div className="flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5" />
            <span>{evento.cancha_nombre}</span>
          </div>
        )}
      </div>
    </div>
  )
}
