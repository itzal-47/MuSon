import { Component, type ReactNode } from 'react';
import { logError } from '@/lib/errorLogging';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

/**
 * Apanha erros de renderização do React (que window.onerror não apanha
 * sempre de forma fiável) e mostra um ecrã amigável em vez de uma página
 * em branco. Regista o erro para o painel de administração poder ver.
 */
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    logError(error, { tipo: 'react_error_boundary', componentStack: info.componentStack });
  }

  handleReload = () => {
    this.setState({ hasError: false });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center px-6 text-center">
          <p className="text-white font-semibold mb-2">Ocorreu um erro inesperado</p>
          <p className="text-neutral-400 text-sm mb-6 max-w-xs">
            Já foi registado. Tenta voltar à página inicial.
          </p>
          <button
            onClick={this.handleReload}
            className="px-6 py-3 rounded-xl accent-gradient text-black font-bold text-sm"
          >
            Voltar ao início
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
