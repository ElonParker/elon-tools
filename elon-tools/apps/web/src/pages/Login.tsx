import { signal } from '@preact/signals';
import { api, ApiError } from '../api/client';

const email = signal('');
const loading = signal(false);
const sent = signal(false);
const error = signal('');

declare global {
  interface Window { turnstile: any; }
}

async function handleSubmit(e: Event) {
  e.preventDefault();
  error.value = '';
  loading.value = true;

  try {
    // Get Turnstile token
    const turnstileToken = (document.querySelector('[name="cf-turnstile-response"]') as HTMLInputElement)?.value ?? 'dev-token';

    await api.post('/auth/magic-link', {
      email: email.value,
      turnstileToken,
    });
    sent.value = true;
  } catch (err) {
    error.value = err instanceof ApiError ? err.message : 'Erro ao enviar link';
  } finally {
    loading.value = false;
  }
}

export function LoginPage() {
  if (sent.value) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <div class="card" style={{ maxWidth: 420, textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📧</div>
          <h2>Verifique seu email</h2>
          <p style={{ color: 'var(--text-muted)', marginTop: 8 }}>
            Enviamos um link de acesso para <strong>{email.value}</strong>.
            <br />O link expira em 15 minutos.
          </p>
          <button class="btn btn-secondary" style={{ marginTop: 20 }} onClick={() => { sent.value = false; }}>
            Tentar outro email
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
      <div class="card" style={{ maxWidth: 420, width: '100%' }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 4 }}>⚡ ElonTools</h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: 24 }}>Entre com seu email para acessar</p>

        {error.value && <div class="error-banner">{error.value}</div>}

        <form onSubmit={handleSubmit}>
          <div class="form-group">
            <label class="label">Email</label>
            <input
              class="input"
              type="email"
              placeholder="seu@email.com"
              value={email.value}
              onInput={(e) => (email.value = (e.target as HTMLInputElement).value)}
              required
            />
          </div>

          <div class="form-group">
            <div class="cf-turnstile" data-sitekey="1x00000000000000000000AA" data-theme="dark" />
          </div>

          <button class="btn btn-primary" style={{ width: '100%' }} type="submit" disabled={loading.value}>
            {loading.value ? 'Enviando...' : 'Enviar link de acesso'}
          </button>
        </form>
      </div>
    </div>
  );
}
