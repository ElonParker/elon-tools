import type { CustomerRole } from './customer.js';

export interface Session {
  id: string;
  customer_id: string;
  token_hash: string;
  expires_at: string;
  created_at: string;
}

export interface SessionPayload {
  customer_id: string;
  role: CustomerRole;
  expires_at: string;
}

export interface MagicLink {
  id: string;
  email: string;
  token_hash: string;
  used: boolean;
  expires_at: string;
  created_at: string;
}
