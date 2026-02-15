export interface Agent {
  id: string;
  name: string;
  description: string | null;
  category_id: string;
  current_config_version: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AgentConfig {
  id: string;
  agent_id: string;
  config_version: number;
  system_prompt: string;
  templates: Record<string, unknown>;
  params: Record<string, unknown>;
  tools_allowed: string[];
  policy: Record<string, unknown>;
  input_schema: Record<string, unknown>;
  created_by: string | null;
  created_at: string;
}

export type ExecutionStatus = 'pending' | 'running' | 'done' | 'error';

export interface AgentExecution {
  id: string;
  agent_id: string;
  agent_config_version: number;
  customer_id: string;
  project_id: string;
  input: Record<string, unknown>;
  output: string | null;
  status: ExecutionStatus;
  error_message: string | null;
  tokens_input: number;
  tokens_output: number;
  duration_ms: number;
  has_embedding: boolean;
  created_at: string;
  updated_at: string;
}
