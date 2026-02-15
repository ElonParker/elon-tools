import { useEffect } from 'preact/hooks';
import { signal } from '@preact/signals';
import { route } from 'preact-router';
import { api } from '../api/client';
import { ProjectContext } from '../components/ProjectContext';
import { Loading } from '../components/Loading';
import { hasProjects } from '../stores/project.store';
import type { Category } from '@elon-tools/shared';

const categories = signal<(Category & { agent_count: number })[]>([]);
const loading = signal(true);

export function HubPage() {
  useEffect(() => {
    if (!hasProjects.value) { route('/projects'); return; }
    api.get<{ categories: (Category & { agent_count: number })[] }>('/categories')
      .then((d) => { categories.value = d.categories; })
      .finally(() => { loading.value = false; });
  }, []);

  if (!hasProjects.value) {
    return (
      <div class="empty-state">
        <div class="icon">📁</div>
        <h3>Adicione um projeto primeiro</h3>
        <p>Você precisa de pelo menos um projeto para acessar as categorias.</p>
        <button class="btn btn-primary" style={{ marginTop: 16 }} onClick={() => route('/projects')}>
          + Adicionar Projeto
        </button>
      </div>
    );
  }

  if (loading.value) return <Loading />;

  return (
    <div>
      <ProjectContext />
      <div class="page-header">
        <h1>🏠 Hub de Categorias</h1>
        <p>Escolha uma categoria para acessar os agentes disponíveis</p>
      </div>

      <div class="card-grid">
        {categories.value.map((cat) => (
          <div key={cat.slug} class="card" style={{ cursor: 'pointer' }} onClick={() => route(`/categories/${cat.slug}`)}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>{cat.icon}</div>
            <h3 style={{ fontSize: 16, marginBottom: 4 }}>{cat.name}</h3>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>{cat.description}</p>
            <span class="badge badge-info">{cat.agent_count} agente(s)</span>
          </div>
        ))}
      </div>
    </div>
  );
}
