import { z } from 'zod';

export const ExecuteAgentSchema = z.object({
  project_id: z.string().uuid(),
  input: z.record(z.unknown()),
}).strict();

export const SearchAgentSchema = z.object({
  project_id: z.string().uuid(),
  query: z.string().min(1).max(2000),
  topK: z.number().int().min(1).max(20).default(5),
}).strict();

export type ExecuteAgentInput = z.infer<typeof ExecuteAgentSchema>;
export type SearchAgentInput = z.infer<typeof SearchAgentSchema>;
