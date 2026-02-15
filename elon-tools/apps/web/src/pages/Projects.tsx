import { signal } from '@preact/signals';
import { projects, createProject, deleteProject, activeProjectId, setActiveProject } from '../stores/project.store';
import { ProjectContext } from '../components/ProjectContext';
import type { Project } from '@elon-tools/shared';

const showModal = signal(false);
const newDomain = signal('');
const newName = signal('');
const newNiche = signal('');
const creating = signal(false);
const error = signal('');

async function handleCreate(e: Event) {
  e.preventDefault();
  creating.value = true;
  error.value = '';
  try {
    await createProject(newDomain.value, newName.value || undefined, newNiche.value || undefined);
    showModal.value = false;
    newDomain.value = '';
    newName.value = '';
    newNiche.value = '';
  } catch (err) {
    error.value = (err as Error).message;
  } finally {
    creating.value = false;
  }
}

function ProjectCard({ project }: { project: Project }) {
  const isActive = activeProjectId.value === project.id;
  const meta = project.metadata as Record<string, unknown>;

  return (
    <div class="card" style={{ borderColor: isActive ? 'var(--primary)' : undefined }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        {project.favicon_url && (
          <img src={project.favicon_url} alt="" style={{ width: 28, height: 28, borderRadius: 4 }}
            onError={(e) => (e.currentTarget.style.display = 'none')} />
        )}
        <div>
          <strong>{project.name ?? project.domain}</strong>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{project.domain}</div>
        </div>
        {isActive && <span class="badge badge-info" style={{ marginLeft: 'auto' }}>Ativo</span>}
      </div>

      {project.niche && <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8 }}>Nicho: {project.niche}</div>}
      
      {Array.isArray(meta?.tech_hints) && meta.tech_hints.length > 0 && (
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>
          Tech: {(meta.tech_hints as string[]).slice(0, 5).join(', ')}
        </div>
      )}

      <div style={{ display: 'flex', gap: 8 }}>
        {!isActive && (
          <button class="btn btn-sm btn-primary" onClick={() => setActiveProject(project.id)}>Ativar</button>
        )}
        <button class="btn btn-sm btn-danger" onClick={() => { if (confirm('Deletar projeto?')) deleteProject(project.id); }}>
          Deletar
        </button>
      </div>
    </div>
  );
}

export function ProjectsPage() {
  return (
    <div>
      <div class="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>📁 Projetos</h1>
          <p>{projects.value.length} projeto(s)</p>
        </div>
        <button class="btn btn-primary" onClick={() => (showModal.value = true)}>+ Adicionar Projeto</button>
      </div>

      {projects.value.length === 0 ? (
        <div class="empty-state">
          <div class="icon">📁</div>
          <h3>Nenhum projeto</h3>
          <p>Crie seu primeiro projeto para começar a usar os agentes.</p>
          <button class="btn btn-primary" style={{ marginTop: 16 }} onClick={() => (showModal.value = true)}>
            + Adicionar Projeto
          </button>
        </div>
      ) : (
        <div class="card-grid">
          {projects.value.map((p) => <ProjectCard key={p.id} project={p} />)}
        </div>
      )}

      {showModal.value && (
        <div class="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) showModal.value = false; }}>
          <div class="modal">
            <h2>Adicionar Projeto</h2>
            {error.value && <div class="error-banner">{error.value}</div>}
            <form onSubmit={handleCreate}>
              <div class="form-group">
                <label class="label">Domínio *</label>
                <input class="input" placeholder="example.com" value={newDomain.value}
                  onInput={(e) => (newDomain.value = (e.target as HTMLInputElement).value)} required />
              </div>
              <div class="form-group">
                <label class="label">Nome (opcional)</label>
                <input class="input" placeholder="Meu Site" value={newName.value}
                  onInput={(e) => (newName.value = (e.target as HTMLInputElement).value)} />
              </div>
              <div class="form-group">
                <label class="label">Nicho (opcional)</label>
                <input class="input" placeholder="E-commerce, SaaS, Blog..." value={newNiche.value}
                  onInput={(e) => (newNiche.value = (e.target as HTMLInputElement).value)} />
              </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button class="btn btn-secondary" type="button" onClick={() => (showModal.value = false)}>Cancelar</button>
                <button class="btn btn-primary" type="submit" disabled={creating.value}>
                  {creating.value ? 'Criando...' : 'Criar Projeto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
