import { Hono } from 'hono';
import { getCollection, getObjectId } from '../db';
import { normalizeArray, normalizeDoc } from '../utils/dto';
import { logger } from '../utils/logger';

const usersRouter = new Hono();

usersRouter.get('/', async c => {
    const col = await getCollection('users');
    const docs = await col.find().toArray();
    return c.json(normalizeArray(docs));
});

usersRouter.post('/', async c => {
    try {
        const body = await c.req.json();
        const col = await getCollection('users');
        const now = new Date().toISOString();
        const doc = { name: body.name, email: body.email, createdAt: now } as any;
        const res = await col.insertOne(doc);
        const saved = await col.findOne({ _id: res.insertedId } as any);
        return c.json(saved ? normalizeDoc(saved) : { ...doc, _id: res.insertedId.toString() }, 201);
    } catch (err: any) {
        logger.error('POST /api/users failed', { err: err?.message ?? String(err) });
        return c.json({ error: String(err?.message ?? err) }, 500);
    }
});

usersRouter.get('/:id', async c => {
    const id = c.req.param('id') as string;
    const col = await getCollection('users');
    const doc = await col.findOne({ _id: getObjectId(id) } as any);
    return doc ? c.json(normalizeDoc(doc)) : c.body(null, 404);
});

usersRouter.put('/:id', async c => {
    const id = c.req.param('id') as string;
    const body = await c.req.json();
    const col = await getCollection('users');
    const res = await col.findOneAndUpdate(
        { _id: getObjectId(id) } as any,
        { $set: { name: body.name, email: body.email } },
        { returnDocument: 'after' } as any
    );
    const doc = res;
    return doc ? c.json(normalizeDoc(doc)) : c.body(null, 404);
});

usersRouter.delete('/:id', async c => {
    const id = c.req.param('id') as string;
    const col = await getCollection('users');
    const res = await col.deleteOne({ _id: getObjectId(id) } as any);
    return c.body(null, res.deletedCount ? 204 : 404);
});

export default usersRouter;
