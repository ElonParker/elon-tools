import { z } from 'zod';

export const MagicLinkRequestSchema = z.object({
  email: z.string().email().max(254),
  turnstileToken: z.string().min(1),
}).strict();

export const VerifyTokenQuerySchema = z.object({
  token: z.string().min(1),
}).strict();

export type MagicLinkRequest = z.infer<typeof MagicLinkRequestSchema>;
export type VerifyTokenQuery = z.infer<typeof VerifyTokenQuerySchema>;
