// Maps tipo_vinculo_slug to display labels
// 'directo' = what the origin person sees
// 'inverso' = what the destination person sees
export const VINCULO_LABELS: Record<string, { directo: string; inverso: string }> = {
  padre: { directo: 'Padre de', inverso: 'Hijo/a de' },
  madre: { directo: 'Madre de', inverso: 'Hijo/a de' },
  tutor: { directo: 'Tutor/a de', inverso: 'Tutelado/a de' },
  conyuge: { directo: 'Cónyuge de', inverso: 'Cónyuge de' },
  hermano: { directo: 'Hermano/a de', inverso: 'Hermano/a de' },
  abuelo: { directo: 'Abuelo/a de', inverso: 'Nieto/a de' },
  tio: { directo: 'Tío/a de', inverso: 'Sobrino/a de' },
  primo: { directo: 'Primo/a de', inverso: 'Primo/a de' },
  padrino: { directo: 'Padrino/Madrina de', inverso: 'Ahijado/a de' },
  representante: { directo: 'Representante de', inverso: 'Representado/a por' },
  contacto_emergencia: { directo: 'Contacto de emergencia de', inverso: 'Tiene como contacto de emergencia a' },
}

export function getVinculoLabel(slug: string, direccion: 'directo' | 'inverso'): string {
  const labels = VINCULO_LABELS[slug]
  if (!labels) return slug
  return labels[direccion]
}
