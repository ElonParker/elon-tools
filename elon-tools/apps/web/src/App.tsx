import Router from 'preact-router';
import { useEffect } from 'preact/hooks';
import { fetchMe, user, authLoading, isLoggedIn } from './stores/auth.store';
import { fetchProjects, hasProjects } from './stores/project.store';
import { Sidebar } from './components/Sidebar';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Loading } from './components/Loading';
import { LoginPage } from './pages/Login';
import { AuthCallbackPage } from './pages/AuthCallback';
import { HubPage } from './pages/Hub';
import { ProjectsPage } from './pages/Projects';
import { CategoryPage } from './pages/CategoryPage';
import { AgentViewPage } from './pages/AgentView';
import { HistoryPage } from './pages/History';
import { AdminPage } from './pages/Admin';

export function App() {
  useEffect(() => {
    fetchMe().then(() => {
      if (user.value) fetchProjects();
    });
  }, []);

  if (authLoading.value) return <Loading text="Carregando ElonTools..." />;

  // Public routes
  if (!isLoggedIn.value) {
    return (
      <Router>
        <AuthCallbackPage path="/auth/callback" />
        <LoginPage default />
      </Router>
    );
  }

  return (
    <div class="app-layout">
      <Sidebar />
      <main class="main-content">
        <ErrorBoundary>
          <Router>
            <HubPage path="/" />
            <ProjectsPage path="/projects" />
            <CategoryPage path="/categories/:slug" />
            <AgentViewPage path="/agents/:id" />
            <HistoryPage path="/history" />
            <AdminPage path="/admin" />
            <HubPage default />
          </Router>
        </ErrorBoundary>
      </main>
    </div>
  );
}
