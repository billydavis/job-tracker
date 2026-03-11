import { describe, it, expect } from 'vitest';
import { normalizeDoc, normalizeArray } from '../utils/dto';
import { ObjectId } from 'mongodb';

describe('DTO normalizer', () => {
  it('converts _id and related ObjectIds to strings', () => {
    const doc = { _id: new ObjectId('000000000000000000000001'), userId: new ObjectId('000000000000000000000002'), createdAt: new Date('2020-01-01T00:00:00Z') } as any;
    const out = normalizeDoc(doc);
    expect(typeof out._id).toBe('string');
    expect(typeof out.userId).toBe('string');
    expect(out.createdAt).toBe('2020-01-01T00:00:00.000Z');
  });

  it('normalizes arrays of docs', () => {
    const docs = [{ _id: new ObjectId('000000000000000000000003') } as any];
    const out = normalizeArray(docs);
    expect(Array.isArray(out)).toBe(true);
    expect(typeof out[0]._id).toBe('string');
  });
});
