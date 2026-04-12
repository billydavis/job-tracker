import { Hono } from 'hono';
import { ObjectId } from 'mongodb';
import { getCollection, getObjectId } from '../db';
import { createJobSchema, updateJobSchema } from '../validators/jobs';
import { normalizeArray, normalizeDoc } from '../utils/dto';

function normalizeSalaryRange(r: { lowEnd?: number; highEnd?: number; period: 'yearly' | 'hourly' }) {
    const out: Record<string, unknown> = { period: r.period ?? 'yearly' };
    if (r.lowEnd !== undefined) out.lowEnd = r.lowEnd;
    if (r.highEnd !== undefined) out.highEnd = r.highEnd;
    return out;
}

const jobsRouter = new Hono();

// Job stats (status/location distribution + weekly applied counts)
jobsRouter.get('/stats', async c => {
    const authUser = c.get('user') as any;
    if (!authUser?.id) return c.json({ error: 'Unauthorized' }, 401);

    const col = await getCollection('jobs');
    const userId = getObjectId(authUser.id);

    const rawOffset = parseInt(c.req.query('weekOffset') ?? '0', 10);
    const offset = isNaN(rawOffset) ? 0 : rawOffset;

    const now = new Date();
    const dayOfWeek = now.getUTCDay(); // 0=Sun
    const weekStart = new Date(now);
    weekStart.setUTCDate(now.getUTCDate() - dayOfWeek + offset * 7);
    weekStart.setUTCHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setUTCDate(weekStart.getUTCDate() + 6);
    weekEnd.setUTCHours(23, 59, 59, 999);

    const prevWeekStart = new Date(weekStart);
    prevWeekStart.setUTCDate(weekStart.getUTCDate() - 7);
    const prevWeekEnd = new Date(weekEnd);
    prevWeekEnd.setUTCDate(weekEnd.getUTCDate() - 7);

    const weekStartStr = weekStart.toISOString().slice(0, 10);
    const weekEndStr = weekEnd.toISOString().slice(0, 10);
    const prevWeekStartStr = prevWeekStart.toISOString().slice(0, 10);
    const prevWeekEndStr = prevWeekEnd.toISOString().slice(0, 10);

    const [statusAgg, locationAgg, weekCount, prevWeekCount, recentAgg] = await Promise.all([
        col.aggregate([
            { $match: { userId } },
            { $group: { _id: '$status', count: { $sum: 1 } } },
        ]).toArray(),
        col.aggregate([
            { $match: { userId, location: { $exists: true, $ne: null } } },
            { $group: { _id: '$location', count: { $sum: 1 } } },
        ]).toArray(),
        col.countDocuments({ userId, dateApplied: { $gte: weekStartStr, $lte: weekEndStr } } as any),
        col.countDocuments({ userId, dateApplied: { $gte: prevWeekStartStr, $lte: prevWeekEndStr } } as any),
        col.aggregate([
            { $match: { userId } },
            { $sort: { dateApplied: -1, createdAt: -1 } },
            { $limit: 5 },
            { $lookup: { from: 'companies', localField: 'companyId', foreignField: '_id', as: 'company' } },
            { $unwind: { path: '$company', preserveNullAndEmptyArrays: true } },
            { $project: { _id: 1, title: 1, dateApplied: 1, status: 1, companyName: { $ifNull: ['$company.name', null] } } },
        ]).toArray(),
    ]);

    console.log('[stats] recentAgg count:', recentAgg.length, JSON.stringify(recentAgg, null, 2));

    return c.json({
        statusCounts: statusAgg.map(d => ({ status: d._id as string, count: d.count as number })),
        locationCounts: locationAgg.map(d => ({ location: d._id as string, count: d.count as number })),
        weeklyApplied: {
            weekOffset: offset,
            weekStart: weekStartStr,
            weekEnd: weekEndStr,
            count: weekCount,
            previousCount: prevWeekCount,
            previousWeekStart: prevWeekStartStr,
            previousWeekEnd: prevWeekEndStr,
        },
        recentApplications: recentAgg.map(d => ({
            jobId: String(d._id),
            title: d.title as string,
            companyName: d.companyName as string | null,
            dateApplied: d.dateApplied as string,
            status: d.status as string,
        })),
    });
});

// List jobs (paginated)
jobsRouter.get('/', async c => {
    const authUser = c.get('user') as any;
    const col = await getCollection('jobs');

    const page  = Math.max(1, parseInt(c.req.query('page')  ?? '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(c.req.query('limit') ?? '10', 10)));
    const search = (c.req.query('search') ?? '').trim();
    const status = c.req.query('status') ?? '';
    const companyId = (c.req.query('companyId') ?? '').trim();

    const filter: any = {};
    if (authUser?.id) filter.userId = getObjectId(authUser.id);

    if (status) filter.status = status;
    if (search) filter.title = { $regex: search, $options: 'i' };
    if (companyId) {
        if (!ObjectId.isValid(companyId)) return c.json({ error: 'Invalid companyId' }, 400);
        filter.companyId = getObjectId(companyId);
    }

    const [total, docs] = await Promise.all([
        col.countDocuments(filter),
        col.find(filter)
            .sort({ dateApplied: -1, createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .toArray(),
    ]);

    return c.json({
        data: normalizeArray(docs),
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
    });
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
        url: parsed.data.url,
        status: parsed.data.status ?? 'waiting',
        dateApplied: parsed.data.dateApplied,
        createdAt: now,
        ...(parsed.data.salaryRange
            ? { salaryRange: normalizeSalaryRange(parsed.data.salaryRange) }
            : {}),
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

    const set: Record<string, unknown> = {};
    const unset: Record<string, string> = {};
    if (parsed.data.companyId !== undefined) set.companyId = getObjectId(parsed.data.companyId);
    if (parsed.data.title !== undefined) set.title = parsed.data.title;
    if (parsed.data.description !== undefined) set.description = parsed.data.description;
    if (parsed.data.contact !== undefined) set.contact = parsed.data.contact;
    if (parsed.data.location !== undefined) set.location = parsed.data.location;
    if (parsed.data.url !== undefined) set.url = parsed.data.url;
    if (parsed.data.status !== undefined) set.status = parsed.data.status;
    if (parsed.data.dateApplied !== undefined) set.dateApplied = parsed.data.dateApplied;
    if (parsed.data.salaryRange !== undefined) {
        if (parsed.data.salaryRange === null) {
            unset.salary = '';
            unset.salaryRange = '';
        } else {
            set.salaryRange = normalizeSalaryRange(parsed.data.salaryRange);
            unset.salary = '';
        }
    }
    if (body.updatedAt === undefined) set.updatedAt = new Date().toISOString();

    const updateOp: Record<string, unknown> = {};
    if (Object.keys(set).length) updateOp.$set = set;
    if (Object.keys(unset).length) updateOp.$unset = unset;

    const col = await getCollection('jobs');
    const res = await col.findOneAndUpdate(
        { _id: getObjectId(id), userId: getObjectId(authUser.id) } as any,
        updateOp,
        { returnDocument: 'after' } as any
    );
    const doc = res;
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
