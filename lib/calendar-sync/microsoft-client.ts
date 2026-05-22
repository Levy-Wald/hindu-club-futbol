'use server'

import { ConfidentialClientApplication } from '@azure/msal-node'
import { Client } from '@microsoft/microsoft-graph-client'
import type { MicrosoftCalendarEvent, MicrosoftCalendarListEntry } from './types'

const MS_CLIENT_ID = process.env.MICROSOFT_CLIENT_ID || 'MICROSOFT_CLIENT_ID_PLACEHOLDER'
const MS_CLIENT_SECRET = process.env.MICROSOFT_CLIENT_SECRET || 'MICROSOFT_CLIENT_SECRET_PLACEHOLDER'
const MS_REDIRECT_URI = process.env.MICROSOFT_REDIRECT_URI || `${process.env.NEXT_PUBLIC_SITE_URL || 'https://hindu-club.vercel.app'}/api/auth/callback/microsoft`
const MS_AUTHORITY = 'https://login.microsoftonline.com/common'

const SCOPES = ['Calendars.ReadWrite', 'offline_access']

function createMsalClient(): ConfidentialClientApplication {
  return new ConfidentialClientApplication({
    auth: {
      clientId: MS_CLIENT_ID,
      clientSecret: MS_CLIENT_SECRET,
      authority: MS_AUTHORITY,
    },
  })
}

function createGraphClient(accessToken: string): Client {
  return Client.init({
    authProvider: (done) => done(null, accessToken),
  })
}

export function getMicrosoftAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: MS_CLIENT_ID,
    response_type: 'code',
    redirect_uri: MS_REDIRECT_URI,
    response_mode: 'query',
    scope: SCOPES.join(' '),
    state,
    prompt: 'consent',
  })
  return `${MS_AUTHORITY}/oauth2/v2.0/authorize?${params.toString()}`
}

export async function exchangeMicrosoftCodeForTokens(code: string) {
  const msalClient = createMsalClient()
  const result = await msalClient.acquireTokenByCode({
    code,
    redirectUri: MS_REDIRECT_URI,
    scopes: SCOPES,
  })

  if (!result?.accessToken) {
    throw new Error('Microsoft OAuth: no access token returned')
  }

  return {
    accessToken: result.accessToken,
    // MSAL doesn't directly expose refresh_token from acquireTokenByCode result,
    // we rely on the token cache for refresh. Store the access token and use
    // client_credentials refresh flow.
    refreshToken: (result as unknown as Record<string, string>).refreshToken ?? '',
    expiresAt: result.expiresOn
      ? result.expiresOn.toISOString()
      : new Date(Date.now() + 3600 * 1000).toISOString(),
  }
}

export async function refreshMicrosoftToken(
  refreshToken: string,
): Promise<{ accessToken: string; refreshToken: string; expiresAt: string }> {
  const params = new URLSearchParams({
    client_id: MS_CLIENT_ID,
    client_secret: MS_CLIENT_SECRET,
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    scope: SCOPES.join(' '),
  })

  const res = await fetch(`${MS_AUTHORITY}/oauth2/v2.0/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Microsoft token refresh failed: ${res.status} ${body}`)
  }

  const data = await res.json()
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token ?? refreshToken,
    expiresAt: new Date(Date.now() + (data.expires_in ?? 3600) * 1000).toISOString(),
  }
}

export async function getMicrosoftCalendarList(
  accessToken: string,
): Promise<MicrosoftCalendarListEntry[]> {
  const client = createGraphClient(accessToken)
  const result = await client.api('/me/calendars').get()
  return (result.value ?? []).map((c: Record<string, unknown>) => ({
    id: c.id as string,
    name: (c.name as string) || 'Sin nombre',
    isDefaultCalendar: c.isDefaultCalendar as boolean ?? false,
    canEdit: c.canEdit as boolean ?? false,
  }))
}

export async function getAllMicrosoftEventsSince(
  accessToken: string,
  calendarId: string,
  since: string,
): Promise<MicrosoftCalendarEvent[]> {
  const client = createGraphClient(accessToken)
  const events: MicrosoftCalendarEvent[] = []

  let url = `/me/calendars/${calendarId}/events?$filter=lastModifiedDateTime ge ${since}&$top=100&$orderby=lastModifiedDateTime`

  while (url) {
    const result = await client.api(url).get()
    for (const item of result.value ?? []) {
      events.push(mapGraphEvent(item))
    }
    url = result['@odata.nextLink'] ?? null
  }

  return events
}

export async function getMicrosoftEvent(
  accessToken: string,
  calendarId: string,
  eventId: string,
): Promise<MicrosoftCalendarEvent | null> {
  const client = createGraphClient(accessToken)
  try {
    const item = await client.api(`/me/calendars/${calendarId}/events/${eventId}`).get()
    return mapGraphEvent(item)
  } catch {
    return null
  }
}

export async function createMicrosoftEvent(
  accessToken: string,
  calendarId: string,
  event: Record<string, unknown>,
): Promise<{ eventId: string }> {
  const client = createGraphClient(accessToken)
  const result = await client.api(`/me/calendars/${calendarId}/events`).post(event)
  return { eventId: result.id }
}

export async function updateMicrosoftEvent(
  accessToken: string,
  calendarId: string,
  eventId: string,
  event: Record<string, unknown>,
): Promise<void> {
  const client = createGraphClient(accessToken)
  await client.api(`/me/calendars/${calendarId}/events/${eventId}`).patch(event)
}

export async function deleteMicrosoftEvent(
  accessToken: string,
  calendarId: string,
  eventId: string,
): Promise<void> {
  const client = createGraphClient(accessToken)
  await client.api(`/me/calendars/${calendarId}/events/${eventId}`).delete()
}

function mapGraphEvent(item: Record<string, unknown>): MicrosoftCalendarEvent {
  const start = item.start as { dateTime?: string; timeZone?: string } | undefined
  const end = item.end as { dateTime?: string; timeZone?: string } | undefined
  const location = item.location as { displayName?: string } | undefined
  const organizer = item.organizer as { emailAddress?: { address?: string; name?: string } } | undefined
  const attendees = item.attendees as Array<{
    emailAddress?: { address?: string; name?: string }
    status?: { response?: string }
  }> | undefined

  return {
    id: item.id as string,
    subject: (item.subject as string) || '',
    bodyPreview: item.bodyPreview as string | undefined,
    start: {
      dateTime: start?.dateTime ?? '',
      timeZone: start?.timeZone ?? 'UTC',
    },
    end: {
      dateTime: end?.dateTime ?? '',
      timeZone: end?.timeZone ?? 'UTC',
    },
    isAllDay: item.isAllDay as boolean | undefined,
    attendees: attendees?.map((a) => ({
      emailAddress: {
        address: a.emailAddress?.address ?? '',
        name: a.emailAddress?.name,
      },
      status: { response: a.status?.response ?? 'none' },
    })),
    location: location ? { displayName: location.displayName } : undefined,
    organizer: organizer?.emailAddress ? {
      emailAddress: {
        address: organizer.emailAddress.address ?? '',
        name: organizer.emailAddress.name,
      },
    } : undefined,
    lastModifiedDateTime: item.lastModifiedDateTime as string | undefined,
    isCancelled: item.isCancelled as boolean | undefined,
  }
}
