import { google, type calendar_v3 } from 'googleapis'
import type { GoogleCalendarEvent, GoogleCalendarListEntry } from './types'

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || 'GOOGLE_CLIENT_ID_PLACEHOLDER'
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || 'GOOGLE_CLIENT_SECRET_PLACEHOLDER'
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || `${process.env.NEXT_PUBLIC_SITE_URL || 'https://hindu-club.vercel.app'}/api/auth/callback/google`

function createOAuth2Client(refreshToken?: string) {
  const client = new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI,
  )
  if (refreshToken) {
    client.setCredentials({ refresh_token: refreshToken })
  }
  return client
}

export function getGoogleAuthUrl(state: string): string {
  const client = createOAuth2Client()
  return client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: [
      'https://www.googleapis.com/auth/calendar.events',
      'https://www.googleapis.com/auth/calendar.readonly',
    ],
    state,
  })
}

export async function exchangeCodeForTokens(code: string) {
  const client = createOAuth2Client()
  const { tokens } = await client.getToken(code)
  if (!tokens.refresh_token || !tokens.access_token) {
    throw new Error('Google OAuth: no tokens returned')
  }
  return {
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
    expiresAt: tokens.expiry_date
      ? new Date(tokens.expiry_date).toISOString()
      : new Date(Date.now() + 3600 * 1000).toISOString(),
  }
}

export async function refreshAccessTokenIfNeeded(
  refreshToken: string,
  expiresAt: string | null,
): Promise<{ accessToken: string; expiresAt: string } | null> {
  if (expiresAt) {
    const expiryMs = new Date(expiresAt).getTime()
    if (Date.now() < expiryMs - 5 * 60 * 1000) {
      return null // still valid
    }
  }

  const client = createOAuth2Client(refreshToken)
  const { credentials } = await client.refreshAccessToken()

  if (!credentials.access_token) {
    throw new Error('Google OAuth: token refresh failed')
  }

  return {
    accessToken: credentials.access_token,
    expiresAt: credentials.expiry_date
      ? new Date(credentials.expiry_date).toISOString()
      : new Date(Date.now() + 3600 * 1000).toISOString(),
  }
}

function getCalendarApi(refreshToken: string): calendar_v3.Calendar {
  const auth = createOAuth2Client(refreshToken)
  return google.calendar({ version: 'v3', auth })
}

export async function getGoogleCalendarList(
  refreshToken: string,
): Promise<GoogleCalendarListEntry[]> {
  const cal = getCalendarApi(refreshToken)
  const res = await cal.calendarList.list()
  return (res.data.items ?? []).map((c) => ({
    id: c.id!,
    summary: c.summary || 'Sin nombre',
    primary: c.primary ?? false,
    accessRole: c.accessRole || 'reader',
  }))
}

export async function getAllGoogleEventsSince(
  refreshToken: string,
  calendarId: string,
  since: string,
): Promise<GoogleCalendarEvent[]> {
  const cal = getCalendarApi(refreshToken)
  const events: GoogleCalendarEvent[] = []
  let pageToken: string | undefined

  do {
    const res = await cal.events.list({
      calendarId,
      timeMin: since,
      singleEvents: true,
      orderBy: 'updated',
      maxResults: 250,
      pageToken,
    })
    for (const item of res.data.items ?? []) {
      if (!item.id) continue
      events.push({
        id: item.id,
        summary: item.summary || '',
        description: item.description ?? undefined,
        start: {
          dateTime: item.start?.dateTime ?? undefined,
          date: item.start?.date ?? undefined,
          timeZone: item.start?.timeZone ?? undefined,
        },
        end: {
          dateTime: item.end?.dateTime ?? undefined,
          date: item.end?.date ?? undefined,
          timeZone: item.end?.timeZone ?? undefined,
        },
        attendees: item.attendees?.map((a) => ({
          email: a.email!,
          responseStatus: a.responseStatus || 'needsAction',
        })),
        location: item.location ?? undefined,
        recurrence: item.recurrence ?? undefined,
        organizer: item.organizer ? { email: item.organizer.email! } : undefined,
        updated: item.updated ?? undefined,
        status: item.status ?? undefined,
      })
    }
    pageToken = res.data.nextPageToken ?? undefined
  } while (pageToken)

  return events
}

export async function getGoogleEvent(
  refreshToken: string,
  calendarId: string,
  eventId: string,
): Promise<GoogleCalendarEvent | null> {
  const cal = getCalendarApi(refreshToken)
  try {
    const res = await cal.events.get({ calendarId, eventId })
    const item = res.data
    if (!item.id) return null
    return {
      id: item.id,
      summary: item.summary || '',
      description: item.description ?? undefined,
      start: {
        dateTime: item.start?.dateTime ?? undefined,
        date: item.start?.date ?? undefined,
        timeZone: item.start?.timeZone ?? undefined,
      },
      end: {
        dateTime: item.end?.dateTime ?? undefined,
        date: item.end?.date ?? undefined,
        timeZone: item.end?.timeZone ?? undefined,
      },
      attendees: item.attendees?.map((a) => ({
        email: a.email!,
        responseStatus: a.responseStatus || 'needsAction',
      })),
      location: item.location ?? undefined,
      updated: item.updated ?? undefined,
      status: item.status ?? undefined,
    }
  } catch {
    return null
  }
}

export async function createGoogleEvent(
  refreshToken: string,
  calendarId: string,
  event: calendar_v3.Schema$Event,
): Promise<{ eventId: string }> {
  const cal = getCalendarApi(refreshToken)
  const res = await cal.events.insert({ calendarId, requestBody: event })
  return { eventId: res.data.id! }
}

export async function updateGoogleEvent(
  refreshToken: string,
  calendarId: string,
  eventId: string,
  event: calendar_v3.Schema$Event,
): Promise<void> {
  const cal = getCalendarApi(refreshToken)
  await cal.events.update({ calendarId, eventId, requestBody: event })
}

export async function deleteGoogleEvent(
  refreshToken: string,
  calendarId: string,
  eventId: string,
): Promise<void> {
  const cal = getCalendarApi(refreshToken)
  await cal.events.delete({ calendarId, eventId })
}
