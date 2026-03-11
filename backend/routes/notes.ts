import { Hono } from 'hono';
import { getCollection, getObjectId } from '../db';
import { createNoteSchema, updateNoteSchema } from '../validators/notes';
import { normalizeArray, normalizeDoc } from '../utils/dto';

const notesRouter = new Hono();

// List notes. Optional query param: ?jobId=...
notesRouter.get('/', async c => {
  const jobId = c.req.query('jobId');
  const authUser = c.get('user') as any;
  const notesCol = await getCollection('notes');
  const jobsCol = await getCollection('jobs');
  const filter: any = {};

  if (jobId) {
    // If jobId specified, ensure the job belongs to auth user when present
    if (authUser?.id) {
      const job = await jobsCol.findOne({ _id: getObjectId(jobId as string), userId: getObjectId(authUser.id) } as any);
      if (!job) return c.json({ error: 'Not found' }, 404);
    }
    filter.jobId = getObjectId(jobId as string);
  } else if (authUser?.id) {
    // No jobId provided: list notes for all jobs owned by auth user
    const jobs = await jobsCol.find({ userId: getObjectId(authUser.id) }).project({ _id: 1 }).toArray();
    const jobIds = jobs.map((j: any) => j._id);
    filter.jobId = { $in: jobIds };
  }

  const docs = await notesCol.find(filter).toArray();
  return c.json(normalizeArray(docs));
});

// Create a note
notesRouter.post('/', async c => {
  const body = await c.req.json();
  const parsed = createNoteSchema.safeParse(body);
  if (!parsed.success) return c.json({ errors: parsed.error.format() }, 400);

  const authUser = c.get('user') as any;
  if (!authUser?.id) return c.json({ error: 'Unauthorized' }, 401);

  const jobsCol = await getCollection('jobs');
  const job = await jobsCol.findOne({ _id: getObjectId(parsed.data.jobId), userId: getObjectId(authUser.id) } as any);
  if (!job) return c.json({ error: 'Job not found or not owned by user' }, 404);

  const col = await getCollection('notes');
  const now = new Date().toISOString();
  const doc = { jobId: getObjectId(parsed.data.jobId), content: parsed.data.content, createdAt: now } as any;
  const res = await col.insertOne(doc);
  const saved = await col.findOne({ _id: res.insertedId } as any);
  return c.json(saved ? normalizeDoc(saved) : { ...doc, _id: res.insertedId.toString(), jobId: parsed.data.jobId }, 201);
});

// Get a note by id
notesRouter.get('/:id', async c => {
  const id = c.req.param('id') as string;
  const col = await getCollection('notes');
  const doc = await col.findOne({ _id: getObjectId(id) } as any);
  return doc ? c.json(normalizeDoc(doc)) : c.body(null, 404);
});

// Update a note
notesRouter.put('/:id', async c => {
  const id = c.req.param('id') as string;
  const body = await c.req.json();
  const parsed = updateNoteSchema.safeParse(body);
  if (!parsed.success) return c.json({ errors: parsed.error.format() }, 400);
  const col = await getCollection('notes');
  const res = await col.findOneAndUpdate(
    { _id: getObjectId(id) } as any,
    { $set: { content: parsed.data.content, updatedAt: new Date().toISOString() } },
    { returnDocument: 'after' } as any
  );
  const doc = res.value;
  return doc ? c.json(normalizeDoc(doc)) : c.body(null, 404);
});

// Delete a note
notesRouter.delete('/:id', async c => {
  const id = c.req.param('id') as string;
  const col = await getCollection('notes');
  const res = await col.deleteOne({ _id: getObjectId(id) } as any);
  return c.body(null, res.deletedCount ? 204 : 404);
});

export default notesRouter;
