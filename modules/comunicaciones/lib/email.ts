export async function enviarEmail(
  destinatario: string,
  asunto: string,
  cuerpo: string
): Promise<{ success: boolean; message_id?: string; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return { success: false, error: 'RESEND_API_KEY no configurada' }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM || 'ClubCore <onboarding@resend.dev>',
        to: [destinatario],
        subject: asunto,
        html: cuerpo.replace(/\n/g, '<br>'),
      }),
    })

    if (!res.ok) {
      const err = await res.json()
      return { success: false, error: err.message || 'Error de Resend' }
    }

    const data = await res.json()
    return { success: true, message_id: data.id }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Error desconocido' }
  }
}

export function renderPlantilla(cuerpo: string, variables: Record<string, string>): string {
  let resultado = cuerpo
  for (const [key, value] of Object.entries(variables)) {
    resultado = resultado.replaceAll(`{{${key}}}`, value)
  }
  return resultado
}
