import { NextResponse } from 'next/server'
import { apiHandler } from '@/lib/api/helpers'
import { createServiceClient } from '@/lib/api/auth'

export const GET = apiHandler('equipos:read', async ({ request, tenant_id }) => {
  const supabase = createServiceClient()
  const url = request.nextUrl
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 100)
  const offset = parseInt(url.searchParams.get('offset') || '0')
  const search = url.searchParams.get('q')

  let query = supabase
    .from('equipos')
    .select('id, nombre, disciplina, modalidad, genero, categoria, color_primario, color_secundario, estado, created_at', { count: 'exact' })
    .eq('tenant_id', tenant_id)
    .is('deleted_at', null)
    .order('nombre')
    .range(offset, offset + limit - 1)

  if (search) {
    query = query.ilike('nombre', `%${search}%`)
  }

  const { data, count, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    data,
    meta: { total: count, limit, offset },
  })
})
