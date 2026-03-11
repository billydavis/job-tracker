import { Hono } from 'hono';
import { getCollection, getObjectId } from '../db';
import { createJobSchema, updateJobSchema } from '../validators/jobs';
import { normalizeArray, normalizeDoc } from '../utils/dto';

const jobsRouter = new Hono();

// List jobs (owned by auth user or query param)
jobsRouter.get('/', async c => {
    const queryUserId = c.req.query('userId');
    const authUser = c.get('user') as any;
    const col = await getCollection('jobs');
    const filter: any = {};
    if (authUser?.id) filter.userId = getObjectId(authUser.id);
    else if (queryUserId) filter.userId = getObjectId(queryUserId as string);
    const docs = await col.find(filter).toArray();
    return c.json(normalizeArray(docs));
});

// Create job
jobsRouter.post('/', async c => {
    const body = await c.req.json();
    const parsed = createJobSchema.safeParse(body);
    if (!parsed.success) return c.json({ errors: parsed.error.format() }, 400);

    const authUser = c.get('user') as any;
    if (!authUser?.id) return c.json({ error: 'Unauthorized' }, 401);

    const col = await getCollection('jobs');
    const now = new Date().toISOString();
    const doc = {
        userId: getObjectId(authUser.id),
        companyId: getObjectId(parsed.data.companyId),
        title: parsed.data.title,
        description: parsed.data.description,
        contact: parsed.data.contact,
        location: parsed.data.location,
        salary: parsed.data.salary,
        url: parsed.data.url,
        status: parsed.data.status ?? 'waiting',
        dateApplied: parsed.data.dateApplied,
        createdAt: now,
    } as any;

    const res = await col.insertOne(doc);
    const saved = await col.findOne({ _id: res.insertedId } as any);
    if (!saved) return c.body(null, 500);
    return c.json(normalizeDoc(saved), 201);
});

// Get job
jobsRouter.get('/:id', async c => {
    const id = c.req.param('id') as string;
    const col = await getCollection('jobs');
    const authUser = c.get('user') as any;
    const filter: any = { _id: getObjectId(id) };
    if (authUser?.id) filter.userId = getObjectId(authUser.id);
    const doc = await col.findOne(filter as any);
    return doc ? c.json(normalizeDoc(doc)) : c.body(null, 404);
});

// Update job (partial)
jobsRouter.put('/:id', async c => {
    const id = c.req.param('id') as string;
    const body = await c.req.json();
    const parsed = updateJobSchema.safeParse(body);
    if (!parsed.success) return c.json({ errors: parsed.error.format() }, 400);

    const authUser = c.get('user') as any;
    if (!authUser?.id) return c.json({ error: 'Unauthorized' }, 401);

    const updates: any = {};
    if (parsed.data.companyId !== undefined) updates.companyId = getObjectId(parsed.data.companyId);
    if (parsed.data.title !== undefined) updates.title = parsed.data.title;
    if (parsed.data.description !== undefined) updates.description = parsed.data.description;
    if (parsed.data.contact !== undefined) updates.contact = parsed.data.contact;
    if (parsed.data.location !== undefined) updates.location = parsed.data.location;
    if (parsed.data.salary !== undefined) updates.salary = parsed.data.salary;
    if (parsed.data.url !== undefined) updates.url = parsed.data.url;
    if (parsed.data.status !== undefined) updates.status = parsed.data.status;
    if (parsed.data.dateApplied !== undefined) updates.dateApplied = parsed.data.dateApplied;
    if (body.updatedAt === undefined) updates.updatedAt = new Date().toISOString();

    const col = await getCollection('jobs');
    const res = await col.findOneAndUpdate(
        { _id: getObjectId(id), userId: getObjectId(authUser.id) } as any,
        { $set: updates },
        { returnDocument: 'after' } as any
    );
    const doc = res.value;
    return doc ? c.json(normalizeDoc(doc)) : c.body(null, 404);
});

// Delete job
jobsRouter.delete('/:id', async c => {
    const id = c.req.param('id') as string;
    const authUser = c.get('user') as any;
    if (!authUser?.id) return c.json({ error: 'Unauthorized' }, 401);

    const col = await getCollection('jobs');
    const res = await col.deleteOne({ _id: getObjectId(id), userId: getObjectId(authUser.id) } as any);
    return c.body(null, res.deletedCount ? 204 : 404);
});

// GET job with its notes
jobsRouter.get('/:id/with-notes', async c => {
    const id = c.req.param('id') as string;
    const jobsCol = await getCollection('jobs');
    const notesCol = await getCollection('notes');

    const jobDoc = await jobsCol.findOne({ _id: getObjectId(id) } as any);
    const authUser = c.get('user') as any;
    if (!jobDoc) return c.body(null, 404);
    if (authUser?.id && String(jobDoc.userId) !== authUser.id) return c.body(null, 404);

    const notesDocs = await notesCol.find({ jobId: getObjectId(id) }).toArray();
    const job = normalizeDoc(jobDoc as any);
    const notes = normalizeArray(notesDocs as any[]);
    return c.json({ ...job, notes });
});

export default jobsRouter;
