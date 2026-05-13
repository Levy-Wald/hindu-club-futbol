import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { TENANT_ID } from '@/lib/tenant'
import { Lock } from 'lucide-react'

interface ModuloGuardProps {
  slug: string
  children: React.ReactNode
}

export async function ModuloGuard({ slug, children }: ModuloGuardProps) {
  const supabase = createServiceRoleClient()

  const { data } = await supabase
    .from('tenant_modulos')
    .select('id')
    .eq('tenant_id', TENANT_ID)
    .eq('modulo_slug', slug)
    .eq('activo', true)
    .maybeSingle()

  if (data) return <>{children}</>

  const { data: pricing } = await supabase
    .from('catalogo_modulos_pricing')
    .select('descripcion_comercial, estado')
    .eq('modulo_slug', slug)
    .maybeSingle()

  const { data: modulo } = await supabase
    .from('catalogo_modulos')
    .select('nombre')
    .eq('slug', slug)
    .maybeSingle()

  return (
    <div className="flex flex-col items-center justify-center min-h-[300px] bg-slate-50 rounded-lg border border-dashed border-slate-200 p-8 text-center">
      <div className="bg-slate-100 rounded-full p-4 mb-4">
        <Lock className="h-8 w-8 text-slate-400" />
      </div>
      <h3 className="text-lg font-semibold text-slate-700 mb-2">
        {modulo?.nombre ?? slug}
      </h3>
      {pricing?.descripcion_comercial && (
        <p className="text-sm text-slate-500 mb-4 max-w-md">
          {pricing.descripcion_comercial}
        </p>
      )}
      <span className="inline-flex items-center rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-600">
        {pricing?.estado === 'proximamente' ? 'Proximamente' : 'Activar'}
      </span>
    </div>
  )
}
