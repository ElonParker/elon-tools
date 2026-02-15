import { z } from 'zod';

export const PaginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
}).strict();

export const UuidParamSchema = z.object({
  id: z.string().uuid(),
}).strict();

export type PaginationQuery = z.infer<typeof PaginationQuerySchema>;
