export function Loading({ text = 'Carregando...' }: { text?: string }) {
  return (
    <div class="loading">
      <div class="spinner" style={{ marginRight: 12 }} />
      {text}
    </div>
  );
}
