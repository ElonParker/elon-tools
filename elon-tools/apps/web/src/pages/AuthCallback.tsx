import { useEffect } from 'preact/hooks';
import { signal } from '@preact/signals';
import { api, ApiError } from '../api/client';
import { fetchMe } from '../stores/auth.store';
import { route } from 'preact-router';
import { Loading } from '../components/Loading';

const error = signal('');

export function AuthCallbackPage() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');

    if (!token) {
      error.value = 'Token não encontrado na URL';
      return;
    }

    api.get(`/auth/verify?token=${encodeURIComponent(token)}`)
      .then(async () => {
        await fetchMe();
        route('/');
      })
      .catch((err) => {
        error.value = err instanceof ApiError ? err.message : 'Erro ao verificar token';
      });
  }, []);

  if (error.value) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <div class="card" style={{ maxWidth: 420, textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>❌</div>
          <h2>Erro na verificação</h2>
          <p style={{ color: 'var(--text-muted)', marginTop: 8 }}>{error.value}</p>
          <button class="btn btn-primary" style={{ marginTop: 20 }} onClick={() => route('/login')}>
            Voltar ao login
          </button>
        </div>
      </div>
    );
  }

  return <Loading text="Verificando acesso..." />;
}
