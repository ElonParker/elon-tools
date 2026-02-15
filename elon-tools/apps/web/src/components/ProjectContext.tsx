import { activeProject } from '../stores/project.store';

export function ProjectContext() {
  const project = activeProject.value;
  if (!project) return null;

  return (
    <div class="project-context">
      {project.favicon_url && (
        <img src={project.favicon_url} alt="" onError={(e) => (e.currentTarget.style.display = 'none')} />
      )}
      <div>
        <strong>{project.name ?? project.domain}</strong>
        <div class="domain">
          {project.domain}
          {project.niche && <span> · {project.niche}</span>}
        </div>
      </div>
    </div>
  );
}
