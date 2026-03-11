import { z } from 'zod';

export const createNoteSchema = z.object({
  jobId: z.string().min(1, 'jobId is required'),
  content: z.string().min(1, 'content is required'),
});

export const updateNoteSchema = z.object({
  content: z.string().min(1, 'content is required'),
});

export type CreateNote = z.infer<typeof createNoteSchema>;
export type UpdateNote = z.infer<typeof updateNoteSchema>;
