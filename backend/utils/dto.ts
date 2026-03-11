import { ObjectId } from 'mongodb';

function tryToString(v: any) {
  if (v == null) return v;
  if (v instanceof ObjectId) return v.toString();
  if (typeof v === 'string') return v;
  return String(v);
}

function normalizeDate(v: any) {
  if (v == null) return v;
  if (v instanceof Date) return v.toISOString();
  // assume string-like ISO
  return String(v);
}

export function normalizeDoc(doc: any) {
  if (!doc || typeof doc !== 'object') return doc;
  const out: any = { ...doc };
  if (out._id) out._id = tryToString(out._id);
  if (out.userId) out.userId = tryToString(out.userId);
  if (out.companyId) out.companyId = tryToString(out.companyId);
  if (out.jobId) out.jobId = tryToString(out.jobId);
  if (out.createdAt) out.createdAt = normalizeDate(out.createdAt);
  if (out.updatedAt) out.updatedAt = normalizeDate(out.updatedAt);
  if (out.dateApplied) out.dateApplied = normalizeDate(out.dateApplied);
  return out;
}

export function normalizeArray(docs: any[]) {
  return docs.map(d => normalizeDoc(d));
}

export default { normalizeDoc, normalizeArray };
