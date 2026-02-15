import { useEffect } from 'preact/hooks';
import { signal } from '@preact/signals';
import { api, streamApi } from '../api/client';
import { ProjectContext } from '../components/ProjectContext';
import { StreamingOutput } from '../components/StreamingOutput';
import { Loading } from '../components/Loading';
import { activeProject } from '../stores/project.store';
import type { Agent, AgentConfig } from '@elon-tools/shared';

const agent = signal<(Agent & { config: AgentConfig }) | null>(null);
const loading = signal(true);
const executing = signal(false);
const streamText = signal('');
const lastExecId = signal<string | null>(null);
const error = signal('');
const inputValues = signal<Record<string, string>>({});

export function AgentViewPage({ id }: { id: string }) {
  useEffect(() => {
    loading.value = true;
    error.value = '';
    streamText.value = '';
    api.get<{ agent: Agent & { config: AgentConfig } }>(`/agents/${id}`)
      .then((d) => { agent.value = d.agent; })
      .catch((e) => { error.value = e.message; })
      .finally(() => { loading.value = false; });
  }, [id]);

  if (loading.value) return <Loading />;
  if (!agent.value) return <div class="error-banner">{error.value || 'Agente não encontrado'}</div>;

  const project = activeProject.value;
  if (!project) return <div class="error-banner">Selecione um projeto primeiro</div>;

  const config = agent.value.config;
  const schema = config.input_schema as Record<string, any>;
  const fields = schema?.properties ? Object.entries(schema.properties) : [['prompt', { type: 'string', title: 'Prompt' }]];

  async function handleExecute(e: Event) {
    e.preventDefault();
    executing.value = true;
    streamText.value = '';
    error.value = '';
    lastExecId.value = null;

    const input: Record<string, unknown> = {};
    for (const [key] of fields) {
      input[key] = inputValues.value[key] ?? '';
    }

    try {
      await streamApi(
        `/agents/${id}/stream`,
        { project_id: project!.id, input },
        (chunk) => { streamText.value += chunk; },
        (execId) => { lastExecId.value = execId; },
      );
    } catch (err) {
      error.value = (err as Error).message;
    } finally {
      executing.value = false;
    }
  }

  function exportAs(format: 'md' | 'json' | 'csv') {
    const text = streamText.value;
    if (!text) return;

    let content: string;
    let filename: string;
    let mime: string;

    if (format === 'md') {
      content = `# ${agent.value!.name}\n\n${text}`;
      filename = `${agent.value!.name}.md`;
      mime = 'text/markdown';
    } else if (format === 'json') {
      content = JSON.stringify({ agent: agent.value!.name, output: text, project: project!.domain, date: new Date().toISOString() }, null, 2);
      filename = `${agent.value!.name}.json`;
      mime = 'application/json';
    } else {
      content = `"Agent","Output","Project","Date"\n"${agent.value!.name}","${text.replace(/"/g, '""')}","${project!.domain}","${new Date().toISOString()}"`;
      filename = `${agent.value!.name}.csv`;
      mime = 'text/csv';
    }

    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <ProjectContext />
      <div class="page-header">
        <h1>🤖 {agent.value.name}</h1>
        <p>{agent.value.description}</p>
      </div>

      {error.value && <div class="error-banner">{error.value}</div>}

      <form onSubmit={handleExecute} style={{ marginBottom: 24 }}>
        {fields.map(([key, fieldSchema]: [string, any]) => (
          <div class="form-group" key={key}>
            <label class="label">{fieldSchema?.title ?? key}</label>
            {fieldSchema?.type === 'string' && (fieldSchema?.maxLength ?? 500) > 200 ? (
              <textarea
                class="textarea"
                placeholder={fieldSchema?.description ?? `Digite ${key}...`}
                value={inputValues.value[key] ?? ''}
                onInput={(e) => { inputValues.value = { ...inputValues.value, [key]: (e.target as HTMLTextAreaElement).value }; }}
              />
            ) : (
              <input
                class="input"
                type="text"
                placeholder={fieldSchema?.description ?? `Digite ${key}...`}
                value={inputValues.value[key] ?? ''}
                onInput={(e) => { inputValues.value = { ...inputValues.value, [key]: (e.target as HTMLInputElement).value }; }}
              />
            )}
          </div>
        ))}

        <button class="btn btn-primary" type="submit" disabled={executing.value}>
          {executing.value ? '⏳ Executando...' : '▶️ Executar'}
        </button>
      </form>

      {(streamText.value || executing.value) && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <h3 style={{ fontSize: 14, color: 'var(--text-muted)' }}>Resultado</h3>
            {streamText.value && !executing.value && (
              <div style={{ display: 'flex', gap: 6 }}>
                <button class="btn btn-sm btn-secondary" onClick={() => exportAs('md')}>📄 MD</button>
                <button class="btn btn-sm btn-secondary" onClick={() => exportAs('json')}>📋 JSON</button>
                <button class="btn btn-sm btn-secondary" onClick={() => exportAs('csv')}>📊 CSV</button>
              </div>
            )}
          </div>
          <StreamingOutput text={streamText.value} loading={executing.value} />
        </div>
      )}
    </div>
  );
}
