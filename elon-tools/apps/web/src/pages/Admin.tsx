import { useEffect } from 'preact/hooks';
import { signal } from '@preact/signals';
import { api, ApiError } from '../api/client';
import { Loading } from '../components/Loading';
import { CATEGORIES } from '@elon-tools/shared';

type Tab = 'agents' | 'settings' | 'integrations' | 'customers' | 'stats';
const tab = signal<Tab>('agents');
const agents = signal<any[]>([]);
const settings = signal<Record<string, any>>({});
const integrations = signal<any[]>([]);
const customers = signal<any[]>([]);
const stats = signal<any>(null);
const loading = signal(false);
const error = signal('');

// Agent creation
const showCreate = signal(false);
const newAgent = signal({ name: '', description: '', category_id: '', system_prompt: '' });
const creating = signal(false);

async function loadTab(t: Tab) {
  loading.value = true; error.value = '';
  try {
    if (t === 'agents') agents.value = (await api.get<any>('/admin/agents?limit=100')).agents;
    else if (t === 'settings') settings.value = (await api.get<any>('/admin/settings')).settings;
    else if (t === 'integrations') integrations.value = (await api.get<any>('/admin/integrations')).integrations;
    else if (t === 'customers') customers.value = (await api.get<any>('/admin/customers?limit=100')).customers;
    else if (t === 'stats') stats.value = await api.get('/admin/stats');
  } catch (e) { error.value = (e as Error).message; }
  finally { loading.value = false; }
}

async function createAgent(e: Event) {
  e.preventDefault(); creating.value = true; error.value = '';
  try {
    await api.post('/admin/agents', { ...newAgent.value, templates: {}, params: { temperature: 0.7, max_tokens: 2048 }, input_schema: { type: 'object', properties: { prompt: { type: 'string', title: 'Prompt' } } } });
    showCreate.value = false;
    newAgent.value = { name: '', description: '', category_id: '', system_prompt: '' };
    await loadTab('agents');
  } catch (e) { error.value = (e as Error).message; }
  finally { creating.value = false; }
}

export function AdminPage() {
  useEffect(() => { loadTab(tab.value); }, [tab.value]);

  const tabs: { key: Tab; label: string }[] = [
    { key: 'stats', label: '📊 Stats' },
    { key: 'agents', label: '🤖 Agentes' },
    { key: 'settings', label: '⚙️ Settings' },
    { key: 'integrations', label: '🔗 Integrações' },
    { key: 'customers', label: '👥 Customers' },
  ];

  return (
    <div>
      <div class="page-header"><h1>⚙️ Painel Admin</h1></div>
      
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {tabs.map((t) => (
          <button key={t.key} class={`btn btn-sm ${tab.value === t.key ? 'btn-primary' : 'btn-secondary'}`} onClick={() => (tab.value = t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      {error.value && <div class="error-banner">{error.value}</div>}
      {loading.value && <Loading />}

      {!loading.value && tab.value === 'stats' && stats.value && (
        <div class="card-grid">
          {Object.entries(stats.value).map(([k, v]) => (
            <div class="card" key={k}>
              <div style={{ fontSize: 28, fontWeight: 800 }}>{String(v)}</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{k.replace(/_/g, ' ')}</div>
            </div>
          ))}
        </div>
      )}

      {!loading.value && tab.value === 'agents' && (
        <div>
          <button class="btn btn-primary" style={{ marginBottom: 16 }} onClick={() => (showCreate.value = true)}>
            + Criar Agente
          </button>
          <table class="table">
            <thead><tr><th>Nome</th><th>Categoria</th><th>Versão</th><th>Ativo</th></tr></thead>
            <tbody>
              {agents.value.map((a: any) => (
                <tr key={a.id}>
                  <td><strong>{a.name}</strong><br/><span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{a.description?.slice(0, 60)}</span></td>
                  <td>{CATEGORIES.find((c) => c.id === a.category_id)?.icon ?? ''} {CATEGORIES.find((c) => c.id === a.category_id)?.name ?? a.category_id}</td>
                  <td>v{a.current_config_version}</td>
                  <td>{a.is_active ? <span class="badge badge-success">Ativo</span> : <span class="badge badge-error">Inativo</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading.value && tab.value === 'settings' && (
        <div>
          {Object.entries(settings.value).map(([key, setting]: [string, any]) => (
            <div class="card" key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <strong>{key}</strong>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{setting.description}</div>
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}>{JSON.stringify(setting.value)}</div>
            </div>
          ))}
        </div>
      )}

      {!loading.value && tab.value === 'integrations' && (
        <div>
          {integrations.value.length === 0 ? (
            <div class="empty-state"><h3>Nenhuma integração configurada</h3></div>
          ) : (
            <table class="table">
              <thead><tr><th>Provider</th><th>Key</th><th>Data</th></tr></thead>
              <tbody>
                {integrations.value.map((i: any) => (
                  <tr key={i.id}><td>{i.provider}</td><td>{i.key_name}</td><td>{new Date(i.created_at).toLocaleDateString('pt-BR')}</td></tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {!loading.value && tab.value === 'customers' && (
        <table class="table">
          <thead><tr><th>Email</th><th>Role</th><th>Status</th><th>Data</th></tr></thead>
          <tbody>
            {customers.value.map((c: any) => (
              <tr key={c.id}>
                <td>{c.email}</td>
                <td><span class={`badge ${c.role === 'ADMIN' ? 'badge-warning' : 'badge-info'}`}>{c.role}</span></td>
                <td><span class={`badge ${c.status === 'active' ? 'badge-success' : 'badge-error'}`}>{c.status}</span></td>
                <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>{new Date(c.created_at).toLocaleDateString('pt-BR')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {showCreate.value && (
        <div class="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) showCreate.value = false; }}>
          <div class="modal">
            <h2>Criar Agente</h2>
            <form onSubmit={createAgent}>
              <div class="form-group">
                <label class="label">Nome *</label>
                <input class="input" value={newAgent.value.name} required
                  onInput={(e) => { newAgent.value = { ...newAgent.value, name: (e.target as HTMLInputElement).value }; }} />
              </div>
              <div class="form-group">
                <label class="label">Descrição</label>
                <textarea class="textarea" value={newAgent.value.description}
                  onInput={(e) => { newAgent.value = { ...newAgent.value, description: (e.target as HTMLTextAreaElement).value }; }} />
              </div>
              <div class="form-group">
                <label class="label">Categoria *</label>
                <select class="select" value={newAgent.value.category_id} required
                  onChange={(e) => { newAgent.value = { ...newAgent.value, category_id: (e.target as HTMLSelectElement).value }; }}>
                  <option value="">Selecione...</option>
                  {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
                </select>
              </div>
              <div class="form-group">
                <label class="label">System Prompt *</label>
                <textarea class="textarea" style={{ minHeight: 150 }} value={newAgent.value.system_prompt} required
                  onInput={(e) => { newAgent.value = { ...newAgent.value, system_prompt: (e.target as HTMLTextAreaElement).value }; }} />
              </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button class="btn btn-secondary" type="button" onClick={() => (showCreate.value = false)}>Cancelar</button>
                <button class="btn btn-primary" type="submit" disabled={creating.value}>{creating.value ? 'Criando...' : 'Criar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
