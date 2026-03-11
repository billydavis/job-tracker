import { Hono } from 'hono';
import { getCollection, getObjectId } from '../db';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import auth from '../middleware/auth';
import { registerSchema, loginSchema } from '../validators/auth';
import { normalizeDoc } from '../utils/dto';

const authRouter = new Hono();

function makeToken(payload: any) {
  const secret = process.env.JWT_SECRET ?? 'dev-secret';
  const expiresIn = process.env.JWT_EXPIRES_IN ?? '15m';
  return jwt.sign(payload, secret, { expiresIn });
}

function buildCookie(token: string) {
  const maxAge = Number(process.env.JWT_MAX_AGE_SECONDS ?? 60 * 60 * 24); // default 1 day
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  const sameSite = process.env.NODE_ENV === 'production' ? 'Strict' : 'Lax';
  return `token=${token}; HttpOnly; Path=/; Max-Age=${maxAge}; SameSite=${sameSite}${secure}`;
}

function parseCookie(header: string | null, name: string) {
  if (!header) return '';
  const pairs = header.split(';').map(p => p.trim());
  for (const p of pairs) {
    const [k, v] = p.split('=');
    if (k === name) return v ?? '';
  }
  return '';
}

function getTokenFromRequest(c: any) {
  const authHeader = c.req.header('authorization') ?? '';
  const tokenFromHeader = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  const tokenFromCookie = parseCookie(c.req.header('cookie'), 'token');
  return tokenFromHeader || tokenFromCookie || '';
}

// Register
authRouter.post('/register', async c => {
  const body = await c.req.json();
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) return c.json({ errors: parsed.error.format() }, 400);

  const users = await getCollection('users');
  const existing = await users.findOne({ email: parsed.data.email } as any);
  if (existing) return c.json({ error: 'email already in use' }, 409);

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);
  const now = new Date();
  const doc = { name: parsed.data.name, email: parsed.data.email, passwordHash, createdAt: now } as any;
  const res = await users.insertOne(doc);

  const saved = await users.findOne({ _id: res.insertedId } as any);
  const { passwordHash: _ph, ...safe } = saved as any;
  const token = makeToken({ id: res.insertedId.toString(), email: doc.email });

  c.header('Set-Cookie', buildCookie(token));
  return c.json({ user: normalizeDoc(safe) }, 201);
});

// Login
authRouter.post('/login', async c => {
  const body = await c.req.json();
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) return c.json({ errors: parsed.error.format() }, 400);

  const users = await getCollection('users');
  const userDoc = await users.findOne({ email: parsed.data.email } as any);
  if (!userDoc) return c.json({ error: 'invalid credentials' }, 401);

  const ok = await bcrypt.compare(parsed.data.password, userDoc.passwordHash ?? '');
  if (!ok) return c.json({ error: 'invalid credentials' }, 401);

  const { passwordHash, ...safe } = userDoc as any;
  const token = makeToken({ id: userDoc._id.toString(), email: userDoc.email });

  c.header('Set-Cookie', buildCookie(token));
  return c.json({ user: normalizeDoc(safe) });
});

// Logout
authRouter.post('/logout', async c => {
  // Clear cookie
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  const sameSite = process.env.NODE_ENV === 'production' ? 'Strict' : 'Lax';
  c.header('Set-Cookie', `token=; HttpOnly; Path=/; Max-Age=0; SameSite=${sameSite}${secure}`);
  return c.json({ ok: true });
});

// Refresh cookie-based auth token
authRouter.post('/refresh', async c => {
  const token = getTokenFromRequest(c);
  if (!token) return c.json({ error: 'Unauthorized' }, 401);

  try {
    const secret = process.env.JWT_SECRET ?? 'dev-secret';
    const payload = jwt.verify(token, secret, { ignoreExpiration: true }) as Record<string, any>;
    if (!payload?.id || !payload?.email) return c.json({ error: 'Unauthorized' }, 401);

    const users = await getCollection('users');
    const userDoc = await users.findOne({ _id: getObjectId(payload.id) } as any);
    if (!userDoc) return c.json({ error: 'Unauthorized' }, 401);

    const nextToken = makeToken({ id: payload.id, email: payload.email });
    c.header('Set-Cookie', buildCookie(nextToken));
    return c.json({ ok: true });
  } catch {
    return c.json({ error: 'Unauthorized' }, 401);
  }
});

// Get current authenticated user
authRouter.get('/me', auth, async c => {
  const authUser = (c as any).get('user') as any;
  if (!authUser?.id) return c.json({ error: 'Unauthorized' }, 401);

  const users = await getCollection('users');
  const doc = await users.findOne({ _id: getObjectId(authUser.id) } as any);
  if (!doc) return c.json({ error: 'Not found' }, 404);

  // remove sensitive fields
  const { passwordHash, ...rest } = doc as any;
  return c.json(normalizeDoc(rest));
});

export default authRouter;
