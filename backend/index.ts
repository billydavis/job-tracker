import { Hono } from 'hono';
import { serve } from 'bun';
import usersRouter from './routes/users';
import jobsRouter from './routes/jobs';
import notesRouter from './routes/notes';
import companiesRouter from './routes/companies';
import authRouter from './routes/auth';
import auth from './middleware/auth';
import { logger } from './utils/logger';

const app = new Hono();

// Simple CORS middleware and preflight handling
app.use('*', async (c, next) => {
	try {
		// Allow CORS for credentialed requests by echoing the request Origin.
		// Browsers require a non-wildcard Access-Control-Allow-Origin when credentials
		// are used. We also allow credentials so cookies can be set when appropriate.
		// Robustly read Origin header from different header shapes (Headers or plain object)
		let origin = '';
		const hdrs = c.req?.headers || (c.req as any)?.raw?.headers || {};
		if (hdrs && typeof hdrs.get === 'function') {
			origin = hdrs.get('Origin') || hdrs.get('origin') || '';
		} else if (hdrs && typeof hdrs === 'object') {
			origin = hdrs['origin'] || hdrs['Origin'] || '';
		}
		const allowOrigin = origin || '*';
		c.header('Access-Control-Allow-Origin', allowOrigin);
		c.header('Vary', 'Origin');
		c.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
		c.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
		c.header('Access-Control-Allow-Credentials', 'true');

		if (c.req.method === 'OPTIONS') {
			return c.body(null, 204);
		}

		await next();
	} catch (err) {
		// If CORS middleware fails, ensure we still return minimal headers
		c.header('Access-Control-Allow-Origin', '*');
		c.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
		c.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
		return c.body(String(err ?? 'internal error'), 500);
	}
});

// HTTP request logger — skip OPTIONS preflights
app.use('*', async (c, next) => {
	if (c.req.method === 'OPTIONS') { await next(); return; }
	const start = Date.now();
	const method = c.req.method;
	const path = new URL(c.req.url).pathname;
	await next();
	const status = c.res.status;
	logger.info('http', { method, path, status, durationMs: Date.now() - start });
});

app.get('/api/health', c => c.json({ ok: true }));

app.route('/api/users', usersRouter);
app.route('/api/auth', authRouter);

// Protect CRUD endpoints with auth middleware; tokens may be sent via
// `Authorization: Bearer <token>` or cookie `token`.
// Apply auth to the router roots so both root and nested routes are protected
app.use('/api/jobs', auth);
app.use('/api/companies', auth);
app.use('/api/notes', auth);

app.route('/api/jobs', jobsRouter);
app.route('/api/notes', notesRouter);
app.route('/api/companies', companiesRouter);

const port = Number(process.env.PORT ?? 4000);
const server = serve({ fetch: app.fetch, port });
logger.info('server started', { url: String(server?.url ?? ''), port });
