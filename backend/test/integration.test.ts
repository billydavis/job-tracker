import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { Hono } from 'hono';
import authRouter from '../routes/auth';
import usersRouter from '../routes/users';
import jobsRouter from '../routes/jobs';
import companiesRouter from '../routes/companies';
import notesRouter from '../routes/notes';
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
});
