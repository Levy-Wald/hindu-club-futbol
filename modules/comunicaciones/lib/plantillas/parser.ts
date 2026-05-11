export function extractVariablesFromTemplate(asunto: string | null, cuerpo: string): string[] {
  const regex = /\{\{(\w+)\}\}/g
  const variables = new Set<string>()

  for (const text of [asunto ?? '', cuerpo]) {
    let match
    while ((match = regex.exec(text)) !== null) {
      variables.add(match[1])
    }
  }

  return Array.from(variables).sort()
}

export function sincronizarVariablesDisponibles(
  asunto: string | null,
  cuerpo: string,
  variablesActuales: string[]
): string[] {
  const detectadas = extractVariablesFromTemplate(asunto, cuerpo)
  const union = new Set([...variablesActuales, ...detectadas])
  return Array.from(union).sort()
}
