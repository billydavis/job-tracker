import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { Hono } from 'hono';
import authRouter from '../routes/auth';
import usersRouter from '../routes/users';
import jobsRouter from '../routes/jobs';
import companiesRouter from '../routes/companies';
import notesRouter from '../routes/notes';
import auth from '../middleware/auth';
import { connect, getCollection } from '../db';

// Use a dedicated test database
process.env.MONGO_DB = process.env.MONGO_DB ?? 'job-tracker-test';

describe('Integration — auth routes (real MongoDB)', () => {
    let app: Hono;

    beforeAll(async () => {
        await connect();
    });

    beforeEach(async () => {
        // start with empty collections
        const colNames = ['users', 'jobs', 'companies', 'notes'];
        for (const n of colNames) {
            const col = await getCollection(n);
            await col.deleteMany({});
        }

        app = new Hono();
        app.route('/api/auth', authRouter);
        app.route('/api/users', usersRouter);
        app.use('/api/jobs', auth);
        app.use('/api/jobs/*', auth);
        app.use('/api/companies', auth);
        app.use('/api/companies/*', auth);
        app.use('/api/notes', auth);
        app.use('/api/notes/*', auth);
        app.route('/api/jobs', jobsRouter);
        app.route('/api/companies', companiesRouter);
        app.route('/api/notes', notesRouter);
    });

    afterAll(async () => {
        // cleanup test DB
        const db = await connect();
        await db.dropDatabase();
    });

    it('returns 400 for invalid register payload', async () => {
        const req = new Request('http://localhost/api/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'bad' }) });
        const res = await app.fetch(req);
        expect(res.status).toBe(400);
        const j = await res.json() as any;
        expect(j.errors).toBeTruthy();
    });

    it('registers a user successfully and allows login', async () => {
        const payload = { name: 'Test User', email: 'test@example.com', password: 'password123' };
        const regReq = new Request('http://localhost/api/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        const regRes = await app.fetch(regReq);
        expect(regRes.status).toBe(201);
        const regJson = await regRes.json() as any;
        expect(regJson.user).toBeTruthy();
        expect(regJson.user.email).toBe(payload.email);

        const loginReq = new Request('http://localhost/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: payload.email, password: payload.password }) });
        const loginRes = await app.fetch(loginReq);
        expect(loginRes.status).toBe(200);
        const loginJson = await loginRes.json() as any;
        expect(loginJson.user).toBeTruthy();
        expect(loginJson.user.email).toBe(payload.email);
    });

    it('refreshes auth cookie when a valid token cookie is present', async () => {
        const payload = { name: 'Refresh User', email: 'refresh@example.com', password: 'password123' };
        const regReq = new Request('http://localhost/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        const regRes = await app.fetch(regReq);
        expect(regRes.status).toBe(201);

        const setCookie = regRes.headers.get('set-cookie');
        expect(setCookie).toBeTruthy();
        const cookie = (setCookie ?? '').split(';')[0];

        const refreshReq = new Request('http://localhost/api/auth/refresh', {
            method: 'POST',
            headers: { Cookie: cookie },
        });
        const refreshRes = await app.fetch(refreshReq);
        expect(refreshRes.status).toBe(200);

        const refreshJson = await refreshRes.json() as any;
        expect(refreshJson.ok).toBe(true);
        expect(refreshRes.headers.get('set-cookie')).toContain('token=');
    });

    it('updates a job successfully when authenticated via cookie', async () => {
        const payload = { name: 'Update User', email: 'update@example.com', password: 'password123' };
        const regReq = new Request('http://localhost/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        const regRes = await app.fetch(regReq);
        expect(regRes.status).toBe(201);

        const cookie = (regRes.headers.get('set-cookie') ?? '').split(';')[0];
        expect(cookie).toContain('token=');

        const companyReq = new Request('http://localhost/api/companies', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Cookie: cookie,
            },
            body: JSON.stringify({ name: 'Acme' }),
        });
        const companyRes = await app.fetch(companyReq);
        expect(companyRes.status).toBe(201);
        const company = await companyRes.json() as any;

        const createJobReq = new Request('http://localhost/api/jobs', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Cookie: cookie,
            },
            body: JSON.stringify({ companyId: company._id, title: 'Engineer', status: 'applied' }),
        });
        const createJobRes = await app.fetch(createJobReq);
        expect(createJobRes.status).toBe(201);
        const job = await createJobRes.json() as any;

        const updateJobReq = new Request(`http://localhost/api/jobs/${job._id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                Cookie: cookie,
            },
            body: JSON.stringify({ status: 'interview', title: 'Senior Engineer' }),
        });
        const updateJobRes = await app.fetch(updateJobReq);
        expect(updateJobRes.status).toBe(200);
        const updated = await updateJobRes.json() as any;
        expect(updated.status).toBe('interview');
        expect(updated.title).toBe('Senior Engineer');
    });
});
