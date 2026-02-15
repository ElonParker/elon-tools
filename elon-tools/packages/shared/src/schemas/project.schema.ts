import { z } from 'zod';

const domainRegex = /^(?!:\/\/)([a-zA-Z0-9-]+\.)*[a-zA-Z0-9-]+\.[a-zA-Z]{2,}$/;

export const CreateProjectSchema = z.object({
  domain: z.string().min(3).max(253).regex(domainRegex, 'Domínio inválido'),
  name: z.string().max(200).optional(),
  niche: z.string().max(200).optional(),
}).strict();

export const UpdateProjectSchema = z.object({
  domain: z.string().min(3).max(253).regex(domainRegex, 'Domínio inválido').optional(),
  name: z.string().max(200).optional(),
  niche: z.string().max(200).optional(),
  metadata: z.record(z.unknown()).optional(),
}).strict();

export type CreateProjectInput = z.infer<typeof CreateProjectSchema>;
export type UpdateProjectInput = z.infer<typeof UpdateProjectSchema>;
