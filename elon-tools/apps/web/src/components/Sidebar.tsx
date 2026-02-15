import { route } from 'preact-router';
import { isAdmin, user, logout } from '../stores/auth.store';
import { ProjectSwitcher } from './ProjectSwitcher';
import { CATEGORIES } from '@elon-tools/shared';

export function Sidebar() {
  const path = window.location.pathname;

  return (
    <nav class="sidebar">
      <div style={{ padding: '0 16px', marginBottom: 24 }}>
        <h1 style={{ fontSize: 20, fontWeight: 800 }}>⚡ ElonTools</h1>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
          {user.value?.email}
        </div>
      </div>

      <ProjectSwitcher />

      <div class="sidebar-section">
        <div class="sidebar-title">Menu</div>
        <div class={`sidebar-item ${path === '/' ? 'active' : ''}`} onClick={() => route('/')}>
          <span class="icon">🏠</span> Hub
        </div>
        <div class={`sidebar-item ${path === '/projects' ? 'active' : ''}`} onClick={() => route('/projects')}>
          <span class="icon">📁</span> Projetos
        </div>
        <div class={`sidebar-item ${path === '/history' ? 'active' : ''}`} onClick={() => route('/history')}>
          <span class="icon">📜</span> Histórico
        </div>
      </div>

      <div class="sidebar-section">
        <div class="sidebar-title">Categorias</div>
        {CATEGORIES.map((cat) => (
          <div
            key={cat.slug}
            class={`sidebar-item ${path === `/categories/${cat.slug}` ? 'active' : ''}`}
            onClick={() => route(`/categories/${cat.slug}`)}
          >
            <span class="icon">{cat.icon}</span>
            <span style={{ fontSize: 13 }}>{cat.name}</span>
          </div>
        ))}
      </div>

      {isAdmin.value && (
        <div class="sidebar-section">
          <div class="sidebar-title">Admin</div>
          <div class={`sidebar-item ${path === '/admin' ? 'active' : ''}`} onClick={() => route('/admin')}>
            <span class="icon">⚙️</span> Painel Admin
          </div>
        </div>
      )}

      <div style={{ marginTop: 'auto', padding: '16px' }}>
        <button class="btn btn-secondary btn-sm" style={{ width: '100%' }} onClick={logout}>
          Sair
        </button>
      </div>
    </nav>
  );
}
