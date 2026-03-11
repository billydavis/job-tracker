import { z } from 'zod';

export const jobCreateSchema = z.object({
  companyId: z.string().min(1, 'companyId is required'),
  title: z.string().min(1, 'title is required'),
  description: z.string().optional(),
  contact: z.string().optional(),
  location: z.enum(['on-site', 'remote', 'hybrid']).optional(),
  salary: z.number().optional(),
  url: z.string().url().optional(),
  status: z.enum(['waiting', 'applied', 'interview', 'offer', 'negotiation', 'rejected', 'ghosted']).optional(),
  dateApplied: z.string().optional(),
});

export type JobCreateInput = z.infer<typeof jobCreateSchema>;

// Backwards-compatible export name expected by routes
export const createJobSchema = jobCreateSchema;

export const updateJobSchema = jobCreateSchema.partial();

export type JobUpdateInput = z.infer<typeof updateJobSchema>;
