import { NextResponse } from 'next/server'
import { apiHandler } from '@/lib/api/helpers'
import { createServiceClient } from '@/lib/api/auth'

export const GET = apiHandler('personas:read', async ({ request, tenant_id }) => {
  const supabase = createServiceClient()
  const url = request.nextUrl
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 100)
  const offset = parseInt(url.searchParams.get('offset') || '0')
  const search = url.searchParams.get('q')

  let query = supabase
    .from('personas')
    .select('id, nombre, apellido, dni, email_principal, telefono, fecha_nacimiento, genero, estado, created_at', { count: 'exact' })
    .eq('tenant_id', tenant_id)
    .is('deleted_at', null)
    .order('apellido')
    .range(offset, offset + limit - 1)

  if (search) {
    query = query.or(`nombre.ilike.%${search}%,apellido.ilike.%${search}%,dni.ilike.%${search}%`)
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

export const POST = apiHandler('personas:write', async ({ request, tenant_id }) => {
  const supabase = createServiceClient()
  const body = await request.json()

  const { nombre, apellido, dni, email_principal, telefono, fecha_nacimiento, genero } = body

  if (!nombre || !apellido) {
    return NextResponse.json({ error: 'nombre and apellido are required' }, { status: 400 })
  }

  // Dedupe by DNI if provided
  if (dni) {
    const { data: existing } = await supabase
      .from('personas')
      .select('id')
      .eq('tenant_id', tenant_id)
      .eq('dni', dni)
      .is('deleted_at', null)
      .maybeSingle()

    if (existing) {
      return NextResponse.json(
        { error: `Persona with DNI ${dni} already exists`, existing_id: existing.id },
        { status: 409 }
      )
    }
  }

  const { data, error } = await supabase
    .from('personas')
    .insert({
      tenant_id,
      nombre,
      apellido,
      dni: dni || null,
      email_principal: email_principal || null,
      telefono: telefono || null,
      fecha_nacimiento: fecha_nacimiento || null,
      genero: genero || null,
    })
    .select('id, nombre, apellido, dni, email_principal, created_at')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data }, { status: 201 })
})
