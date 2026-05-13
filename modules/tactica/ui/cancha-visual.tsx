'use client'

import type { SlotConJugador } from '../lib/types'
import { SlotJugador } from './slot-jugador'

export function CanchaVisual({
  slots,
  onSlotClick,
  puedeEditar,
}: {
  slots: SlotConJugador[]
  onSlotClick: (slot: SlotConJugador) => void
  puedeEditar: boolean
}) {
  return (
    <div className="relative w-full" data-testid="cancha-visual">
      {/* SVG pitch */}
      <svg
        viewBox="0 0 100 140"
        className="w-full h-auto rounded-lg"
        style={{ maxHeight: '70vh' }}
      >
        {/* Background */}
        <rect x="0" y="0" width="100" height="140" fill="#2d8a4e" rx="4" />

        {/* Field lines */}
        <rect x="5" y="5" width="90" height="130" fill="none" stroke="white" strokeWidth="0.4" rx="1" />

        {/* Center line */}
        <line x1="5" y1="70" x2="95" y2="70" stroke="white" strokeWidth="0.4" />

        {/* Center circle */}
        <circle cx="50" cy="70" r="12" fill="none" stroke="white" strokeWidth="0.4" />
        <circle cx="50" cy="70" r="0.8" fill="white" />

        {/* Bottom penalty area (own goal) */}
        <rect x="20" y="5" width="60" height="20" fill="none" stroke="white" strokeWidth="0.4" />
        <rect x="30" y="5" width="40" height="8" fill="none" stroke="white" strokeWidth="0.4" />
        <circle cx="50" cy="18" r="0.6" fill="white" />
        <path d="M 35 25 A 12 12 0 0 0 65 25" fill="none" stroke="white" strokeWidth="0.4" />

        {/* Top penalty area (opponent goal) */}
        <rect x="20" y="115" width="60" height="20" fill="none" stroke="white" strokeWidth="0.4" />
        <rect x="30" y="127" width="40" height="8" fill="none" stroke="white" strokeWidth="0.4" />
        <circle cx="50" cy="122" r="0.6" fill="white" />
        <path d="M 35 115 A 12 12 0 0 1 65 115" fill="none" stroke="white" strokeWidth="0.4" />

        {/* Corner arcs */}
        <path d="M 5 8 A 3 3 0 0 0 8 5" fill="none" stroke="white" strokeWidth="0.4" />
        <path d="M 92 5 A 3 3 0 0 0 95 8" fill="none" stroke="white" strokeWidth="0.4" />
        <path d="M 5 132 A 3 3 0 0 1 8 135" fill="none" stroke="white" strokeWidth="0.4" />
        <path d="M 92 135 A 3 3 0 0 1 95 132" fill="none" stroke="white" strokeWidth="0.4" />
      </svg>

      {/* Player slots overlay */}
      <div className="absolute inset-0">
        {slots.map((slot) => {
          // Convert x (0-100) y (0-100) to percentage positions on the SVG
          // y: 0=own goal (bottom of pitch), 100=opponent goal (top of pitch in attack direction)
          // Map y from game coords to visual coords:
          // y=0 -> bottom (near own goal) = ~96% from top
          // y=100 -> top (near opponent goal) = ~4% from top
          const visualLeft = `${(slot.x / 100) * 90 + 5}%`
          const visualTop = `${((100 - slot.y) / 100) * 93 + 3.5}%`

          return (
            <div
              key={slot.slug}
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left: visualLeft, top: visualTop }}
            >
              <SlotJugador
                slot={slot}
                onClick={() => onSlotClick(slot)}
                puedeEditar={puedeEditar}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}
