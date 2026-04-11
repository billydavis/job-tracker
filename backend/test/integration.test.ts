// Must run before any DB connection — Vitest loads test/setup.ts via config, but `bun test`
// only picks this up via bunfig.toml preload OR this side-effect import.
import './setup';

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { Hono } from 'hono';
import authRouter from '../routes/auth';
import usersRouter from '../routes/users';
import jobsRouter from '../routes/jobs';
import companiesRouter from '../routes/companies';
import notesRouter from '../routes/notes';
import auth from '../middleware/auth';
import { connect, getCollection } from '../db';

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
        const db = await connect();
        const name = db.databaseName;
        if (name !== 'job-tracker-test') {
            throw new Error(
                `Refusing to drop database "${name}": integration tests must use job-tracker-test only.`,
            );
        }
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

    it('lists companies with jobCount per company when authenticated', async () => {
        const payload = { name: 'Count User', email: 'count@example.com', password: 'password123' };
        const regReq = new Request('http://localhost/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        const regRes = await app.fetch(regReq);
        expect(regRes.status).toBe(201);
        const cookie = (regRes.headers.get('set-cookie') ?? '').split(';')[0];

        const emptyCoReq = new Request('http://localhost/api/companies', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Cookie: cookie },
            body: JSON.stringify({ name: 'No Jobs Inc' }),
        });
        const emptyCoRes = await app.fetch(emptyCoReq);
        expect(emptyCoRes.status).toBe(201);
        const emptyCo = await emptyCoRes.json() as { _id: string };

        const coReq = new Request('http://localhost/api/companies', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Cookie: cookie },
            body: JSON.stringify({ name: 'Acme With Jobs' }),
        });
        const coRes = await app.fetch(coReq);
        expect(coRes.status).toBe(201);
        const company = await coRes.json() as { _id: string };

        for (let i = 0; i < 2; i++) {
            const jobReq = new Request('http://localhost/api/jobs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Cookie: cookie },
                body: JSON.stringify({
                    companyId: company._id,
                    title: `Role ${i}`,
                    status: 'applied',
                }),
            });
            const jobRes = await app.fetch(jobReq);
            expect(jobRes.status).toBe(201);
        }

        const listReq = new Request('http://localhost/api/companies', {
            headers: { Cookie: cookie },
        });
        const listRes = await app.fetch(listReq);
        expect(listRes.status).toBe(200);
        const list = (await listRes.json()) as Array<{ _id: string; name: string; jobCount?: number }>;

        const withJobs = list.find((c) => c._id === company._id);
        const withoutJobs = list.find((c) => c._id === emptyCo._id);
        expect(withJobs?.jobCount).toBe(2);
        expect(withoutJobs?.jobCount).toBe(0);

        const jobsByCoReq = new Request(
            `http://localhost/api/jobs?companyId=${company._id}&page=1&limit=50`,
            { headers: { Cookie: cookie } },
        );
        const jobsByCoRes = await app.fetch(jobsByCoReq);
        expect(jobsByCoRes.status).toBe(200);
        const jobsByCo = (await jobsByCoRes.json()) as { data: unknown[]; total: number };
        expect(jobsByCo.total).toBe(2);
        expect(jobsByCo.data).toHaveLength(2);

        const badCoReq = new Request('http://localhost/api/jobs?companyId=not-an-objectid', {
            headers: { Cookie: cookie },
        });
        const badCoRes = await app.fetch(badCoReq);
        expect(badCoRes.status).toBe(400);
    });
});
