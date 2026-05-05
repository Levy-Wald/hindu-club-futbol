import { createClient } from '@/lib/supabase/server'

const TENANT_ID = '11111111-1111-1111-1111-111111111111'

export async function fetchTenantConfig() {
  const supabase = await createClient()

  const { data: tenant, error: tenantError } = await supabase
    .from('tenants')
    .select('id, nombre, slug, dominio_personalizado, config, logo_url, activo')
    .eq('id', TENANT_ID)
    .single()

  if (tenantError) throw tenantError

  const { data: modulosActivos, error: modulosError } = await supabase
    .from('tenant_modulos')
    .select('modulo_slug, activo, fecha_activacion')
    .eq('tenant_id', TENANT_ID)

  if (modulosError) throw modulosError

  return { tenant, modulosActivos: modulosActivos ?? [] }
}

export async function fetchModulos() {
  const supabase = await createClient()

  const { data: catalogo, error: catalogoError } = await supabase
    .from('catalogo_modulos')
    .select('slug, nombre, descripcion, categoria, version, activo')
    .eq('activo', true)
    .order('categoria')

  if (catalogoError) throw catalogoError

  const { data: tenantModulos, error: tmError } = await supabase
    .from('tenant_modulos')
    .select('modulo_slug, activo, configuracion, fecha_activacion')
    .eq('tenant_id', TENANT_ID)

  if (tmError) throw tmError

  const activacionMap = new Map(
    (tenantModulos ?? []).map((m) => [m.modulo_slug, m])
  )

  return (catalogo ?? []).map((mod) => ({
    ...mod,
    activado: activacionMap.get(mod.slug)?.activo ?? false,
    fechaActivacion: activacionMap.get(mod.slug)?.fecha_activacion ?? null,
  }))
}

export async function fetchCatalogos() {
  const supabase = await createClient()

  const [atributos, estadosPadron, tiposSocio, rolesEquipo] = await Promise.all([
    supabase
      .from('catalogo_atributos')
      .select('slug, nombre, descripcion, categoria, activo')
      .order('categoria'),
    supabase
      .from('catalogo_estados_padron')
      .select('id, slug, nombre, activo')
      .order('nombre'),
    supabase
      .from('catalogo_tipos_socio')
      .select('id, slug, nombre, activo')
      .order('nombre'),
    supabase
      .from('catalogo_roles_equipo')
      .select('slug, nombre, categoria, activo')
      .order('categoria'),
  ])

  if (atributos.error) throw atributos.error
  if (estadosPadron.error) throw estadosPadron.error
  if (tiposSocio.error) throw tiposSocio.error
  if (rolesEquipo.error) throw rolesEquipo.error

  return {
    atributos: atributos.data ?? [],
    estadosPadron: estadosPadron.data ?? [],
    tiposSocio: tiposSocio.data ?? [],
    rolesEquipo: rolesEquipo.data ?? [],
  }
}
