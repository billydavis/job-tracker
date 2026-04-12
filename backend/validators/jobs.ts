import { z } from 'zod';

/** Accept numbers or numeric strings (with commas / currency symbols stripped). */
const salaryMoneyField = z.preprocess((val) => {
  if (val == null || val === '') return undefined;
  if (typeof val === 'number') return Number.isFinite(val) ? val : val;
  if (typeof val === 'string') {
    const t = val.trim().replace(/[$€£\s,\u00A0]/g, '');
    if (t === '') return undefined;
    const n = Number(t);
    return Number.isFinite(n) ? n : val;
  }
  return val;
}, z.number().finite().nonnegative().optional());

const salaryRangeObjectSchema = z
  .object({
    lowEnd: salaryMoneyField,
    highEnd: salaryMoneyField,
    period: z.enum(['yearly', 'hourly']).default('yearly'),
  })
  .superRefine((val, ctx) => {
    if (val.lowEnd == null && val.highEnd == null) {
      ctx.addIssue({
        code: 'custom',
        message: 'At least one of lowEnd or highEnd is required',
        path: ['lowEnd'],
      });
    }
    if (val.lowEnd != null && val.highEnd != null && val.lowEnd > val.highEnd) {
      ctx.addIssue({
        code: 'custom',
        message: 'lowEnd must be less than or equal to highEnd',
        path: ['highEnd'],
      });
    }
  });

export const jobCreateSchema = z.object({
  companyId: z.string().min(1, 'companyId is required'),
  title: z.string().min(1, 'title is required'),
  description: z.string().optional(),
  contact: z.string().optional(),
  location: z.enum(['on-site', 'remote', 'hybrid']).optional(),
  salaryRange: salaryRangeObjectSchema.optional(),
  url: z.string().url().optional(),
  status: z
    .enum(['waiting', 'applied', 'interview', 'offer', 'negotiation', 'rejected', 'ghosted'])
    .optional(),
  dateApplied: z.string().optional(),
});

export type JobCreateInput = z.infer<typeof jobCreateSchema>;

// Backwards-compatible export name expected by routes
export const createJobSchema = jobCreateSchema;

export const updateJobSchema = jobCreateSchema.partial().extend({
  salaryRange: z.union([salaryRangeObjectSchema, z.null()]).optional(),
});

export type JobUpdateInput = z.infer<typeof updateJobSchema>;
