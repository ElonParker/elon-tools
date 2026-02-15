export { AuthService } from './auth.service.js';
export { CacheService } from './cache.service.js';
export { sha256, generateToken, encrypt, decrypt } from './crypto.service.js';
export { verifyTurnstile } from './turnstile.service.js';
export {
  MailChannelsProvider,
  HttpEmailProvider,
  buildMagicLinkEmail,
  type EmailProvider,
} from './email.service.js';
export { ProjectService } from './project.service.js';
export { collectDomainMetadata, validateDomain, type DomainMetadata } from './domain-collector.service.js';

// Planned (next etapas):
// - agent.service.ts      → Etapa 7
// - execution.service.ts  → Etapa 7
// - ai.service.ts         → Etapa 7
// - vectorize.service.ts  → Etapa 8
