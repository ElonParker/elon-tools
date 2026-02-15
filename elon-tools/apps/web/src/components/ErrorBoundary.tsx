import { Component } from 'preact';

interface State { error: Error | null; }

export class ErrorBoundary extends Component<{ children: any }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div class="error-banner">
          <strong>Erro:</strong> {this.state.error.message}
          <br />
          <button class="btn btn-sm btn-secondary" style={{ marginTop: 8 }} onClick={() => this.setState({ error: null })}>
            Tentar novamente
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
