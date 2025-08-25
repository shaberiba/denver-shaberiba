import { Hono } from "hono";
import { cors } from 'hono/cors'
import { FacebookEventsResponse } from "./facebookEvent";

const app = new Hono<{ Bindings: Env }>();

app.get("/api/", (c) => c.json({ name: "Cloudflare" }));


// Environment variables interface for Cloudflare Workers
interface Env {
    FACEBOOK_APP_ACCESS_TOKEN: string
    FACEBOOK_PAGE_ID: string
}

// Enable CORS for frontend requests
app.use('/api/*', cors())

// Facebook Events endpoint
app.get('/api/events', async (c) => {
    try {
        const { FACEBOOK_APP_ACCESS_TOKEN, FACEBOOK_PAGE_ID } = c.env

        // Check if required environment variables are set
        if (!FACEBOOK_APP_ACCESS_TOKEN || !FACEBOOK_PAGE_ID) {
            return c.json({
                error: 'Missing required environment variables',
                message: 'FACEBOOK_APP_ACCESS_TOKEN and FACEBOOK_PAGE_ID must be set'
            }, 500)
        }

        // Optional query parameters
        const since = c.req.query('since') // Format: YYYY-MM-DD
        const until = c.req.query('until') // Format: YYYY-MM-DD
        const limit = c.req.query('limit') || '50' // Default 50 events

        let fbUrl = `https://graph.facebook.com/v23.0/${FACEBOOK_PAGE_ID}/events`
        const params = new URLSearchParams({
            access_token: FACEBOOK_APP_ACCESS_TOKEN,
            limit: limit
        })

        // Add time filters if provided
        if (since) params.append('since', since)
        if (until) params.append('until', until)

        fbUrl += '?' + params.toString()

        // Fetch events from Facebook
        const response = await fetch(fbUrl, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
            }
        })

        if (!response.ok) {
            const errorData = await response.json()
            console.error('Facebook API Error:', errorData)

            return c.json({
                error: 'Facebook API Error',
                message: errorData.error?.message || 'Failed to fetch events',
                status: response.status
            }, response.status)
        }

        const facebookData: FacebookEventsResponse = await response.json()

        return c.json(facebookData)

    } catch (error) {
        console.error('Server Error:', error)

        return c.json({
            error: 'Internal Server Error',
            message: 'Failed to fetch events',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, 500)
    }
})

export default app;
