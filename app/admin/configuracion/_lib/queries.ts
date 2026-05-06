import { createClient } from '@/lib/supabase/server'

const TENANT_ID = '62e25f3c-7c86-42f1-9b43-cdbab28dacde'

export async function fetchTenantConfig() {
  const supabase = await createClient()

  const [tenantRes, modulosRes, brandingRes] = await Promise.all([
    supabase
      .from('tenants')
      .select('id, nombre, slug, tipo, activo')
      .eq('id', TENANT_ID)
      .maybeSingle(),
    supabase
      .from('tenant_modulos')
      .select('modulo_slug, activo, fecha_activacion')
      .eq('tenant_id', TENANT_ID),
    supabase
      .from('tenant_config_publica')
      .select('*')
      .eq('tenant_id', TENANT_ID)
      .maybeSingle(),
  ])

  // Fallback tenant data if query fails or returns null
  const tenantData = tenantRes.data ?? {
    id: TENANT_ID,
    nombre: 'Hindu Club',
    slug: 'hindu-club',
    tipo: 'club_deportivo',
    activo: true,
  }
  const modulosData = modulosRes.error ? [] : (modulosRes.data ?? [])

  return {
    tenant: {
      ...tenantData,
      plan_slug: 'pro',
      dominio_custom: null,
      configuracion: null,
      logo_url: null,
      color_principal: null,
      color_secundario: null,
      idioma_default: 'es',
      timezone: 'America/Argentina/Buenos_Aires',
    },
    modulosActivos: modulosData,
    branding: brandingRes.error ? null : (brandingRes.data ?? null),
  }
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

  // Tables may not exist on remote — return empty
  if (catalogoRes.error) return []
  if (tenantModulosRes.error) return []

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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function safeFetch(supabase: Awaited<ReturnType<typeof createClient>>, table: string, select: string, orderBy: string): Promise<any[]> {
  const res = await supabase.from(table).select(select).order(orderBy)
  if (res.error) return []
  return res.data ?? []
}

export async function fetchCatalogos() {
  const supabase = await createClient()

  const [
    atributos, estadosPadron, tiposSocio, rolesEquipo,
    motivosBaja, tiposVinculo, disciplinas, nivelesCompetencia,
    tiposDocumento, tiposEstudio, obrasSociales,
  ] = await Promise.all([
    safeFetch(supabase, 'catalogo_atributos', 'slug, nombre, descripcion, categoria, activo', 'categoria'),
    safeFetch(supabase, 'catalogo_estados_padron', 'id, slug, nombre, activo', 'nombre'),
    safeFetch(supabase, 'catalogo_tipos_socio', 'id, slug, nombre, activo', 'nombre'),
    safeFetch(supabase, 'catalogo_roles_equipo', 'slug, nombre, categoria, activo', 'categoria'),
    safeFetch(supabase, 'catalogo_motivos_baja', 'slug, nombre, activo', 'nombre'),
    safeFetch(supabase, 'catalogo_tipos_vinculo', 'slug, nombre, categoria, activo', 'categoria'),
    safeFetch(supabase, 'catalogo_disciplinas', 'slug, nombre, categoria, activo', 'nombre'),
    safeFetch(supabase, 'catalogo_niveles_competencia', 'slug, nombre, activo', 'nombre'),
    safeFetch(supabase, 'catalogo_tipos_documento', 'slug, nombre, activo', 'nombre'),
    safeFetch(supabase, 'catalogo_tipos_estudio', 'slug, nombre, activo', 'nombre'),
    safeFetch(supabase, 'catalogo_obras_sociales', 'slug, nombre, activo', 'nombre'),
  ])

  return {
    atributos,
    estadosPadron,
    tiposSocio,
    rolesEquipo,
    motivosBaja,
    tiposVinculo,
    disciplinas,
    nivelesCompetencia,
    tiposDocumento,
    tiposEstudio,
    obrasSociales,
  }
}
