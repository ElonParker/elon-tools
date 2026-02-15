import { z } from 'zod';

export const CreateAgentSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  category_id: z.string().min(1),
  system_prompt: z.string().min(1).max(10000),
  templates: z.record(z.unknown()).default({}),
  params: z.record(z.unknown()).default({}),
  tools_allowed: z.array(z.string()).default([]),
  policy: z.record(z.unknown()).default({}),
  input_schema: z.record(z.unknown()).default({}),
}).strict();

export const UpdateAgentSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  category_id: z.string().min(1).optional(),
  system_prompt: z.string().min(1).max(10000).optional(),
  templates: z.record(z.unknown()).optional(),
  params: z.record(z.unknown()).optional(),
  tools_allowed: z.array(z.string()).optional(),
  policy: z.record(z.unknown()).optional(),
  input_schema: z.record(z.unknown()).optional(),
}).strict();

export type CreateAgentInput = z.infer<typeof CreateAgentSchema>;
export type UpdateAgentInput = z.infer<typeof UpdateAgentSchema>;
