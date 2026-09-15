import { Hono } from "hono";
import { cors } from 'hono/cors'
import { FacebookEventsResponse } from "./facebookEvent";
import { buildEventsICS } from "./calendarFeed";
import { getPageAccessToken, refreshPageAccessToken, TokenEnv } from "./tokenRefresh";
import { ContentfulStatusCode } from "hono/utils/http-status";

const app = new Hono<{ Bindings: Env }>();

app.get("/api/", (c) => c.json({ name: "Cloudflare" }));


// Environment variables interface for Cloudflare Workers
interface Env extends TokenEnv {
    FACEBOOK_PAGE_ID: string
    // Optional: enables POST /api/admin/refresh-token for on-demand testing of the token refresh
    ADMIN_REFRESH_SECRET?: string
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
    const { FACEBOOK_PAGE_ID } = env

    if (!FACEBOOK_PAGE_ID) {
        throw new FacebookApiError('FACEBOOK_PAGE_ID must be set', 500)
    }

    let accessToken: string
    try {
        accessToken = await getPageAccessToken(env)
    } catch (error) {
        throw new FacebookApiError(error instanceof Error ? error.message : 'No Facebook access token available', 500)
    }

    let fbUrl = `https://graph.facebook.com/v23.0/${FACEBOOK_PAGE_ID}/events`
    const searchParams = new URLSearchParams({
        access_token: accessToken,
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

// On-demand token refresh, for testing without waiting for the weekly cron.
// Disabled unless ADMIN_REFRESH_SECRET is set, and requires it as a bearer token.
app.post('/api/admin/refresh-token', async (c) => {
    const { ADMIN_REFRESH_SECRET } = c.env

    if (!ADMIN_REFRESH_SECRET) {
        return c.json({ error: 'Not enabled', message: 'ADMIN_REFRESH_SECRET is not set' }, 404)
    }

    const auth = c.req.header('Authorization')
    if (auth !== `Bearer ${ADMIN_REFRESH_SECRET}`) {
        return c.json({ error: 'Unauthorized' }, 401)
    }

    try {
        const result = await refreshPageAccessToken(c.env)
        return c.json({ ok: true, refreshedAt: result.refreshedAt, expiresInSeconds: result.expiresInSeconds })
    } catch (error) {
        console.error('Token refresh failed:', error)
        return c.json({
            error: 'Token refresh failed',
            message: error instanceof Error ? error.message : 'Unknown error',
        }, 500)
    }
})

export default {
    fetch: app.fetch,
    // Runs on the wrangler.json cron schedule to keep the Facebook page token fresh
    // without ever needing a manually re-uploaded secret.
    scheduled: async (_controller, env: Env) => {
        try {
            const result = await refreshPageAccessToken(env)
            console.log('Facebook page token refreshed at', result.refreshedAt)
        } catch (error) {
            console.error('Scheduled Facebook token refresh failed:', error)
        }
    },
} satisfies ExportedHandler<Env>;
