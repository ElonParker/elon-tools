import { z } from 'zod';

export const UpdateSettingsSchema = z.record(z.unknown()).refine(
  (obj) => Object.keys(obj).length > 0,
  { message: 'Pelo menos uma configuração deve ser fornecida' },
);

export const SaveIntegrationSchema = z.object({
  provider: z.string().min(1).max(50),
  credentials: z.record(z.string()),
}).strict();

export const ValidateIntegrationSchema = z.object({
  provider: z.string().min(1).max(50),
  credentials: z.record(z.string()),
}).strict();

export const CreateAgentConfigSchema = z.object({
  system_prompt: z.string().min(1).max(10000).optional(),
  templates: z.record(z.unknown()).optional(),
  params: z.record(z.unknown()).optional(),
  tools_allowed: z.array(z.string()).optional(),
  policy: z.record(z.unknown()).optional(),
  input_schema: z.record(z.unknown()).optional(),
}).strict();

export const UpdateAgentMetaSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  category_id: z.string().min(1).optional(),
  is_active: z.boolean().optional(),
}).strict();

export type UpdateSettingsInput = z.infer<typeof UpdateSettingsSchema>;
export type SaveIntegrationInput = z.infer<typeof SaveIntegrationSchema>;
export type ValidateIntegrationInput = z.infer<typeof ValidateIntegrationSchema>;
export type CreateAgentConfigInput = z.infer<typeof CreateAgentConfigSchema>;
export type UpdateAgentMetaInput = z.infer<typeof UpdateAgentMetaSchema>;
