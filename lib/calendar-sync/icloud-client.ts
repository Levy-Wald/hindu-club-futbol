'use server'

import type { ICloudCalendarEvent } from './types'
import { parseICalendarString, generateICalendarString } from './icloud-event-mapping'

const CALDAV_BASE = 'https://caldav.icloud.com'

function basicAuthHeader(email: string, appPassword: string): string {
  return 'Basic ' + Buffer.from(`${email}:${appPassword}`).toString('base64')
}

/**
 * Discovers the primary calendar URL via CalDAV PROPFIND.
 */
export async function discoverICloudCalendarUrl(
  email: string,
  appPassword: string,
): Promise<string> {
  const auth = basicAuthHeader(email, appPassword)

  // Step 1: PROPFIND on well-known endpoint to get principal URL
  const principalRes = await fetch(`${CALDAV_BASE}/.well-known/caldav`, {
    method: 'PROPFIND',
    headers: {
      Authorization: auth,
      'Content-Type': 'application/xml; charset=utf-8',
      Depth: '0',
    },
    body: `<?xml version="1.0" encoding="utf-8"?>
<D:propfind xmlns:D="DAV:">
  <D:prop>
    <D:current-user-principal/>
  </D:prop>
</D:propfind>`,
    redirect: 'follow',
  })

  if (!principalRes.ok) {
    throw new Error(`CalDAV discovery failed: ${principalRes.status}`)
  }

  const principalXml = await principalRes.text()
  const principalMatch = principalXml.match(/<D:href[^>]*>([^<]+)<\/D:href>/i)
  const principalUrl = principalMatch?.[1]

  if (!principalUrl) {
    throw new Error('Could not discover CalDAV principal URL')
  }

  // Step 2: PROPFIND on principal to get calendar-home-set
  const homeRes = await fetch(`${CALDAV_BASE}${principalUrl}`, {
    method: 'PROPFIND',
    headers: {
      Authorization: auth,
      'Content-Type': 'application/xml; charset=utf-8',
      Depth: '0',
    },
    body: `<?xml version="1.0" encoding="utf-8"?>
<D:propfind xmlns:D="DAV:" xmlns:C="urn:ietf:params:xml:ns:caldav">
  <D:prop>
    <C:calendar-home-set/>
  </D:prop>
</D:propfind>`,
  })

  if (!homeRes.ok) {
    throw new Error(`CalDAV home-set discovery failed: ${homeRes.status}`)
  }

  const homeXml = await homeRes.text()
  const homeMatch = homeXml.match(/<D:href[^>]*>([^<]+)<\/D:href>/gi)
  // The second href is typically the calendar-home-set
  const calendarHome = homeMatch && homeMatch.length > 1
    ? homeMatch[1].replace(/<[^>]+>/g, '')
    : homeMatch?.[0]?.replace(/<[^>]+>/g, '')

  if (!calendarHome) {
    throw new Error('Could not discover calendar home set')
  }

  // Step 3: PROPFIND on calendar-home-set to list calendars
  const calListRes = await fetch(`${CALDAV_BASE}${calendarHome}`, {
    method: 'PROPFIND',
    headers: {
      Authorization: auth,
      'Content-Type': 'application/xml; charset=utf-8',
      Depth: '1',
    },
    body: `<?xml version="1.0" encoding="utf-8"?>
<D:propfind xmlns:D="DAV:" xmlns:C="urn:ietf:params:xml:ns:caldav" xmlns:CS="http://calendarserver.org/ns/">
  <D:prop>
    <D:displayname/>
    <D:resourcetype/>
    <CS:getctag/>
  </D:prop>
</D:propfind>`,
  })

  if (!calListRes.ok) {
    throw new Error(`CalDAV calendar list failed: ${calListRes.status}`)
  }

  const calListXml = await calListRes.text()
  // Find the first response with a calendar resourcetype
  const calendarHrefMatch = calListXml.match(
    /<D:response>[\s\S]*?<C:calendar\s*\/>[\s\S]*?<D:href[^>]*>([^<]+)<\/D:href>[\s\S]*?<\/D:response>/i,
  ) ?? calListXml.match(/<D:href[^>]*>([^<]+\.ics[^<]*)<\/D:href>/i)

  // Fallback: use the calendar home + first sub-path
  const calendarUrl = calendarHrefMatch?.[1] ?? calendarHome

  return `${CALDAV_BASE}${calendarUrl}`
}

/**
 * Verifies iCloud credentials by attempting PROPFIND.
 */
export async function authenticateICloud(
  email: string,
  appPassword: string,
): Promise<boolean> {
  try {
    const auth = basicAuthHeader(email, appPassword)
    const res = await fetch(`${CALDAV_BASE}/.well-known/caldav`, {
      method: 'PROPFIND',
      headers: {
        Authorization: auth,
        'Content-Type': 'application/xml; charset=utf-8',
        Depth: '0',
      },
      body: `<?xml version="1.0" encoding="utf-8"?>
<D:propfind xmlns:D="DAV:">
  <D:prop><D:current-user-principal/></D:prop>
</D:propfind>`,
      redirect: 'follow',
    })
    return res.ok || res.status === 207
  } catch {
    return false
  }
}

