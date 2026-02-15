import { signal, computed } from '@preact/signals';
import { api } from '../api/client.js';
import type { Project } from '@elon-tools/shared';

export const projects = signal<Project[]>([]);
export const activeProjectId = signal<string | null>(localStorage.getItem('activeProjectId'));
export const projectsLoading = signal(false);

export const activeProject = computed(() =>
  projects.value.find((p) => p.id === activeProjectId.value) ?? null,
);
export const hasProjects = computed(() => projects.value.length > 0);

export async function fetchProjects(): Promise<void> {
  projectsLoading.value = true;
  try {
    const data = await api.get<{ projects: Project[] }>('/projects?limit=100');
    projects.value = data.projects;

    // Auto-select first if none active
    if (!activeProjectId.value && data.projects.length > 0) {
      setActiveProject(data.projects[0]!.id);
    }
  } finally {
    projectsLoading.value = false;
  }
}

export function setActiveProject(id: string): void {
  activeProjectId.value = id;
  localStorage.setItem('activeProjectId', id);
}

export async function createProject(domain: string, name?: string, niche?: string): Promise<Project> {
  const data = await api.post<{ project: Project }>('/projects', { domain, name, niche });
  projects.value = [...projects.value, data.project];
  setActiveProject(data.project.id);
  return data.project;
}

export async function deleteProject(id: string): Promise<void> {
  await api.delete(`/projects/${id}`);
  projects.value = projects.value.filter((p) => p.id !== id);
  if (activeProjectId.value === id) {
    activeProjectId.value = projects.value[0]?.id ?? null;
  }
}
