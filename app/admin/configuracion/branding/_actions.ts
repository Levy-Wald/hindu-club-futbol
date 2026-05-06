'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

const TENANT_ID = '11111111-1111-1111-1111-111111111111'

export async function actualizarConfigPublica(input: Record<string, unknown>) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('tenant_config_publica')
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq('tenant_id', TENANT_ID)

  if (error) return { ok: false, message: error.message }

  revalidatePath('/')
  revalidatePath('/equipos')
  revalidatePath('/asociate')
  revalidatePath('/admin/configuracion/branding')
  return { ok: true, message: 'Configuracion actualizada' }
}

export async function uploadBrandingAsset(formData: FormData) {
  const supabase = await createClient()
  const file = formData.get('file') as File
  const tipo = formData.get('tipo') as string // 'logo', 'logo_dark', 'favicon'

  if (!file) return { ok: false, message: 'No se selecciono archivo' }

  const ext = file.name.split('.').pop()?.toLowerCase() || 'png'
  const path = `branding/${tipo}.${ext}`

  const { error } = await supabase.storage
    .from('public-assets')
    .upload(path, file, { upsert: true })

  if (error) return { ok: false, message: error.message }

  const { data } = supabase.storage.from('public-assets').getPublicUrl(path)

  return { ok: true, message: 'Archivo subido', data: { url: data.publicUrl } }
}
