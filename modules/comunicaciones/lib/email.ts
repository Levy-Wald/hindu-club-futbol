import { resolveEmailAdapter } from './email-adapter'

// F5 pre-cableado: enviarEmail ahora delega en el EmailAdapter (mock-first,
// ADR-035). Misma firma → callers (notificar.ts, etc.) no cambian. Pre-CUIT
// resuelve a MockEmailAdapter (loguea, no envía); con RESEND_API_KEY o
// EMAIL_MODE=resend usa Resend real. El \n→<br> se mantiene acá para no cambiar
// el contrato de entrada (cuerpo en texto plano con saltos de línea).
export async function enviarEmail(
  destinatario: string,
  asunto: string,
  cuerpo: string
): Promise<{ success: boolean; message_id?: string; error?: string }> {
  const adapter = resolveEmailAdapter()
  return adapter.send(destinatario, asunto, cuerpo.replace(/\n/g, '<br>'))
}

export function renderPlantilla(cuerpo: string, variables: Record<string, string>): string {
  let resultado = cuerpo
  for (const [key, value] of Object.entries(variables)) {
    resultado = resultado.replaceAll(`{{${key}}}`, value)
  }
  return resultado
}
