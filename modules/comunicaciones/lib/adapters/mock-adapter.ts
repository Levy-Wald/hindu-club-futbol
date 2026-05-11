import type { ComunicacionAdapter, EnvioRequest, EnvioResult } from '../adapter'

export class MockAdapter implements ComunicacionAdapter {
  readonly name = 'mock'

  async enviar(request: EnvioRequest): Promise<EnvioResult> {
    console.log(`[MockAdapter] Enviando ${request.canal} a ${request.destinatario}: ${request.asunto}`)
    return {
      success: true,
      provider_id: `mock_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    }
  }
}
