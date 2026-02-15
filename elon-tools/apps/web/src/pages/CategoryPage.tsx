import { useEffect } from 'preact/hooks';
import { signal } from '@preact/signals';
import { route } from 'preact-router';
import { api } from '../api/client';
import { ProjectContext } from '../components/ProjectContext';
import { Loading } from '../components/Loading';
import type { Category, Agent } from '@elon-tools/shared';

const category = signal<Category | null>(null);
const agents = signal<Agent[]>([]);
const loading = signal(true);

export function CategoryPage({ slug }: { slug: string }) {
  useEffect(() => {
    loading.value = true;
    api.get<{ category: Category; agents: Agent[] }>(`/categories/${slug}`)
      .then((d) => { category.value = d.category; agents.value = d.agents; })
      .finally(() => { loading.value = false; });
  }, [slug]);

  if (loading.value) return <Loading />;
  if (!category.value) return <div class="error-banner">Categoria não encontrada</div>;

  return (
    <div>
      <ProjectContext />
      <div class="page-header">
        <h1>{category.value.icon} {category.value.name}</h1>
        <p>{category.value.description}</p>
      </div>

      {agents.value.length === 0 ? (
        <div class="empty-state">
          <div class="icon">🤖</div>
          <h3>Nenhum agente nesta categoria</h3>
          <p>O admin ainda não configurou agentes para esta categoria.</p>
        </div>
      ) : (
        <div class="card-grid">
          {agents.value.map((agent) => (
            <div key={agent.id} class="card" style={{ cursor: 'pointer' }} onClick={() => route(`/agents/${agent.id}`)}>
              <h3 style={{ fontSize: 16, marginBottom: 4 }}>{agent.name}</h3>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>{agent.description}</p>
              <span class="badge badge-success">v{agent.current_config_version}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
