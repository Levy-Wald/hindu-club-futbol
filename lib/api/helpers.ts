import { NextRequest, NextResponse } from 'next/server'
import { validateApiKey, logApiRequest } from './auth'
import { hasScope, type Scope } from './scopes'

type HandlerFn = (params: {
  request: NextRequest
  tenant_id: string
  api_key_id: string
  scopes: string[]
  routeParams?: Record<string, string>
}) => Promise<NextResponse>

export function apiHandler(requiredScope: Scope, handler: HandlerFn) {
  return async (request: NextRequest, context?: { params: Promise<Record<string, string>> }) => {
    const start = Date.now()
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || null
    const ua = request.headers.get('user-agent') || null

    const result = await validateApiKey(request)

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status })
    }

    const { apiKey } = result

    if (!hasScope(apiKey.scopes, requiredScope)) {
      await logApiRequest({
        tenant_id: apiKey.tenant_id,
        api_key_id: apiKey.id,
        method: request.method,
        path: request.nextUrl.pathname,
        status_code: 403,
        response_ms: Date.now() - start,
        ip_address: ip,
        user_agent: ua,
        error_message: `Missing scope: ${requiredScope}`,
      })
      return NextResponse.json(
        { error: `Missing required scope: ${requiredScope}` },
        { status: 403 }
      )
    }

    try {
      const routeParams = context?.params ? await context.params : undefined
      const response = await handler({
        request,
        tenant_id: apiKey.tenant_id,
        api_key_id: apiKey.id,
        scopes: apiKey.scopes,
        routeParams,
      })

      await logApiRequest({
        tenant_id: apiKey.tenant_id,
        api_key_id: apiKey.id,
        method: request.method,
        path: request.nextUrl.pathname,
        status_code: response.status,
        response_ms: Date.now() - start,
        ip_address: ip,
        user_agent: ua,
      })

      return response
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Internal server error'
      await logApiRequest({
        tenant_id: apiKey.tenant_id,
        api_key_id: apiKey.id,
        method: request.method,
        path: request.nextUrl.pathname,
        status_code: 500,
        response_ms: Date.now() - start,
        ip_address: ip,
        user_agent: ua,
        error_message: message,
      })
      return NextResponse.json({ error: message }, { status: 500 })
    }
  }
}
