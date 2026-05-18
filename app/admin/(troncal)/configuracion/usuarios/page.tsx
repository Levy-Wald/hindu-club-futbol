import { createClient } from '@/lib/supabase/server'
import { UsuariosPanel } from './_components/usuarios-panel'

const TENANT_ID = '11111111-1111-1111-1111-111111111111'

interface PersonaConAtributos {
  id: string
  nombre: string
  apellido: string
  email_principal: string | null
  user_id: string | null
  atributos: { slug: string; nombre: string; capa: string }[]
}

async function fetchUsuariosConAtributos(): Promise<PersonaConAtributos[]> {
  const supabase = await createClient()

  // Get all personas with user_id (actual users), not filtered by atributos
  const { data: personas } = await supabase
    .from('personas')
    .select('id, nombre, apellido, email_principal, user_id')
    .eq('tenant_id', TENANT_ID)
    .not('user_id', 'is', null)
    .is('deleted_at', null)
    .order('apellido')

  if (!personas || personas.length === 0) return []

  const personaIds = personas.map(p => p.id)

  // Get atributos for these personas
  const { data: asignaciones } = await (supabase as any)
    .from('personas_atributos')
    .select('persona_id, atributo_slug, catalogo_atributos!atributo_slug(slug, nombre, capa)')
    .eq('tenant_id', TENANT_ID)
    .eq('activo', true)
    .in('persona_id', personaIds)

  const attrMap = new Map<string, { slug: string; nombre: string; capa: string }[]>()
  for (const a of (asignaciones ?? []) as any[]) {
    const cat = Array.isArray(a.catalogo_atributos) ? a.catalogo_atributos[0] : a.catalogo_atributos
    if (!cat) continue
    const list = attrMap.get(a.persona_id) ?? []
    list.push({ slug: cat.slug, nombre: cat.nombre, capa: cat.capa })
    attrMap.set(a.persona_id, list)
  }

  return personas.map(p => ({
    ...p,
    atributos: attrMap.get(p.id) ?? [],
  }))
}

async function fetchCatalogoAtributos() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('catalogo_atributos')
    .select('slug, nombre, capa')
    .eq('activo', true)
    .order('capa')
    .order('nombre')
  return data ?? []
}

export default async function UsuariosPage() {
  const [usuarios, catalogo] = await Promise.all([
    fetchUsuariosConAtributos(),
    fetchCatalogoAtributos(),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">Usuarios y permisos</h1>
        <p className="text-sm text-muted-foreground">
          Gestioná los atributos y capabilities de cada usuario del sistema
        </p>
      </div>
      <UsuariosPanel usuarios={usuarios} catalogo={catalogo} />
    </div>
  )
}
