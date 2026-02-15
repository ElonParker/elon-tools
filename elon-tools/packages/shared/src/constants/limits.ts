export const Limits = {
  // Rate limiting (per minute)
  RATE_LIMIT_GENERAL:         60,    // req/min per IP
  RATE_LIMIT_MAGIC_LINK:      5,     // req/min per IP
  RATE_LIMIT_EXECUTE:         20,    // req/min per customer

  // Sessions
  SESSION_TTL_SECONDS:        86400,  // 24h
  MAGIC_LINK_TTL_SECONDS:     900,    // 15min

  // Vectorize
  VECTORIZE_TOP_K_DEFAULT:    5,
  VECTORIZE_TOP_K_MAX:        20,
  VECTORIZE_MIN_SCORE:        0.7,
  VECTORIZE_MAX_PER_PROJECT:  500,
  VECTORIZE_MAX_PER_CUSTOMER: 5000,
  VECTORIZE_MAX_CHUNKS:       5,
  VECTORIZE_CHUNK_MAX_TOKENS: 2000,
  VECTORIZE_CHUNK_OVERLAP:    200,
  VECTORIZE_MIN_OUTPUT_CHARS: 100,

  // Input limits
  MAX_EMAIL_LENGTH:           254,
  MAX_DOMAIN_LENGTH:          253,
  MAX_INPUT_TEXT_LENGTH:       10000,
  MAX_NAME_LENGTH:            200,
  MAX_DESCRIPTION_LENGTH:     2000,
  MAX_SYSTEM_PROMPT_LENGTH:   10000,

  // Pagination
  DEFAULT_PAGE_SIZE:          20,
  MAX_PAGE_SIZE:              100,

  // KV TTL (seconds)
  KV_TTL_SESSION:             86400,  // 24h
  KV_TTL_CATEGORIES:          604800, // 7 days
  KV_TTL_AGENTS_LIST:         3600,   // 1h
  KV_TTL_AGENT_CONFIG:        3600,   // 1h
  KV_TTL_PROJECT_META:        21600,  // 6h
  KV_TTL_RATE_LIMIT:          60,     // 1 min
  KV_TTL_ADMIN_STATS:         300,    // 5 min
} as const;
