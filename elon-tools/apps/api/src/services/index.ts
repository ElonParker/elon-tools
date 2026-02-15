// Services — implemented progressively in Etapas 5-8
// Each service encapsulates one domain's data logic.
//
// Planned:
// - auth.service.ts       → Etapa 5 (magic link, session, turnstile)
// - project.service.ts    → Etapa 6 (CRUD + metadata fetch)
// - agent.service.ts      → Etapa 6 (CRUD + config versioning)
// - execution.service.ts  → Etapa 7 (execute agent, save history)
// - ai.service.ts         → Etapa 7 (Workers AI: LLM + embeddings)
// - vectorize.service.ts  → Etapa 8 (upsert, query)
// - cache.service.ts      → Etapa 5 (KV get/set/delete)
// - crypto.service.ts     → Etapa 5 (AES-GCM encrypt/decrypt)
// - email.service.ts      → Etapa 9 (pluggable email)
// - turnstile.service.ts  → Etapa 5 (Turnstile verify)
