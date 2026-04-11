import { z } from 'zod';

/** Accepts a valid URL or empty string (clear / no website). */
const websiteUrlOrEmpty = z.union([
  z.string().url('website must be a valid URL'),
  z.literal(''),
]);

export const createCompanySchema = z.object({
  name: z.string().min(1, 'name is required'),
  website: z.preprocess(
    (v) => (v === '' || v == null ? undefined : v),
    z.string().url('website must be a valid URL').optional(),
  ),
  description: z.string().optional(),
});

export const updateCompanySchema = z.object({
  name: z.string().min(1, 'name is required').optional(),
  website: websiteUrlOrEmpty.optional(),
  description: z.string().optional(),
});

export type CreateCompany = z.infer<typeof createCompanySchema>;
export type UpdateCompany = z.infer<typeof updateCompanySchema>;
