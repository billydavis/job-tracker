import type { Context } from 'hono';
import jwt from 'jsonwebtoken';

// Hono middleware to verify JWT from Authorization header or cookie 'token'.
// On success sets `c.set('user', payload)` where payload is the decoded token.
export async function auth(c: Context, next: () => Promise<void>) {
    const authHeader = c.req.header('authorization') ?? '';
    const tokenFromHeader = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';

    // Hono request may not expose a `cookie()` helper in all environments
    // so parse `Cookie` header manually.
    function parseCookie(header: string | null, name: string) {
        if (!header) return '';
        const pairs = header.split(';').map(p => p.trim());
        for (const p of pairs) {
            const [k, v] = p.split('=');
            if (k === name) return v ?? '';
        }
        return '';
    }

    // Use Hono's `header` helper for portability
    const cookieHeader = c.req.header('cookie');
    const tokenFromCookie = parseCookie(cookieHeader, 'token');
    const token = tokenFromHeader || tokenFromCookie || '';

    if (!token) {
        return c.json({ error: 'Unauthorized' }, 401);
    }

    const source = tokenFromHeader ? 'header' : tokenFromCookie ? 'cookie' : 'unknown';
    if (process.env.NODE_ENV !== 'production') {
        console.debug(`[auth] token source: ${source}`);
    }

    try {
        const secret = process.env.JWT_SECRET ?? 'dev-secret';
        const payload = jwt.verify(token, secret) as Record<string, any>;
        if (process.env.NODE_ENV !== 'production') {
            console.debug('[auth] verified payload:', { id: payload.id, email: payload.email, exp: payload.exp });
        }
        c.set('user', payload);
        await next();
    } catch (err: any) {
        console.error('auth middleware verify error:', err?.message ?? err);
        return c.json({ error: 'Unauthorized' }, 401);
    }
}

export default auth;
