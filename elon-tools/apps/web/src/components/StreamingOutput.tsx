import { signal } from '@preact/signals';

interface Props {
  text: string;
  loading: boolean;
}

export function StreamingOutput({ text, loading }: Props) {
  return (
    <div class="stream-output">
      {text || (loading ? '' : <span style={{ color: 'var(--text-muted)' }}>Aguardando resposta...</span>)}
      {loading && <span class="stream-cursor" />}
    </div>
  );
}
