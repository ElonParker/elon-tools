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
export { AgentService } from './agent.service.js';
export { IntegrationService, SUPPORTED_PROVIDERS } from './integration.service.js';
export { SettingsService } from './settings.service.js';

// Planned (next etapas):
// - execution.service.ts  → Etapa 8
// - ai.service.ts         → Etapa 8
// - vectorize.service.ts  → Etapa 9
