import { NextResponse } from 'next/server'
import { apiHandler } from '@/lib/api/helpers'
import { createServiceClient } from '@/lib/api/auth'

export const GET = apiHandler('personas:read', async ({ tenant_id, routeParams }) => {
  const id = routeParams?.id
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('personas')
    .select('id, nombre, apellido, numero_documento, email_principal, telefono_principal, fecha_nacimiento, genero, nacionalidad, created_at, updated_at')
    .eq('tenant_id', tenant_id)
    .eq('id', id)
    .is('deleted_at', null)
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'Persona not found' }, { status: 404 })
  }

  return NextResponse.json({ data })
})

export const PATCH = apiHandler('personas:write', async ({ request, tenant_id, routeParams }) => {
  const id = routeParams?.id
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const supabase = createServiceClient()
  const body = await request.json()

  // Only allow safe fields
  const allowedFields = ['nombre', 'apellido', 'dni', 'email_principal', 'telefono', 'fecha_nacimiento', 'genero', 'estado', 'nacionalidad', 'direccion']
  const updates: Record<string, unknown> = {}
  for (const key of allowedFields) {
    if (key in body) {
      updates[key] = body[key]
    }
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('personas')
    .update(updates)
    .eq('tenant_id', tenant_id)
    .eq('id', id)
    .is('deleted_at', null)
    .select('id, nombre, apellido, dni, email_principal, updated_at')
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'Persona not found or update failed' }, { status: 404 })
  }

  return NextResponse.json({ data })
})
