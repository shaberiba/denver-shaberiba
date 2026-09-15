import { Hono } from "hono";
import { cors } from 'hono/cors'
import { FacebookEventsResponse } from "./facebookEvent";
import { buildEventsICS } from "./calendarFeed";
import { ContentfulStatusCode } from "hono/utils/http-status";

const app = new Hono<{ Bindings: Env }>();

app.get("/api/", (c) => c.json({ name: "Cloudflare" }));


// Environment variables interface for Cloudflare Workers
interface Env {
    FACEBOOK_PAGE_ACCESS_TOKEN: string
    FACEBOOK_PAGE_ID: string
}

// Enable CORS for frontend requests
app.use('/api/*', cors())

class FacebookApiError extends Error {
    constructor(message: string, public status: number) {
        super(message)
    }
}

// Shared helper for calling the Facebook Graph API events endpoint
const fetchFacebookEvents = async (
    env: Env,
    params: { since?: string; until?: string; limit?: string }
): Promise<FacebookEventsResponse> => {
    const { FACEBOOK_PAGE_ACCESS_TOKEN, FACEBOOK_PAGE_ID } = env

    if (!FACEBOOK_PAGE_ACCESS_TOKEN || !FACEBOOK_PAGE_ID) {
        throw new FacebookApiError('FACEBOOK_PAGE_ACCESS_TOKEN and FACEBOOK_PAGE_ID must be set', 500)
    }

    let fbUrl = `https://graph.facebook.com/v23.0/${FACEBOOK_PAGE_ID}/events`
    const searchParams = new URLSearchParams({
        access_token: FACEBOOK_PAGE_ACCESS_TOKEN,
        limit: params.limit || '50',
        fields: 'id,name,description,start_time,end_time,place{name,location},cover{source},event_times',
    })

    if (params.since) searchParams.append('since', params.since)
    if (params.until) searchParams.append('until', params.until)

    fbUrl += '?' + searchParams.toString()

    const response = await fetch(fbUrl, {
        method: 'GET',
        headers: {
            'Accept': 'application/json',
        }
    })

    if (!response.ok) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const errorData: any = await response.json();
        console.error('Facebook API Error:', errorData)
        throw new FacebookApiError(errorData.error?.message || 'Failed to fetch events', response.status)
    }

    return response.json()
}

// Facebook Events endpoint
app.get('/api/events', async (c) => {
    try {
        // Optional query parameters
        const since = c.req.query('since') // Format: YYYY-MM-DD
        const until = c.req.query('until') // Format: YYYY-MM-DD
        const limit = c.req.query('limit') || '50' // Default 50 events

        const facebookData = await fetchFacebookEvents(c.env, { since, until, limit })

        return c.json(facebookData)

    } catch (error) {
        if (error instanceof FacebookApiError) {
            return c.json({
                error: 'Facebook API Error',
                message: error.message,
            }, error.status as ContentfulStatusCode)
        }

        console.error('Server Error:', error)

        return c.json({
            error: 'Internal Server Error',
            message: 'Failed to fetch events',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, 500)
    }
})

// Combined .ics feed of every upcoming event, for bulk import/subscription in Google, Apple & Outlook calendars
app.get('/api/events/calendar.ics', async (c) => {
    try {
        const facebookData = await fetchFacebookEvents(c.env, { limit: '100' })
        const ics = buildEventsICS(facebookData.data)

        c.header('Content-Type', 'text/calendar; charset=utf-8')
        c.header('Content-Disposition', 'attachment; filename="denver-shaberiba-events.ics"')
        return c.body(ics)

    } catch (error) {
        if (error instanceof FacebookApiError) {
            return c.json({
                error: 'Facebook API Error',
                message: error.message,
            }, error.status as ContentfulStatusCode)
        }

        console.error('Server Error:', error)

        return c.json({
            error: 'Internal Server Error',
            message: 'Failed to build calendar feed',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, 500)
    }
})

export default app;
