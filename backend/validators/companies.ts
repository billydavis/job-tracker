import { z } from 'zod';

export const createCompanySchema = z.object({
  name: z.string().min(1, 'name is required'),
  website: z.string().url('website must be a valid URL').optional(),
  description: z.string().optional(),
});

export const updateCompanySchema = createCompanySchema.partial();

export type CreateCompany = z.infer<typeof createCompanySchema>;
export type UpdateCompany = z.infer<typeof updateCompanySchema>;
