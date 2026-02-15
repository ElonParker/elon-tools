export interface Project {
  id: string;
  customer_id: string;
  domain: string;
  name: string | null;
  niche: string | null;
  favicon_url: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}
