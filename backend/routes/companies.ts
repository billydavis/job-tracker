import { Hono } from 'hono';
import { getCollection, getObjectId } from '../db';
import { createCompanySchema, updateCompanySchema } from '../validators/companies';
import { normalizeArray, normalizeDoc } from '../utils/dto';

const companiesRouter = new Hono();

// List companies. Optional query param: ?userId=...
companiesRouter.get('/', async c => {
  const queryUserId = c.req.query('userId');
  const authUser = c.get('user') as any;
  const col = await getCollection('companies');
  const filter: any = {};
  if (authUser?.id) {
    filter.userId = getObjectId(authUser.id);
  } else if (queryUserId) {
    filter.userId = getObjectId(queryUserId as string);
  }
  const docs = await col.find(filter).toArray();
  return c.json(normalizeArray(docs));
});

// Create company (expects body { name, userId, ... })
companiesRouter.post('/', async c => {
  const body = await c.req.json();
  const authUser = c.get('user') as any;
  if (!authUser?.id) return c.json({ error: 'Unauthorized' }, 401);
  const parsed = createCompanySchema.safeParse(body);
  if (!parsed.success) return c.json({ errors: parsed.error.format() }, 400);
  const col = await getCollection('companies');
  const escapedName = parsed.data.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const duplicate = await col.findOne({
    userId: getObjectId(authUser.id),
    name: { $regex: `^${escapedName}$`, $options: 'i' },
  } as any)
  if (duplicate) return c.json({ error: 'A company with that name already exists' }, 409)
  const now = new Date().toISOString();
  const doc = {
    userId: getObjectId(authUser.id),
    name: parsed.data.name,
    website: parsed.data.website,
    description: parsed.data.description,
    createdAt: now,
  } as any;
  const res = await col.insertOne(doc);
  const saved = await col.findOne({ _id: res.insertedId } as any);
  return c.json(saved ? normalizeDoc(saved) : { ...doc, _id: res.insertedId.toString(), userId: authUser.id }, 201);
});

// Get company by id
companiesRouter.get('/:id', async c => {
  const id = c.req.param('id') as string;
  const col = await getCollection('companies');
  const authUser = c.get('user') as any;
  const filter: any = { _id: getObjectId(id) };
  if (authUser?.id) filter.userId = getObjectId(authUser.id);
  const doc = await col.findOne(filter as any);
  return doc ? c.json(normalizeDoc(doc)) : c.body(null, 404);
});

// Update company (partial)
companiesRouter.put('/:id', async c => {
  const id = c.req.param('id') as string;
  const body = await c.req.json();
  const parsed = updateCompanySchema.safeParse(body);
  if (!parsed.success) return c.json({ errors: parsed.error.format() }, 400);
  const authUser = c.get('user') as any;
  if (!authUser?.id) return c.json({ error: 'Unauthorized' }, 401);

  const col = await getCollection('companies');
  const updates: any = {};
  if (parsed.data.name) updates.name = parsed.data.name;
  if (parsed.data.website !== undefined) updates.website = parsed.data.website;
  if (parsed.data.description !== undefined) updates.description = parsed.data.description;
  if (body.updatedAt === undefined) updates.updatedAt = new Date().toISOString();
  const res = await col.findOneAndUpdate(
    { _id: getObjectId(id), userId: getObjectId(authUser.id) } as any,
    { $set: updates },
    { returnDocument: 'after' } as any
  );
  const doc = res;
  return doc ? c.json(normalizeDoc(doc)) : c.body(null, 404);
});

// Delete company
companiesRouter.delete('/:id', async c => {
  const id = c.req.param('id') as string;
  const authUser = c.get('user') as any;
  if (!authUser?.id) return c.json({ error: 'Unauthorized' }, 401);
  const col = await getCollection('companies');
  const res = await col.deleteOne({ _id: getObjectId(id), userId: getObjectId(authUser.id) } as any);
  return c.body(null, res.deletedCount ? 204 : 404);
});

export default companiesRouter;
