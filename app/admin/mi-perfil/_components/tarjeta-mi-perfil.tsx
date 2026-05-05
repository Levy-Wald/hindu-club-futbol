'use client'

import { TarjetaJugador } from '../../mi-equipo/_components/tarjeta-jugador'
import { Button } from '@/components/ui/button'

interface TarjetaJugadorMiPerfilProps {
  persona: {
    nombre: string
    apellido: string
    foto_perfil_url?: string | null
  }
  asignacion: Record<string, unknown>
}

export function TarjetaJugadorMiPerfil({ persona, asignacion }: TarjetaJugadorMiPerfilProps) {
  const equipo = asignacion.equipo as Record<string, unknown>
  if (!equipo) return null

  const categoria = equipo.categoria as { nombre_display: string } | null

  return (
    <TarjetaJugador
      jugador={{
        nombre: persona.nombre,
        apellido: persona.apellido,
        dorsal: asignacion.dorsal as number | null,
        posicion: asignacion.posicion as string | null,
        rol: (asignacion.rol_equipo_slug as string) || 'jugador',
        foto_url: persona.foto_perfil_url || null,
      }}
      equipo={{
        nombre: equipo.nombre as string,
        escudo_url: equipo.escudo_url as string | null,
        color_principal: equipo.color_principal as string | null,
        color_secundario: equipo.color_secundario as string | null,
        disciplina: equipo.disciplina_slug as string,
        categoria: categoria?.nombre_display ?? null,
        torneo: equipo.torneo as string | null,
      }}
      triggerElement={<Button variant="outline" size="sm" className="gap-1.5 shrink-0" />}
      triggerLabel="Mi tarjeta"
    />
  )
}
