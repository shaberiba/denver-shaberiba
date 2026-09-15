interface StoredToken {
    accessToken: string;
    refreshedAt: string; // ISO timestamp
    expiresInSeconds?: number;
}

const TOKEN_KV_KEY = 'facebook_page_access_token';

export interface TokenEnv {
    FB_TOKEN_KV?: KVNamespace;
    FACEBOOK_PAGE_ACCESS_TOKEN?: string;
    FACEBOOK_APP_ID?: string;
    FACEBOOK_APP_SECRET?: string;
}

// Reads the current Facebook page access token: the auto-refreshed one from KV if we have it,
// otherwise falls back to the manually-set secret (also the bootstrap value for a fresh KV store)
export const getPageAccessToken = async (env: TokenEnv): Promise<string> => {
    const stored = await env.FB_TOKEN_KV?.get(TOKEN_KV_KEY);
    if (stored) {
        const parsed: StoredToken = JSON.parse(stored);
        return parsed.accessToken;
    }

    if (!env.FACEBOOK_PAGE_ACCESS_TOKEN) {
        throw new Error('No Facebook page access token available: FB_TOKEN_KV is empty and FACEBOOK_PAGE_ACCESS_TOKEN is not set');
    }

    return env.FACEBOOK_PAGE_ACCESS_TOKEN;
};

// Exchanges the current token for a fresh long-lived one and stores it in KV, so the Worker
// never needs a manually re-uploaded secret again. Requires FACEBOOK_APP_ID/FACEBOOK_APP_SECRET
// (permanent app credentials, set once) and a KV binding to persist the rotated token into.
export const refreshPageAccessToken = async (env: TokenEnv): Promise<StoredToken> => {
    if (!env.FB_TOKEN_KV) {
        throw new Error('FB_TOKEN_KV binding is not configured');
    }
    if (!env.FACEBOOK_APP_ID || !env.FACEBOOK_APP_SECRET) {
        throw new Error('FACEBOOK_APP_ID and FACEBOOK_APP_SECRET must be set to refresh the token');
    }

    const currentToken = await getPageAccessToken(env);

    const params = new URLSearchParams({
        grant_type: 'fb_exchange_token',
        client_id: env.FACEBOOK_APP_ID,
        client_secret: env.FACEBOOK_APP_SECRET,
        fb_exchange_token: currentToken,
    });

    const response = await fetch(`https://graph.facebook.com/v23.0/oauth/access_token?${params.toString()}`);

    if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Facebook token refresh failed (${response.status}): ${errorBody}`);
    }

    const data: { access_token: string; expires_in?: number } = await response.json();

    const record: StoredToken = {
        accessToken: data.access_token,
        refreshedAt: new Date().toISOString(),
        expiresInSeconds: data.expires_in,
    };

    await env.FB_TOKEN_KV.put(TOKEN_KV_KEY, JSON.stringify(record));

    return record;
};
