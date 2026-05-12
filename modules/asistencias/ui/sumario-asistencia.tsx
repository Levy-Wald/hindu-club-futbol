'use client'

import type { InvitadosCompleto, PersonaInvitada } from '../lib/types'

function contarEstados(invitados: InvitadosCompleto) {
  const todas: PersonaInvitada[] = [
    ...invitados.deportivo,
    ...invitados.cuerpo_tecnico,
    ...invitados.comision_delegados,
  ]
  // Dedup by persona_id (persona can appear in multiple categorías)
  const unicos = new Map<string, PersonaInvitada>()
  for (const p of todas) unicos.set(p.persona_id, p)

  const lista = [...unicos.values()]

  // Contar también entidades y equipos con marca_asistencia
  const entidadesConAsistencia = (invitados.entidades ?? []).filter(e => e.marca_asistencia)
  const equiposConAsistencia = (invitados.equipos ?? []).filter(e => e.marca_asistencia)

  type Estadable = { asistencia: { estado: string } }
  const todosContables: Estadable[] = [...lista, ...entidadesConAsistencia, ...equiposConAsistencia]

  const presentes = todosContables.filter(p => p.asistencia.estado === 'presente').length
  const ausentes = todosContables.filter(p => p.asistencia.estado === 'ausente').length
  const tarde = todosContables.filter(p => p.asistencia.estado === 'tarde').length
  const justificados = todosContables.filter(p => p.asistencia.estado === 'justificado').length
  const lesionados = todosContables.filter(p => p.asistencia.estado === 'lesionado').length
  const pendientes = todosContables.filter(p => p.asistencia.estado === 'pendiente').length
  const total = todosContables.length

  return { presentes, ausentes, tarde, justificados, lesionados, pendientes, total }
}

export function SumarioAsistencia({ invitados }: { invitados: InvitadosCompleto }) {
  const stats = contarEstados(invitados)

  return (
    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
      <StatChip label="Presentes" count={stats.presentes} color="bg-success-50 text-success-700" testId="sumario-presentes" />
      <StatChip label="Ausentes" count={stats.ausentes} color="bg-error-50 text-error-700" testId="sumario-ausentes" />
      <StatChip label="Tarde" count={stats.tarde} color="bg-warning-50 text-warning-700" testId="sumario-tarde" />
      <StatChip label="Justificados" count={stats.justificados} color="bg-info-50 text-info-700" testId="sumario-justificados" />
      <StatChip label="Lesionados" count={stats.lesionados} color="bg-neutral-100 text-neutral-600" testId="sumario-lesionados" />
      <StatChip label="Sin marcar" count={stats.pendientes} color="bg-neutral-50 text-neutral-500" testId="sumario-pendientes" />
    </div>
  )
}

function StatChip({ label, count, color, testId }: { label: string; count: number; color: string; testId: string }) {
  return (
    <div className={`rounded-lg px-3 py-2 text-center ${color}`} data-testid={testId}>
      <p className="text-lg font-bold">{count}</p>
      <p className="text-xs">{label}</p>
    </div>
  )
}
