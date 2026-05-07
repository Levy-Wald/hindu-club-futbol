import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/api/auth'

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createServiceClient()

  // Delete logs older than 90 days
  const { count, error } = await supabase
    .from('api_logs')
    .delete({ count: 'exact' })
    .lt('created_at', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString())

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, deleted: count })
}
