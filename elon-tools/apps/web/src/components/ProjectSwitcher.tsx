import { projects, activeProjectId, setActiveProject, activeProject } from '../stores/project.store';

export function ProjectSwitcher() {
  const list = projects.value;
  const current = activeProject.value;

  if (list.length === 0) return null;

  return (
    <div style={{ padding: '0 16px', marginBottom: 16 }}>
      <label class="label">Projeto ativo</label>
      <select
        class="select"
        value={activeProjectId.value ?? ''}
        onChange={(e) => setActiveProject((e.target as HTMLSelectElement).value)}
      >
        {list.map((p) => (
          <option key={p.id} value={p.id}>
            {p.favicon_url ? '🌐 ' : ''}{p.name ?? p.domain}
          </option>
        ))}
      </select>
      {current && (
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4, padding: '0 2px' }}>
          {current.domain} {current.niche ? `· ${current.niche}` : ''}
        </div>
      )}
    </div>
  );
}
