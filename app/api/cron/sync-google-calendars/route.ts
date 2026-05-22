import { NextRequest, NextResponse } from 'next/server'
import { processCalendarSync } from '@/lib/calendar-sync/cron-handler'

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const result = await processCalendarSync()

  return NextResponse.json({
    ok: true,
    processed: result.processed,
    errors: result.errors,
    timestamp: new Date().toISOString(),
  })
}
