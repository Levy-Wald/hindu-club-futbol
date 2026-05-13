'use client'

import type { SlotConJugador } from '../lib/types'

const LINEA_COLORS: Record<string, string> = {
  arquero: 'bg-yellow-500 border-yellow-300',
  defensa: 'bg-blue-600 border-blue-400',
  mediocampo: 'bg-green-600 border-green-400',
  ataque: 'bg-red-600 border-red-400',
}

export function SlotJugador({
  slot,
  onClick,
  puedeEditar,
}: {
  slot: SlotConJugador
  onClick: () => void
  puedeEditar: boolean
}) {
  const colors = LINEA_COLORS[slot.linea] ?? 'bg-gray-600 border-gray-400'
  const hasPlayer = !!slot.jugador

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!puedeEditar}
      className={`
        flex flex-col items-center gap-0.5 group
        ${puedeEditar ? 'cursor-pointer' : 'cursor-default'}
      `}
      data-testid={`slot-${slot.slug}`}
      title={slot.nombre}
    >
      {/* Circle */}
      <div
        className={`
          w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2
          flex items-center justify-center
          text-white text-[10px] sm:text-xs font-bold
          transition-transform
          ${colors}
          ${hasPlayer ? 'opacity-100' : 'opacity-60 border-dashed'}
          ${puedeEditar ? 'group-hover:scale-110' : ''}
        `}
      >
        {hasPlayer
          ? (slot.jugador!.numero_camiseta ?? slot.jugador!.apellido.charAt(0))
          : '+'}
      </div>

      {/* Name label */}
      <span className="text-[8px] sm:text-[10px] text-white font-medium text-center leading-tight max-w-[60px] truncate drop-shadow-md">
        {hasPlayer
          ? slot.jugador!.apellido
          : slot.nombre}
      </span>
    </button>
  )
}
