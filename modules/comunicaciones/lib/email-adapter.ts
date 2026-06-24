// F5 pre-cableado — Adapter de email (ADR-035 mock-first).
// Mismo patrón que ComunicacionAdapter: interface tipada → Mock/Resend → factory
// con env var. Hoy 'mock' por defecto (loguea, no envía) hasta que el CUIT
// habilite Resend real; entonces EMAIL_MODE=resend (o setear RESEND_API_KEY).
//
// El seam: cuando llegue el CUIT, NO hay que reescribir nada — el ResendAdapter
// ya está. Solo se configura la env y se prueba.

export interface EmailResult {
  success: boolean
  message_id?: string
  error?: string
}

export interface EmailAdapter {
  readonly name: string
  send(destinatario: string, asunto: string, cuerpoHtml: string): Promise<EmailResult>
}

// ── Mock: no envía nada real; loguea y devuelve OK (mock-first pre-CUIT) ──
export class MockEmailAdapter implements EmailAdapter {
  readonly name = 'mock'
  async send(destinatario: string, asunto: string): Promise<EmailResult> {
    console.log(`[MockEmailAdapter] (no enviado) → ${destinatario}: ${asunto}`)
    return { success: true, message_id: `mock_${Date.now()}_${Math.random().toString(36).slice(2, 8)}` }
  }
}

// ── Resend: implementación real (se activa en F5 con la API key) ──
export class ResendEmailAdapter implements EmailAdapter {
  readonly name = 'resend'
  async send(destinatario: string, asunto: string, cuerpoHtml: string): Promise<EmailResult> {
    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) return { success: false, error: 'RESEND_API_KEY no configurada' }
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: process.env.RESEND_FROM || 'ClubCore <onboarding@resend.dev>',
          to: [destinatario],
          subject: asunto,
          html: cuerpoHtml,
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        return { success: false, error: err.message || 'Error de Resend' }
      }
      const data = await res.json()
      return { success: true, message_id: data.id }
    } catch (e) {
      return { success: false, error: e instanceof Error ? e.message : 'Error desconocido' }
    }
  }
}

let cached: EmailAdapter | null = null

export function resolveEmailAdapter(): EmailAdapter {
  if (cached) return cached
  // EMAIL_MODE explícito gana; si no, autodetecta: hay API key → resend, si no → mock.
  const mode = process.env.EMAIL_MODE || (process.env.RESEND_API_KEY ? 'resend' : 'mock')
  switch (mode) {
    case 'mock':
      cached = new MockEmailAdapter()
      break
    case 'resend':
      cached = new ResendEmailAdapter()
      break
    default:
      throw new Error(`EMAIL_MODE desconocido: ${mode}. Válidos: mock | resend`)
  }
  return cached
}
