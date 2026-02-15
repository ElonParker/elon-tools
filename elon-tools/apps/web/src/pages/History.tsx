import { useEffect } from 'preact/hooks';
import { signal } from '@preact/signals';
import { api } from '../api/client';
import { ProjectContext } from '../components/ProjectContext';
import { Loading } from '../components/Loading';
import { activeProject } from '../stores/project.store';
import type { AgentExecution } from '@elon-tools/shared';

const executions = signal<AgentExecution[]>([]);
const loading = signal(true);
const page = signal(1);
const total = signal(0);
const selected = signal<AgentExecution | null>(null);

export function HistoryPage() {
  const project = activeProject.value;

  useEffect(() => {
    if (!project) return;
    loading.value = true;
    api.get<{ executions: AgentExecution[]; pagination: { total: number } }>(
      `/projects/${project.id}/executions?page=${page.value}&limit=20`,
    )
      .then((d) => { executions.value = d.executions; total.value = d.pagination?.total ?? 0; })
      .finally(() => { loading.value = false; });
  }, [project?.id, page.value]);

  if (!project) return <div class="error-banner">Selecione um projeto</div>;
  if (loading.value) return <Loading />;

  const statusBadge = (s: string) => {
    const map: Record<string, string> = { done: 'badge-success', error: 'badge-error', running: 'badge-warning', pending: 'badge-info' };
    return <span class={`badge ${map[s] ?? 'badge-info'}`}>{s}</span>;
  };

  return (
    <div>
      <ProjectContext />
      <div class="page-header">
        <h1>📜 Histórico</h1>
        <p>{total.value} execução(ões)</p>
      </div>

      {executions.value.length === 0 ? (
        <div class="empty-state">
          <div class="icon">📜</div>
          <h3>Nenhuma execução ainda</h3>
          <p>Execute um agente para ver o histórico aqui.</p>
        </div>
      ) : (
        <>
          <table class="table">
            <thead>
              <tr>
                <th>Agente</th>
                <th>Status</th>
                <th>Tokens</th>
                <th>Duração</th>
                <th>Data</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {executions.value.map((exec) => (
                <tr key={exec.id}>
                  <td>{(exec as any).agent_name ?? exec.agent_id.slice(0, 8)}</td>
                  <td>{statusBadge(exec.status)}</td>
                  <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                    {exec.tokens_input + exec.tokens_output > 0 ? `${exec.tokens_input}/${exec.tokens_output}` : '—'}
                  </td>
                  <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                    {exec.duration_ms > 0 ? `${(exec.duration_ms / 1000).toFixed(1)}s` : '—'}
                  </td>
                  <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                    {new Date(exec.created_at).toLocaleString('pt-BR')}
                  </td>
                  <td>
                    <button class="btn btn-sm btn-secondary" onClick={() => (selected.value = exec)}>Ver</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {total.value > 20 && (
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 16 }}>
              <button class="btn btn-sm btn-secondary" disabled={page.value <= 1} onClick={() => (page.value--)}>← Anterior</button>
              <span style={{ padding: '6px 12px', fontSize: 13, color: 'var(--text-muted)' }}>
                Página {page.value} de {Math.ceil(total.value / 20)}
              </span>
              <button class="btn btn-sm btn-secondary" disabled={page.value * 20 >= total.value} onClick={() => (page.value++)}>Próxima →</button>
            </div>
          )}
        </>
      )}

      {selected.value && (
        <div class="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) selected.value = null; }}>
          <div class="modal" style={{ maxWidth: 640 }}>
            <h2>Execução — {(selected.value as any).agent_name ?? 'Agente'}</h2>
            <div style={{ marginBottom: 12 }}>
              {statusBadge(selected.value.status)}
              <span style={{ marginLeft: 8, fontSize: 13, color: 'var(--text-muted)' }}>
                {new Date(selected.value.created_at).toLocaleString('pt-BR')}
              </span>
            </div>
            <div class="form-group">
              <label class="label">Input</label>
              <pre style={{ background: 'var(--bg-input)', padding: 12, borderRadius: 6, fontSize: 13, overflow: 'auto' }}>
                {JSON.stringify(selected.value.input, null, 2)}
              </pre>
            </div>
            <div class="form-group">
              <label class="label">Output</label>
              <div class="stream-output" style={{ maxHeight: 400, overflow: 'auto' }}>
                {selected.value.output ?? selected.value.error_message ?? 'Sem output'}
              </div>
            </div>
            <button class="btn btn-secondary" onClick={() => (selected.value = null)}>Fechar</button>
          </div>
        </div>
      )}
    </div>
  );
}
