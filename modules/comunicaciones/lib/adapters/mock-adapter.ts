import { createClient } from '@/lib/supabase/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { ComunicacionAdapter, EnvioRequest, EnvioResult, EnvioMasivoRow } from '../adapter'

export class MockAdapter implements ComunicacionAdapter {
  readonly name = 'mock'

  async enviar(request: EnvioRequest): Promise<EnvioResult> {
    console.log(`[MockAdapter] Enviando ${request.canal} a ${request.destinatario}: ${request.asunto}`)
    return {
      success: true,
      provider_id: `mock_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    }
  }

  async enviarMasivo(tenantId: string, envios: EnvioMasivoRow[], supabaseClient?: SupabaseClient): Promise<void> {
    const supabase = supabaseClient ?? await createClient()
    const BATCH_SIZE = 500

    for (let i = 0; i < envios.length; i += BATCH_SIZE) {
      const batch = envios.slice(i, i + BATCH_SIZE).map(e => ({
        ...e,
        tenant_id: tenantId,
      }))

      const { error } = await supabase.from('com_envios').insert(batch)
      if (error) throw new Error(`Bulk insert falló en batch ${Math.floor(i / BATCH_SIZE)}: ${error.message}`)
    }

    console.log(`[MockAdapter] Bulk insert completado: ${envios.length} envíos en ${Math.ceil(envios.length / BATCH_SIZE)} batches`)
  }
}
