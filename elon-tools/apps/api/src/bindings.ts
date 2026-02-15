/** Cloudflare Worker environment bindings */
export interface Env {
  // D1
  DB: D1Database;

  // KV
  KV: KVNamespace;

  // Vectorize (optional — requires Vectorize permission)
  VECTORIZE?: VectorizeIndex;

  // Workers AI
  AI: Ai;

  // Env vars (non-secret)
  ENVIRONMENT: string;
  FRONTEND_URL: string;

  // Secrets
  TURNSTILE_SECRET_KEY: string;
  MASTER_ENCRYPTION_KEY: string;
  EMAIL_API_KEY: string;
}

/** Auth context injected by middleware */
export interface AuthContext {
  customerId: string;
  role: 'CUSTOMER' | 'ADMIN';
}
