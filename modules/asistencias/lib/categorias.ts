import type { CategoriaRolEquipo } from './types'

export const CATEGORIAS_CONFIG: Record<
  CategoriaRolEquipo,
  { titulo: string; orden: number }
> = {
  deportivo: { titulo: 'Plantel', orden: 1 },
  cuerpo_tecnico: { titulo: 'Cuerpo Técnico', orden: 2 },
  comision_delegados: { titulo: 'Comisión y Delegados', orden: 3 },
}