/**
 * Fetches all events modified since a given date via REPORT.
 */
export async function getAllICloudEventsSince(
  calendarUrl: string,
  email: string,
  appPassword: string,
  since: string,
): Promise<ICloudCalendarEvent[]> {
  const auth = basicAuthHeader(email, appPassword)
  const sinceDate = since.split('T')[0].replace(/-/g, '') + 'T000000Z'

  const res = await fetch(calendarUrl, {
    method: 'REPORT',
    headers: {
      Authorization: auth,
      'Content-Type': 'application/xml; charset=utf-8',
      Depth: '1',
    },
    body: `<?xml version="1.0" encoding="utf-8"?>
<C:calendar-query xmlns:D="DAV:" xmlns:C="urn:ietf:params:xml:ns:caldav">
  <D:prop>
    <D:getetag/>
    <C:calendar-data/>
  </D:prop>
  <C:filter>
    <C:comp-filter name="VCALENDAR">
      <C:comp-filter name="VEVENT">
        <C:time-range start="${sinceDate}"/>
      </C:comp-filter>
    </C:comp-filter>
  </C:filter>
</C:calendar-query>`,
  })

  if (!res.ok && res.status !== 207) {
    throw new Error(`CalDAV REPORT failed: ${res.status}`)
  }

  const xml = await res.text()
  const events: ICloudCalendarEvent[] = []

  // Extract calendar-data blocks from multistatus response
  const responseBlocks = xml.split(/<D:response>/gi).slice(1)
  for (const block of responseBlocks) {
    const calDataMatch = block.match(/<C:calendar-data[^>]*>([\s\S]*?)<\/C:calendar-data>/i)
    const etagMatch = block.match(/<D:getetag[^>]*>"?([^"<]+)"?<\/D:getetag>/i)

    if (calDataMatch?.[1]) {
      const icsData = calDataMatch[1]
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
      const parsed = parseICalendarString(icsData)
      for (const ev of parsed) {
        ev.etag = etagMatch?.[1] ?? undefined
        events.push(ev)
      }
    }
  }

  return events
}

/**
 * Creates a new event via PUT.
 */
export async function createICloudEvent(
  calendarUrl: string,
  email: string,
  appPassword: string,
  event: ICloudCalendarEvent,
): Promise<{ uid: string; etag: string }> {
  const auth = basicAuthHeader(email, appPassword)
  const icsContent = generateICalendarString(event)
  const eventUrl = `${calendarUrl}${event.uid}.ics`

  const res = await fetch(eventUrl, {
    method: 'PUT',
    headers: {
      Authorization: auth,
      'Content-Type': 'text/calendar; charset=utf-8',
      'If-None-Match': '*', // Only create, don't overwrite
    },
    body: icsContent,
  })

  if (!res.ok && res.status !== 201 && res.status !== 204) {
    throw new Error(`CalDAV PUT (create) failed: ${res.status}`)
  }

  const etag = res.headers.get('ETag') ?? ''
  return { uid: event.uid, etag }
}

/**
 * Updates an existing event via PUT with If-Match (ETag).
 */
export async function updateICloudEvent(
  calendarUrl: string,
  email: string,
  appPassword: string,
  event: ICloudCalendarEvent,
  ifMatch: string,
): Promise<{ etag: string }> {
  const auth = basicAuthHeader(email, appPassword)
  const icsContent = generateICalendarString(event)
  const eventUrl = `${calendarUrl}${event.uid}.ics`

  const res = await fetch(eventUrl, {
    method: 'PUT',
    headers: {
      Authorization: auth,
      'Content-Type': 'text/calendar; charset=utf-8',
      'If-Match': ifMatch,
    },
    body: icsContent,
  })

  if (!res.ok && res.status !== 204) {
    throw new Error(`CalDAV PUT (update) failed: ${res.status}`)
  }

  const etag = res.headers.get('ETag') ?? ifMatch
  return { etag }
}

/**
 * Deletes an event via DELETE with If-Match (ETag).
 */
export async function deleteICloudEvent(
  calendarUrl: string,
  email: string,
  appPassword: string,
  uid: string,
  ifMatch?: string,
): Promise<void> {
  const auth = basicAuthHeader(email, appPassword)
  const eventUrl = `${calendarUrl}${uid}.ics`

  const headers: Record<string, string> = {
    Authorization: auth,
  }
  if (ifMatch) headers['If-Match'] = ifMatch

  const res = await fetch(eventUrl, {
    method: 'DELETE',
    headers,
  })

  if (!res.ok && res.status !== 204 && res.status !== 404) {
    throw new Error(`CalDAV DELETE failed: ${res.status}`)
  }
}
