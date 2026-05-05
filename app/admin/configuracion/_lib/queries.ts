import { createClient } from '@/lib/supabase/server'

const TENANT_ID = '11111111-1111-1111-1111-111111111111'

export async function fetchTenantConfig() {
  const supabase = await createClient()

  const [tenantRes, modulosRes] = await Promise.all([
    supabase
      .from('tenants')
      .select('id, nombre, slug, tipo, plan_slug, dominio_custom, configuracion, logo_url, color_principal, color_secundario, idioma_default, timezone, activo')
      .eq('id', TENANT_ID)
      .single(),
    supabase
      .from('tenant_modulos')
      .select('modulo_slug, activo, fecha_activacion')
      .eq('tenant_id', TENANT_ID),
  ])

  if (tenantRes.error) throw tenantRes.error
  if (modulosRes.error) throw modulosRes.error

  return { tenant: tenantRes.data, modulosActivos: modulosRes.data ?? [] }
}

export async function fetchModulos() {
  const supabase = await createClient()

  const [catalogoRes, tenantModulosRes] = await Promise.all([
    supabase
      .from('catalogo_modulos')
      .select('slug, nombre, descripcion, categoria, precio_usd_mensual, activo_global')
      .eq('activo_global', true)
      .order('categoria'),
    supabase
      .from('tenant_modulos')
      .select('modulo_slug, activo, configuracion, fecha_activacion')
      .eq('tenant_id', TENANT_ID),
  ])

  if (catalogoRes.error) throw catalogoRes.error
  if (tenantModulosRes.error) throw tenantModulosRes.error

  const catalogo = catalogoRes.data
  const tenantModulos = tenantModulosRes.data

  const activacionMap = new Map(
    (tenantModulos ?? []).map((m) => [m.modulo_slug, m])
  )

  return (catalogo ?? []).map((mod) => ({
    slug: mod.slug,
    nombre: mod.nombre,
    descripcion: mod.descripcion,
    categoria: mod.categoria,
    precio: mod.precio_usd_mensual,
    activo: mod.activo_global,
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
